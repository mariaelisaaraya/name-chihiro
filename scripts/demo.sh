#!/usr/bin/env bash
# scripts/demo.sh — Run all components of the Chihiro's Lost Name project
# Usage: ./scripts/demo.sh [frontend|circuits|contracts|all]

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-all}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
step() { echo -e "\n${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# ── Frontend ──────────────────────────────────────────────────────
run_frontend() {
  step "Frontend — gitBDB (React + isomorphic-git)"
  cd "$ROOT/gitBDB"

  if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
  fi

  step "Running unit tests (gitService + branch/checkout)"
  npm run test
  ok "All tests passed"

  step "Starting dev server → http://localhost:5173"
  npm run dev
}

# ── ZK Circuit ───────────────────────────────────────────────────
run_circuits() {
  step "ZK Circuit — Noir UltraHonk (chihiro-name)"
  CIRCUIT_DIR="$ROOT/gitBDB-circuits/chihiro-name"

  if [ ! -d "$CIRCUIT_DIR" ]; then
    warn "Circuit directory not found: $CIRCUIT_DIR"
    return 1
  fi

  cd "$CIRCUIT_DIR"

  if ! command -v nargo &> /dev/null; then
    warn "nargo not found. Install with: curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash && noirup"
    return 1
  fi

  echo "nargo version: $(nargo --version)"
  nargo test
  ok "Circuit tests passed"

  echo ""
  echo "To compile the circuit for browser use:"
  echo "  nargo build"
  echo "  # → target/chihiro_name.json"
}

# ── Soroban Contract ──────────────────────────────────────────────
run_contracts() {
  step "Soroban Contract — ChihiroGame (Rust)"
  CONTRACT_DIR="$ROOT/gitBDB-contracts"

  if [ ! -d "$CONTRACT_DIR" ]; then
    warn "Contract directory not found: $CONTRACT_DIR"
    return 1
  fi

  cd "$CONTRACT_DIR"

  if ! command -v cargo &> /dev/null; then
    warn "cargo not found. Install Rust from https://rustup.rs"
    return 1
  fi

  echo "cargo version: $(cargo --version)"
  cargo test
  ok "Contract tests passed"

  echo ""
  echo "To deploy to Stellar testnet:"
  echo "  cargo build --target wasm32v1-none --release"
  echo "  stellar contract upload --wasm target/wasm32v1-none/release/chihiro_game.wasm --source admin --network testnet"
  echo "  stellar contract deploy --wasm-hash <HASH> --source admin --network testnet"
}

# ── Main ──────────────────────────────────────────────────────────
echo -e "${CYAN}"
echo "  🌊 Chihiro's Lost Name — gitBDB"
echo "  Stellar Hacks: ZK Gaming Edition"
echo -e "${NC}"

case "$MODE" in
  frontend)   run_frontend ;;
  circuits)   run_circuits ;;
  contracts)  run_contracts ;;
  all)
    run_circuits  || warn "Circuit step skipped (nargo not installed)"
    run_contracts || warn "Contract step skipped (cargo not installed)"
    run_frontend  # always last — starts the dev server
    ;;
  *)
    echo "Usage: $0 [frontend|circuits|contracts|all]"
    exit 1
    ;;
esac
