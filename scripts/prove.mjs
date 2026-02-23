#!/usr/bin/env node
// scripts/prove.mjs
//
// Genera nameCommit (Poseidon2 real) + UltraHonk proof real
// usando @aztec/bb.js (Barretenberg) + @noir-lang/noir_js.
//
// NO necesita nargo ni bb CLI instalados.
// Solo necesita el circuito compilado: gitBDB-circuits/chihiro-name/target/chihiro_name.json
//
// Uso:
//   node scripts/prove.mjs <name_secret> <salt_hex>
//
// Ejemplos:
//   node scripts/prove.mjs chihiro 0x1234abcd
//   node scripts/prove.mjs "mi nombre" 0xdeadbeef
//
// Salida:
//   gitBDB-circuits/chihiro-name/target/proof.json
//   (y también imprime los valores para pegar en el frontend)
//
// PREREQUISITO: nargo compile debe haberse ejecutado al menos una vez:
//   cd gitBDB-circuits/chihiro-name && nargo compile
//   Esto genera: target/chihiro_name.json

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const require   = createRequire(import.meta.url);

// ── Colors ────────────────────────────────────────────────────────────────────
const R = "\x1b[31m", G = "\x1b[32m", Y = "\x1b[33m", C = "\x1b[36m",
      B = "\x1b[1m",  N = "\x1b[0m";

const step  = (s) => console.log(`\n${C}▶ ${s}${N}`);
const ok    = (s) => console.log(`${G}✓ ${s}${N}`);
const warn  = (s) => console.warn(`${Y}⚠  ${s}${N}`);
const die   = (s) => { console.error(`${R}✗ ${s}${N}`); process.exit(1); };

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(`${B}Uso:${N}  node scripts/prove.mjs <name_secret> <salt_hex>`);
  console.log(`\nEjemplos:`);
  console.log(`  node scripts/prove.mjs chihiro 0x1234abcd`);
  console.log(`  node scripts/prove.mjs "mi secreto" 0xdeadbeef`);
  console.log(`\nPrerequisito: nargo compile en gitBDB-circuits/chihiro-name/`);
  process.exit(0);
}

const nameSecretInput = args[0];   // string o hex
const saltInput       = args[1];   // hex como 0x1234abcd

// ── Helpers de encoding ───────────────────────────────────────────────────────

/**
 * Convierte un string (ej "chihiro") a un Field element BN254.
 * El string se codifica como UTF-8 big-endian en 32 bytes.
 * Esto es lo mismo que Noir hace con string literals de hasta 31 chars.
 */
function stringToFieldBytes(s) {
  const bytes = Buffer.from(s, "utf8");
  if (bytes.length > 31) {
    die(`name_secret demasiado largo (${bytes.length} bytes, máx 31 para BN254 Field)`);
  }
  const padded = Buffer.alloc(32, 0);
  bytes.copy(padded, 32 - bytes.length);
  return padded;
}

/**
 * Convierte hex "0x..." o un string legible a 32 bytes (Fr buffer).
 */
function toFieldBytes(input) {
  if (input.startsWith("0x") || /^[0-9a-fA-F]{1,64}$/.test(input)) {
    const clean = input.replace(/^0x/, "").replace(/_/g, "");
    const padded = clean.padStart(64, "0");
    return Buffer.from(padded.slice(0, 64), "hex");
  }
  return stringToFieldBytes(input);
}

// ── Cargar circuito compilado ─────────────────────────────────────────────────
const circuitPath = join(ROOT, "gitBDB-circuits/chihiro-name/target/chihiro_name.json");
const targetDir   = join(ROOT, "gitBDB-circuits/chihiro-name/target");

step("Cargando circuito compilado");

if (!existsSync(circuitPath)) {
  die(
    `Circuito no encontrado: ${circuitPath}\n\n` +
    `  Necesitás compilarlo primero:\n` +
    `    cd gitBDB-circuits/chihiro-name\n` +
    `    nargo compile\n\n` +
    `  Si no tenés nargo:\n` +
    `    curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash\n` +
    `    noirup`
  );
}

const circuit = JSON.parse(readFileSync(circuitPath, "utf8"));
ok(`Circuito cargado: ${circuitPath}`);

// ── Inicializar Barretenberg ──────────────────────────────────────────────────
step("Inicializando Barretenberg (WASM)");
console.log("  Esto puede tardar unos segundos la primera vez...");

// Usar require para módulos CJS (ya funciona con createRequire)
const { Barretenberg, Fr } = require("@aztec/bb.js");
const { Noir }              = require("@noir-lang/noir_js");
const { UltraHonkBackend }  = require("@noir-lang/backend_barretenberg");

const bb = await Barretenberg.new({ threads: 1 });
ok("Barretenberg inicializado");

// ── Calcular nameCommit = Poseidon2(name_secret, salt) ────────────────────────
step("Calculando nameCommit = Poseidon2(name_secret, salt)");

const nameSecretBytes = toFieldBytes(nameSecretInput);
const saltBytes       = toFieldBytes(saltInput);

const nameSecretFr = Fr.fromBuffer(nameSecretBytes);
const saltFr       = Fr.fromBuffer(saltBytes);

console.log(`  name_secret (field): 0x${Buffer.from(nameSecretFr.toBuffer()).toString("hex")}`);
console.log(`  salt        (field): 0x${Buffer.from(saltFr.toBuffer()).toString("hex")}`);

const commitFr  = await bb.poseidon2Hash([nameSecretFr, saltFr]);
const commitHex = "0x" + Buffer.from(commitFr.toBuffer()).toString("hex");

ok(`nameCommit = ${commitHex}`);

// ── Generar witness ──────────────────────────────────────────────────────────
step("Generando witness (noir_js.execute)");

// El circuito espera Field values como hex strings
const inputs = {
  name_secret: "0x" + Buffer.from(nameSecretFr.toBuffer()).toString("hex"),
  salt:        "0x" + Buffer.from(saltFr.toBuffer()).toString("hex"),
  name_commit: commitHex,
};

console.log("  Inputs para el circuito:", inputs);

const noir = new Noir(circuit);
let witness;
try {
  const result = await noir.execute(inputs);
  witness = result.witness;
  ok(`Witness generado (${witness.length} bytes)`);
} catch (e) {
  die(`Error generando witness:\n  ${e.message}\n\n  ¿Los inputs están bien formateados como Field hex?`);
}

// ── Generar UltraHonk proof ──────────────────────────────────────────────────
step("Generando UltraHonk proof (barretenberg)");
console.log("  Esto puede tardar 30-120 segundos...");

const backend = new UltraHonkBackend(circuit);
let proofData;
try {
  proofData = await backend.generateProof(witness);
  ok(`Proof generada: ${proofData.proof.length} bytes`);
  ok(`Public inputs: ${JSON.stringify(proofData.publicInputs)}`);
} catch (e) {
  die(`Error generando proof:\n  ${e.message}`);
}

// ── Obtener verification key ─────────────────────────────────────────────────
step("Obteniendo Verification Key");

let vk;
try {
  vk = await backend.getVerificationKey();
  ok(`VK obtenida: ${vk.length} bytes`);
} catch (e) {
  die(`Error obteniendo VK:\n  ${e.message}`);
}

// ── Verificar localmente ─────────────────────────────────────────────────────
step("Verificando proof localmente");

try {
  const { UltraHonkVerifier: BBVerifier } = require("@noir-lang/backend_barretenberg");
  const verifier = new BBVerifier(circuit);
  const valid    = await verifier.verifyProof(proofData);
  if (valid) {
    ok("Proof verificada localmente ✓");
  } else {
    warn("Proof no pasó verificación local — revisar inputs");
  }
} catch (e) {
  warn(`Verificación local omitida: ${e.message}`);
}

// ── Serializar para el frontend ──────────────────────────────────────────────
step("Exportando proof.json");

const proofHex = "0x" + Buffer.from(proofData.proof).toString("hex");
const vkHex    = "0x" + Buffer.from(vk).toString("hex");

// publicInputs del backend son strings hex de Field elements (sin 0x)
// El contrato Soroban espera Vec<BytesN<32>>  — cada input como 32 bytes
const publicInputsHex = proofData.publicInputs.map(
  (p) => "0x" + p.replace(/^0x/, "").padStart(64, "0")
);

const output = {
  commit:         commitHex,
  proof_hex:      proofHex,
  vk_hex:         vkHex,
  public_inputs:  publicInputsHex,
  name_secret_hint: "(no guardes esto en producción — solo para debug de demo)",
  salt_hex:       "0x" + Buffer.from(saltFr.toBuffer()).toString("hex"),
  circuit:        "chihiro_name",
  scheme:         "ultra_honk",
  curve:          "bn254",
  proof_size_bytes: proofData.proof.length,
  vk_size_bytes:   vk.length,
  generated_at:    new Date().toISOString(),
};

if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
const outPath = join(targetDir, "proof.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

// ── Cleanup ──────────────────────────────────────────────────────────────────
await backend.destroy?.();
await bb.destroy();

// ── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${B}${G}═══════════════════════════════════════════════${N}`);
console.log(`${B}  Proof generada exitosamente${N}`);
console.log(`${B}${G}═══════════════════════════════════════════════${N}\n`);
console.log(`  ${B}nameCommit${N}   ${commitHex}`);
console.log(`  ${B}proof${N}        ${proofHex.slice(0, 20)}...  (${proofData.proof.length} bytes)`);
console.log(`  ${B}vk${N}           ${vkHex.slice(0, 20)}...  (${vk.length} bytes)`);
console.log(`  ${B}JSON${N}         ${outPath}`);
console.log(`\n${C}Próximos pasos:${N}\n`);
console.log(`  1. Admin: pega nameCommit en el panel ZK → initialize()`);
console.log(`     nameCommit = ${commitHex}\n`);
console.log(`  2. Player: cargá proof.json en el panel ZK → prove & recover()`);
console.log(`     proof.json = ${outPath}\n`);
console.log(`  3. El panel ZK leerá proof_hex + vk_hex + public_inputs del JSON.\n`);
console.log(`${Y}⚠  Guardá name_secret y salt de forma segura.${N}`);
console.log(`${Y}   NUNCA los publiques on-chain ni los commitees al repo.${N}\n`);
