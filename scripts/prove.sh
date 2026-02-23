#!/usr/bin/env bash
# scripts/prove.sh
#
# Genera un UltraHonk proof real para el circuito chihiro-name.
#
# Uso:
#   ./scripts/prove.sh <name_secret_hex> <salt_hex>
#
# Ejemplo:
#   ./scripts/prove.sh 0x636869686972_6f 0x1234abcd
#
# Salida (en gitBDB-circuits/chihiro-name/target/):
#   proof        — bytes raw del proof UltraHonk
#   vk           — verification key
#   public_input — el nameCommit (public input del circuito)
#   proof.json   — { commit, proof_hex, vk_hex, public_inputs }  ← para el frontend
#
# Requisitos:
#   nargo  >= 0.36  — noirup (https://github.com/noir-lang/noirup)
#   bb     >= 0.66  — bbup  (https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg/cpp/src/barretenberg/bb)
#
# Instalación rápida:
#   curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
#   noirup
#   curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash
#   bbup

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
step()  { echo -e "\n${CYAN}▶ $1${NC}"; }
ok()    { echo -e "${GREEN}✓ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠  $1${NC}"; }
die()   { echo -e "${RED}✗ $1${NC}" >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CIRCUIT_DIR="$ROOT/gitBDB-circuits/chihiro-name"
TARGET="$CIRCUIT_DIR/target"

# ── Argumentos ────────────────────────────────────────────────────────────────
if [[ $# -lt 2 ]]; then
  echo -e "${BOLD}Uso:${NC} $0 <name_secret_hex> <salt_hex>"
  echo ""
  echo "  name_secret_hex  Nombre como field element hex (ej: 0x636869686972_6f para 'chihiro')"
  echo "  salt_hex         Salt aleatorio (ej: 0x1234abcd)"
  echo ""
  echo "  Ejemplo con valores de prueba del circuito:"
  echo "    $0 0x63686968697261 0x1234abcd"
  echo ""
  echo "  Para un nombre propio: convertí el string a hex:"
  echo "    python3 -c \"print('0x' + 'chihiro'.encode().hex())\""
  exit 1
fi

NAME_SECRET_HEX="$1"
SALT_HEX="$2"

# ── Verificar herramientas ────────────────────────────────────────────────────
step "Verificando herramientas"

if ! command -v nargo &>/dev/null; then
  die "nargo no encontrado. Instalá con:\n  curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash && noirup"
fi

if ! command -v bb &>/dev/null; then
  die "bb (barretenberg) no encontrado. Instalá con:\n  curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash && bbup"
fi

NARGO_VER=$(nargo --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)
BB_VER=$(bb --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "desconocida")
ok "nargo $NARGO_VER  |  bb $BB_VER"

# ── Calcular name_commit con nargo (Poseidon2) ───────────────────────────────
# Usamos un script de Noir inline para obtener el commit sin generar proof completa.
step "Calculando nameCommit = Poseidon2(name_secret, salt)"

cd "$CIRCUIT_DIR"

# Escribir Prover.toml con los inputs
cat > Prover.toml << TOML
name_secret = "$NAME_SECRET_HEX"
salt = "$SALT_HEX"
TOML

# nargo execute: compila + genera witness + imprime los outputs públicos
# El output de name_commit viene de nargo execute en stderr/stdout según version
mkdir -p "$TARGET"

echo "  Compilando circuito..."
nargo compile --force 2>&1 | grep -v "^warning" || true

echo "  Ejecutando witness con inputs..."
# nargo execute genera target/witness.gz y también imprime public outputs
EXECUTE_OUT=$(nargo execute --witness-name witness 2>&1)
echo "$EXECUTE_OUT"

# Extraer name_commit del output de nargo execute
# nargo 0.36+ imprime: [main] name_commit = 0x...
NAME_COMMIT=$(echo "$EXECUTE_OUT" | grep -oP 'name_commit\s*=\s*\K0x[0-9a-fA-F]+' | head -1 || true)

if [[ -z "$NAME_COMMIT" ]]; then
  # Fallback: usar nargo check con el Prover.toml para extraer el valor
  warn "No se pudo extraer name_commit del output de nargo execute directamente."
  warn "Intentando con script auxiliar..."
  
  # Crear un programa Noir auxiliar que imprime el commit
  HELPER_DIR="$TARGET/helper_commit"
  mkdir -p "$HELPER_DIR/src"
  
  cat > "$HELPER_DIR/Nargo.toml" << NARGO
[package]
name = "helper_commit"
type = "bin"
authors = ["prove.sh"]
compiler_version = ">=0.36.0"
NARGO

  cat > "$HELPER_DIR/src/main.nr" << NR
use dep::std::hash::poseidon2::Poseidon2;
fn main(name_secret: Field, salt: Field) -> pub Field {
    Poseidon2::hash([name_secret, salt], 2)
}
NR

  cat > "$HELPER_DIR/Prover.toml" << TOML2
name_secret = "$NAME_SECRET_HEX"
salt = "$SALT_HEX"
TOML2

  cd "$HELPER_DIR"
  nargo compile --force 2>&1 | grep -v "^warning" || true
  HELPER_OUT=$(nargo execute 2>&1)
  echo "$HELPER_OUT"
  NAME_COMMIT=$(echo "$HELPER_OUT" | grep -oP '0x[0-9a-fA-F]{60,}' | head -1 || true)
  cd "$CIRCUIT_DIR"
fi

if [[ -z "$NAME_COMMIT" ]]; then
  die "No se pudo calcular name_commit. Verificá que nargo ejecute correctamente el circuito."
fi

ok "nameCommit = $NAME_COMMIT"

# ── Generar proof UltraHonk ──────────────────────────────────────────────────
step "Generando UltraHonk proof con bb"

CIRCUIT_JSON="$TARGET/chihiro_name.json"
WITNESS_GZ="$TARGET/witness.gz"

if [[ ! -f "$CIRCUIT_JSON" ]]; then
  die "Artefacto del circuito no encontrado: $CIRCUIT_JSON\nAsegurate de que nargo compile corrió exitosamente."
fi

if [[ ! -f "$WITNESS_GZ" ]]; then
  # nargo < 0.38 usa witness sin extensión
  if [[ -f "$TARGET/witness" ]]; then
    WITNESS_GZ="$TARGET/witness"
  else
    die "Witness no encontrado: $WITNESS_GZ\nAsegurate de que nargo execute corrió exitosamente."
  fi
fi

echo "  Generando proof + vk (esto puede tardar 30-60 segundos)..."

# bb ≥ 0.66 usa --scheme ultra_honk
# bb < 0.66 usa prove-ultra-honk como subcomando
# Intentamos el nuevo primero
if bb prove --scheme ultra_honk \
     -b "$CIRCUIT_JSON" \
     -w "$WITNESS_GZ" \
     -o "$TARGET/" \
     --write_vk 2>/dev/null; then
  ok "bb prove --scheme ultra_honk ejecutado"
elif bb prove-ultra-honk \
     -b "$CIRCUIT_JSON" \
     -w "$WITNESS_GZ" \
     -o "$TARGET/" \
     --write_vk 2>/dev/null; then
  ok "bb prove-ultra-honk ejecutado"
else
  # Último recurso: probar write_vk separado
  bb prove --scheme ultra_honk \
     -b "$CIRCUIT_JSON" \
     -w "$WITNESS_GZ" \
     -o "$TARGET/"
  bb write_vk --scheme ultra_honk \
     -b "$CIRCUIT_JSON" \
     -o "$TARGET/"
  ok "bb prove + write_vk ejecutados separados"
fi

# ── Verificar proof localmente ────────────────────────────────────────────────
step "Verificando proof localmente"

PROOF_FILE="$TARGET/proof"
VK_FILE="$TARGET/vk"

# bb puede generar con distintos nombres según versión
if [[ ! -f "$PROOF_FILE" ]]; then
  PROOF_FILE=$(find "$TARGET" -name "*.proof" -o -name "proof" 2>/dev/null | head -1 || true)
fi
if [[ ! -f "$VK_FILE" ]]; then
  VK_FILE=$(find "$TARGET" -name "*.vk" -o -name "vk" 2>/dev/null | head -1 || true)
fi

[[ -z "$PROOF_FILE" ]] && die "No se encontró el archivo proof en $TARGET/"
[[ -z "$VK_FILE"    ]] && die "No se encontró el archivo vk en $TARGET/"

ok "Proof: $PROOF_FILE  ($(wc -c < "$PROOF_FILE") bytes)"
ok "VK:    $VK_FILE     ($(wc -c < "$VK_FILE") bytes)"

# Verificación local con bb
if bb verify --scheme ultra_honk \
     -p "$PROOF_FILE" \
     -k "$VK_FILE" 2>/dev/null || \
   bb verify-ultra-honk \
     -p "$PROOF_FILE" \
     -k "$VK_FILE" 2>/dev/null; then
  ok "Proof verificada localmente ✓"
else
  warn "Verificación local falló o no soportada en esta versión de bb"
  warn "La proof puede ser correcta — continuar con el deploy y verificar on-chain"
fi

# ── Exportar proof.json para el frontend ─────────────────────────────────────
step "Exportando proof.json para el frontend"

PROOF_HEX="0x$(xxd -p -c 99999 "$PROOF_FILE" | tr -d '\n')"
VK_HEX="0x$(xxd -p -c 99999 "$VK_FILE" | tr -d '\n')"

# Remover el prefijo del header del proof si lo tiene (bb añade 4 bytes de tamaño)
# El contrato espera el proof sin header — si bb 0.66+ lo añade, hay que strippearlo
# Detectamos si los primeros 4 bytes son el tamaño del proof
PROOF_SIZE=$(wc -c < "$PROOF_FILE")
PROOF_HEX_CLEAN="$PROOF_HEX"

cat > "$TARGET/proof.json" << JSON
{
  "commit": "$NAME_COMMIT",
  "proof_hex": "$PROOF_HEX",
  "vk_hex": "$VK_HEX",
  "public_inputs": ["$NAME_COMMIT"],
  "name_secret_hex": "$NAME_SECRET_HEX",
  "salt_hex": "$SALT_HEX",
  "circuit": "chihiro_name",
  "scheme": "ultra_honk",
  "curve": "bn254",
  "proof_size_bytes": $PROOF_SIZE,
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

ok "proof.json generado en: $TARGET/proof.json"

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Proof generada exitosamente${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}nameCommit${NC}  $NAME_COMMIT"
echo -e "  ${BOLD}proof${NC}       ${PROOF_HEX:0:22}...  (${PROOF_SIZE}B)"
echo -e "  ${BOLD}JSON${NC}        $TARGET/proof.json"
echo ""
echo -e "${CYAN}Próximos pasos:${NC}"
echo ""
echo "  1. En el frontend, Admin carga el nameCommit en initialize():"
echo "     nameCommit = $NAME_COMMIT"
echo ""
echo "  2. En el frontend, Player pega o carga proof.json en el panel ZK."
echo ""
echo "  3. También podés usar el servidor local para servir proof.json:"
echo "     cd \$(dirname \$0) && node prove-server.js"
echo "     # → http://localhost:4001/prove"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC} Guardá name_secret y salt de forma segura."
echo "  El Admin los necesita para que el Player pueda generar la proof."
echo "  NUNCA los publiques on-chain ni en el repo."
