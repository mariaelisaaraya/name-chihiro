# Chihiro's Lost Name

**ZK identity game on Stellar — prove who you are without revealing your secret.**

> Inspired by *Spirited Away*: the witch Yubaba steals Chihiro's name. To get it back, Chihiro must prove she knows it — using a zero-knowledge proof. The secret never leaves the browser, but the claim is verified on-chain.

Built for **Stellar Hacks: ZK Gaming** hackathon.

**[Play Now](https://name-zk.vercel.app)** · [Contract on Stellar](https://stellar.expert/explorer/testnet/contract/CDAOPCSKDCCJM2OCMIV6FLOWABAEBNZ455BFZ7JRZOVA7OKMY4DWNRQQ)

---

## How It Works

Two players connect with separate Stellar wallets:

| Step | Role | Action |
|------|------|--------|
| 1 | **Admin (Yubaba)** | Enters a secret name + salt, generates Poseidon2 commitment |
| 2 | **Admin** | Calls `initialize()` → stores commitment on-chain + `start_game()` |
| 3 | **Player (Chihiro)** | Completes git ritual: `rescue/` branch + 3 clue commits |
| 4 | **Player** | Enters same secret + salt, generates UltraHonk proof in browser |
| 5 | **Player** | Calls `recover_name()` → proof verified on-chain → `end_game()` 🏆 |

The secret **never leaves the browser**. Only the Poseidon2 hash is stored on-chain. The ZK proof demonstrates knowledge of the preimage without revealing it.

## Features

- **In-browser ZK proofs** — Noir circuits compiled to WASM, UltraHonk proving runs entirely client-side
- **On-chain verification** — Soroban smart contract verifies proofs via UltraHonk BN254 verifier
- **Git simulator** — Interactive terminal with isomorphic-git running in the browser
- **Game Hub integration** — `start_game()` / `end_game()` for hackathon compliance
- **VS Code-like UI** — Terminal, editor panels, git graph visualizer
- **i18n** — English and Spanish

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 7 |
| Git Simulator | isomorphic-git + LightningFS |
| Code Editor | CodeMirror 6 |
| ZK Circuits | Noir 1.0.0-beta.16 |
| ZK Proving | UltraHonk (Aztec bb.js WASM) |
| Smart Contract | Soroban (Rust, soroban-sdk 22.1) |
| Blockchain | Stellar Testnet (Protocol 25) |
| Wallet | Stellar Wallets Kit v2 (Freighter) |
| i18n | i18next + react-i18next |
| Testing | Vitest |

## Quick Start

```bash
cd gitBDB
npm install
npm run dev          # localhost:5173
```

The compiled Noir circuits are included in `public/circuits/` — no need to install nargo to run the app.

## Project Structure

```
gitBDB/                           # React frontend (Vite)
├── src/
│   ├── components/
│   │   ├── chihiro/              # ZK panel, wallet, role selector
│   │   └── git-visualizer/       # Git graph, branches, commits
│   ├── stellar/                  # Soroban client, wallet integration
│   ├── zk/                       # In-browser ZK engine (Noir + UltraHonk)
│   └── shims/                    # Pino shim for bb.js browser compat
├── public/
│   ├── circuits/                 # Pre-compiled Noir artifacts (JSON)
│   └── locales/                  # i18n translations (en, es)
│
gitBDB-circuits/
├── chihiro-name/                 # Proves Poseidon2(secret, salt) == commit
└── chihiro-commit/               # Computes Poseidon2 hash (helper circuit)
│
gitBDB-contracts/
└── chihiro-game/                 # Soroban: initialize, recover_name, game hub
```

## ZK Circuits

Two Noir circuits run entirely in the browser via WASM:

**chihiro-commit** — Computes `Poseidon2([secret, salt, 0, 0], 4)[0]` and returns the hash. No assertion — used to discover the commitment value.

**chihiro-name** — Proves that `Poseidon2(secret, salt) == name_commit` without revealing `secret` or `salt`. The commitment is the only public input.

## Smart Contracts

Deployed on Stellar Testnet:

| Contract | Address |
|----------|---------|
| ChihiroGame | `CDAOPCSKDCCJM2OCMIV6FLOWABAEBNZ455BFZ7JRZOVA7OKMY4DWNRQQ` |
| UltraHonk Verifier | `CB2AU4EVLO6RJ3PTFAYNZRB5OR57B43EFRZHYMRMPZVUUNVKQ6V7Y4FL` |
| Game Hub | `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG` |

**Functions:** `initialize` · `recover_name` · `get_game_status` · `get_name_commit` · `get_players`

## Building from Source

```bash
# Circuits (requires nargo 1.0.0-beta.16)
cd gitBDB-circuits/chihiro-name && nargo compile
cd gitBDB-circuits/chihiro-commit && nargo compile

# Contract (requires stellar CLI + Rust wasm32v1-none target)
cd gitBDB-contracts/chihiro-game
stellar contract build
stellar keys generate deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/chihiro_game.wasm \
  --network testnet --source deployer
```

## Environment Variables

```env
VITE_CHIHIRO_CONTRACT_ID=CDAOPCSKDCCJM2OCMIV6FLOWABAEBNZ455BFZ7JRZOVA7OKMY4DWNRQQ
VITE_ULTRAHONK_VERIFIER_ID=CB2AU4EVLO6RJ3PTFAYNZRB5OR57B43EFRZHYMRMPZVUUNVKQ6V7Y4FL
```

## Wallet

Install [Freighter](https://freighter.app) browser extension. Switch to **Testnet** in settings.

## License

MIT

## Credits

Inspired by *Spirited Away* (千と千尋の神隠し) by Studio Ghibli.

Built with [Noir](https://noir-lang.org), [Aztec bb.js](https://github.com/AztecProtocol/aztec-packages), and [Stellar Soroban](https://soroban.stellar.org).
