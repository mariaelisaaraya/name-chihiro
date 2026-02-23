# Chihiro's Lost Name - Soroban Smart Contracts

Zero-knowledge gaming on Stellar blockchain with Game Hub integration.

## Overview

This directory contains the Soroban smart contracts that power the on-chain verification and game state management for Chihiro's Lost Name.

## Hackathon Requirements Checklist

| Requirement | Status | Detail |
|---|---|---|
| ZK as core mechanic | ✓ | Poseidon2 hash preimage proof (Noir UltraHonk) |
| `start_game()` called | ✓ | In `initialize()` → returns `game_id: u64` |
| `end_game()` called | ✓ | In `recover_name()` with winner = player2 |
| Game Hub contract | ✓ | `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG` |
| Frontend UI | ✓ | gitBDB React app with Spirit World theme |
| Open-source repo | ✓ | Public GitHub required for submission |
| Video demo | ⏳ | Record 2-3 min walkthrough |

---

## 🏗️ Architecture

```
PLAYER (browser)
   │
   ├─ 1. Enter nameSecret + salt
   │     → JS computes: nameCommit = Poseidon2(secret, salt)
   │
   ├─ 2. Admin calls initialize()  ← DEPLOYS GAME
   │     → contract calls: game_hub.start_game(player1, player2)
   │     → game_hub returns: game_id (u64)
   │     → stores: nameCommit, game_id, player addresses
   │
   ├─ 3. Player does Git ritual in terminal
   │     git checkout -b rescue/chihiro
   │     git commit --allow-empty -m "clue:1"
   │     git commit --allow-empty -m "clue:2"
   │     git commit --allow-empty -m "clue:3"
   │     (validated by GitHub API or local isomorphic-git)
   │
   ├─ 4. Player generates ZK proof (Noir.js + Barretenberg WASM)
   │     private inputs: nameSecret, salt
   │     public inputs:  nameCommit (on-chain hash)
   │     → proof: ~2-8 KB bytes
   │
   └─ 5. Player calls recover_name(proof, [nameCommit])
         → contract calls: ultrahonk_verifier.verify(proof, [nameCommit], vk)
         → if valid: contract calls: game_hub.end_game(game_id, player2)
                     player2 WINS 🏆
                     event: WIN(player2, game_id, nameCommit)
```

---

## 📋 Game Hub Contract Calls

### `start_game(player1: Address, player2: Address) → u64`
```rust
// In initialize():
let game_hub = GameHubClient::new(&env, &game_hub_contract);
let game_id: u64 = game_hub.start_game(&admin, &player2);
// game_id stored for later use in end_game
```

### `end_game(game_id: u64, winner: Address)`
```rust
// In recover_name() — only called after ZK proof is verified:
let game_hub = GameHubClient::new(&env, &game_hub_addr);
game_hub.end_game(&game_id, &player2);  // player2 = Chihiro = challenger = winner
```

**Game Hub Address (Testnet):**
`CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

---

## 🔮 ZK Mechanic

**Circuit** (`gitBDB-circuits/chihiro-name/src/main.nr`):
```noir
fn main(
    name_secret: Field,   // PRIVATE — never revealed
    salt: Field,          // PRIVATE — never revealed
    pub name_commit: Field // PUBLIC — on-chain hash
) {
    let computed = Poseidon2::hash([name_secret, salt], 2);
    assert(computed == name_commit);
}
```

**Why this is real ZK gameplay:**
- Yubaba "stole your name" = stored `nameCommit` on-chain (just a hash)
- Chihiro proves she knows the preimage — *without revealing the name*
- The blockchain verifies this math on-chain — no trusted server, no "trust me"
- Protocol 25 (X-Ray) gives Stellar the BN254 + Poseidon2 primitives needed

---

## 🚀 Running Locally

```bash
# Frontend
cd gitBDB
npm install && npm run dev
# → http://localhost:5173
# Navigate to "🌊 Chihiro's Lost Name"

# Build contract
cd gitBDB-contracts/chihiro-game
cargo install --locked stellar-cli --features opt
rustup target add wasm32v1-none
stellar contract build
```

## 🌐 Deploy to Testnet

```bash
# Generate testnet accounts
stellar keys generate admin --network testnet
stellar keys generate player2 --network testnet

# Fund accounts
stellar keys fund admin --network testnet
stellar keys fund player2 --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/chihiro_game.wasm \
  --source admin \
  --network testnet

# Initialize — this calls start_game() on the hub
stellar contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin) \
  --player2 $(stellar keys address player2) \
  --name_commit <POSEIDON2_HASH_HEX> \
  --game_hub_contract CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG \
  --verifier_contract <ULTRAHONK_VERIFIER_ID> \
  --verification_key <NOIR_VK_BYTES_HEX>
```

## 🎓 For the Git Class Demo

**Why Git branches as gameplay mechanics?**

> "Una rama en Git no es solo `feature/login`. En este juego, `rescue/chihiro` es el ritual que inicia el hechizo ZK. Los mensajes de commit son las palabras del hechizo — si escribís `clue:1`, `clue:2`, `clue:3` en el orden correcto, activás el proof. Git log es tu historial mágico."

**What students learn:**
1. `git checkout -b` — branches as named workspaces
2. `git commit -m` — commit messages as structured, exact data  
3. `git log` — immutable history as proof of work
4. ZK proofs — "sé algo sin decirlo" (know something without saying it)

**The dual pitch:**
- 🎓 **For class:** Git branches/commits as interactive puzzle elements
- 🏆 **For hackathon:** ZK verification on Stellar with Game Hub integration

---

*"Without a name, we have no sense of self. With ZK, we prove our name without speaking it."*
