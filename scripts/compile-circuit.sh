#!/bin/bash
# compile-circuit.sh — Compila el circuito Noir y copia el artifact para el browser
#
# Requisitos:
#   nargo 1.0.0-beta.16 (o compatible con @noir-lang/noir_js@1.0.0-beta.16)
#   Instalar: noirup -v 1.0.0-beta.16
#
# Uso:
#   cd name-zk
#   ./scripts/compile-circuit.sh

set -e

CIRCUIT_DIR="gitBDB-circuits/chihiro-name"
OUTPUT_DIR="gitBDB/public/circuits"

echo "🔧 Compilando circuito Noir..."
echo "   Directorio: $CIRCUIT_DIR"

# Compilar
cd "$CIRCUIT_DIR"
nargo compile

echo "✓ Circuito compilado"

# El artifact se genera en target/chihiro_name.json
ARTIFACT="target/chihiro_name.json"
if [ ! -f "$ARTIFACT" ]; then
  echo "❌ No se encontró $ARTIFACT"
  echo "   Verificá que nargo compile terminó correctamente."
  exit 1
fi

# Copiar al public/ del frontend
cd ../..
mkdir -p "$OUTPUT_DIR"
cp "$CIRCUIT_DIR/$ARTIFACT" "$OUTPUT_DIR/chihiro_name.json"

echo "✓ Artifact copiado a $OUTPUT_DIR/chihiro_name.json"
echo ""
echo "🚀 Ahora podés levantar el frontend:"
echo "   cd gitBDB && npm run dev"
