#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contractclient, contracterror,
    Bytes, BytesN, Env, Address, Vec,
    symbol_short, panic_with_error,
};

// ─── External: Game Hub ───────────────────────────────────────────────────────
// Mock contract deployed by hackathon organizers on testnet.
// Address: CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
// REQUIRED: must call start_game() + end_game() for hackathon compliance.
#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(env: Env, game_id: Address, session_id: u32, player1: Address, player2: Address, player1_points: i128, player2_points: i128);
    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

// ─── External: UltraHonk Verifier ────────────────────────────────────────────
// Verifies Noir UltraHonk proofs using BN254 (Protocol 25 / X-Ray).
// Source: https://github.com/yugocabrio/rs-soroban-ultrahonk
#[contractclient(name = "UltraHonkVerifierClient")]
pub trait UltraHonkVerifier {
    fn verify(
        env: Env,
        proof: Bytes,
        public_inputs: Vec<BytesN<32>>,
        vk: Bytes,
    ) -> bool;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
// Using a single enum avoids key collisions and keeps storage typed.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,           // Address  — player1, who initializes the game
    Player2,         // Address  — player2, Chihiro, the challenger
    NameCommit,      // BytesN<32> — Poseidon2(secret, salt), stored publicly
    GameHub,         // Address  — hackathon Game Hub contract
    Verifier,        // Address  — UltraHonk verifier contract
    Vk,              // Bytes    — Noir verification key
    GameId,          // u32      — session_id
    Initialized,     // bool     — set once in initialize(), guards double-init
    Ended,           // bool     — set in recover_name() after win
}

// ─── Errors ───────────────────────────────────────────────────────────────────
// Explicit typed errors are better than raw panics — they show up in the
// transaction result and are easier to handle in the frontend.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    AlreadyEnded       = 3,
    WrongPublicInput   = 4, // public_inputs[0] != stored nameCommit
    ProofInvalid       = 5,
    NotPlayer2         = 6, // only player2 can call recover_name
}

// ─── Contract ─────────────────────────────────────────────────────────────────
#[contract]
pub struct ChihiroGame;

#[contractimpl]
impl ChihiroGame {

    /// Admin (player1) sets up the game.
    ///
    /// Stores nameCommit on-chain and registers the game with the Game Hub.
    /// name_commit = Poseidon2(name_secret, salt) — computed browser-side.
    /// The secret never leaves the browser; only this hash is stored.
    pub fn initialize(
        env: Env,
        admin: Address,
        player2: Address,
        name_commit: BytesN<32>,
        game_hub: Address,
        verifier: Address,
        vk: Bytes,
    ) {
        // Guard: one-time initialization only
        if env.storage().instance().has(&DataKey::Initialized) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        // admin must sign this transaction
        admin.require_auth();

        // Register the game with the Game Hub (hackathon requirement)
        let hub = GameHubClient::new(&env, &game_hub);
        let session_id: u32 = env.ledger().sequence() as u32;
        hub.start_game(&env.current_contract_address(), &session_id, &admin, &player2, &0i128, &0i128);
        let game_id = session_id;

        // Store all state in instance storage (cheaper than persistent for
        // data that lives exactly as long as the contract)
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Player2, &player2);
        env.storage().instance().set(&DataKey::NameCommit, &name_commit);
        env.storage().instance().set(&DataKey::GameHub, &game_hub);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Vk, &vk);
        env.storage().instance().set(&DataKey::GameId, &game_id);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Ended, &false);

        env.events().publish((symbol_short!("INIT"),), (admin, player2, name_commit, game_id));
    }

    /// Player2 (Chihiro) recovers her name by submitting a ZK proof.
    ///
    /// The proof demonstrates knowledge of (name_secret, salt) such that
    /// Poseidon2(name_secret, salt) == name_commit, WITHOUT revealing them.
    ///
    /// On success: calls game_hub.end_game(game_id, player2) — player2 wins.
    pub fn recover_name(
        env: Env,
        player: Address,
        proof: Bytes,
        public_inputs: Vec<BytesN<32>>,
    ) -> bool {
        // Only callable after initialize()
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic_with_error!(&env, Error::NotInitialized);
        }

        // Game can only be won once
        let ended: bool = env.storage().instance()
            .get(&DataKey::Ended).unwrap_or(false);
        if ended {
            panic_with_error!(&env, Error::AlreadyEnded);
        }

        // Only player2 can submit the proof
        let player2: Address = env.storage().instance().get(&DataKey::Player2).unwrap();
        if player != player2 {
            panic_with_error!(&env, Error::NotPlayer2);
        }
        player.require_auth();

        // The circuit exposes exactly one public input: nameCommit.
        // Reject anything else — wrong count is as bad as wrong value.
        let name_commit: BytesN<32> = env.storage().instance().get(&DataKey::NameCommit).unwrap();
        if public_inputs.len() != 1 || public_inputs.get(0).unwrap() != name_commit {
            panic_with_error!(&env, Error::WrongPublicInput);
        }

        // Verify the ZK proof on-chain via UltraHonk (BN254 / Protocol 25)
        let verifier_addr: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        let vk: Bytes = env.storage().instance().get(&DataKey::Vk).unwrap();
        let verifier = UltraHonkVerifierClient::new(&env, &verifier_addr);
        let valid = verifier.verify(&proof, &public_inputs, &vk);
        if !valid {
            panic_with_error!(&env, Error::ProofInvalid);
        }

        // Close the game on the Game Hub — player2 wins (hackathon requirement)
        let hub_addr: Address = env.storage().instance().get(&DataKey::GameHub).unwrap();
        let game_id: u32 = env.storage().instance().get(&DataKey::GameId).unwrap();
        let hub = GameHubClient::new(&env, &hub_addr);
        hub.end_game(&game_id, &true);

        env.storage().instance().set(&DataKey::Ended, &true);
        env.events().publish((symbol_short!("WIN"),), (player2, game_id, name_commit));

        true
    }

    // ─── View functions (read-only, free to call) ─────────────────────────────

    pub fn get_name_commit(env: Env) -> BytesN<32> {
        env.storage().instance().get(&DataKey::NameCommit).unwrap()
    }

    pub fn get_game_status(env: Env) -> (u32, bool, bool) {
        let game_id: u32 = env.storage().instance().get(&DataKey::GameId).unwrap_or(0);
        let started: bool = env.storage().instance().has(&DataKey::Initialized);
        let ended: bool = env.storage().instance().get(&DataKey::Ended).unwrap_or(false);
        (game_id, started, ended)
    }

    pub fn get_players(env: Env) -> (Address, Address) {
        (
            env.storage().instance().get(&DataKey::Admin).unwrap(),
            env.storage().instance().get(&DataKey::Player2).unwrap(),
        )
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, soroban_sdk::Address, ChihiroGameClient) {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, ChihiroGame);
        let client = ChihiroGameClient::new(&env, &id);
        (env, id, client)
    }

    #[test]
    fn initial_status_is_empty() {
        let (_, _, client) = setup();
        let (game_id, started, ended) = client.get_game_status();
        assert_eq!(game_id, 0);
        assert!(!started);
        assert!(!ended);
    }

    // Full flow test with mocked external contracts would go here.
    // To mock GameHub + UltraHonkVerifier, register mock contracts
    // that return expected values, then call initialize() + recover_name().
}
