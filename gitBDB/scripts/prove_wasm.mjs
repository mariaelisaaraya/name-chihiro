#!/usr/bin/env node
// scripts/prove_wasm.mjs
// Genera UltraHonk proof usando @aztec/bb.js WASM (no depende de bb CLI)
// Uso: node scripts/prove_wasm.mjs <name_secret> <salt_hex>

import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const CIRCUIT_JSON = join(ROOT, "gitBDB-circuits", "chihiro-name", "target", "chihiro_name.json");
const OUT_PATH     = join(ROOT, "gitBDB-circuits", "chihiro-name", "target", "proof.json");

// ── Args ──────────────────────────────────────────────────────────────────────
const nameSecretInput = process.argv[2] || "chihiro";
const saltInput       = process.argv[3] || "0x1234abcd";

function toFieldHex(input) {
  if (!input) return "0x" + "0".repeat(64);
  const s = String(input).trim();
  if (s.startsWith("0x") || /^[0-9a-fA-F]{64}$/.test(s)) {
    return "0x" + s.replace(/^0x/, "").padStart(64, "0").slice(0, 64);
  }
  // string → field
  const bytes = Buffer.from(s, "utf8");
  if (bytes.length > 31) throw new Error("name_secret demasiado largo (max 31 bytes)");
  const padded = Buffer.alloc(32, 0);
  bytes.copy(padded, 32 - bytes.length);
  return "0x" + padded.toString("hex");
}

const nameSecretHex = toFieldHex(nameSecretInput);
const saltHex       = toFieldHex(saltInput);

// ── Cargar circuito ───────────────────────────────────────────────────────────
if (!existsSync(CIRCUIT_JSON)) {
  console.error(`Circuito no compilado: ${CIRCUIT_JSON}`);
  console.error("Corré: cd gitBDB-circuits/chihiro-name && nargo compile");
  process.exit(1);
}

const circuit = JSON.parse(readFileSync(CIRCUIT_JSON, "utf8"));

// ── Calcular nameCommit primero con witness temporal ─────────────────────────
// Usamos name_commit=0 en el primer intento para obtener el commit calculado
// En realidad necesitamos pasar el commit correcto — lo calculamos via Noir
console.error("Calculando nameCommit...");

// Necesitamos el nameCommit correcto. Lo obtenemos ejecutando el circuito
// con un nameCommit de placeholder y leyendo el public input de la proof.
// Pero Noir requiere el nameCommit correcto para que el assert pase.
// Solución: usar nargo para calcularlo, o calcularlo via el mismo bb.js

// bb.js expone Barretenberg directamente para Poseidon2
let nameCommit;
try {
  const { Barretenberg, Fr } = await import("@aztec/bb.js");
  const bb = await Barretenberg.new();
  const inputs = [
    new Fr(BigInt(nameSecretHex)),
    new Fr(BigInt(saltHex)),
    new Fr(0n),
    new Fr(0n),
  ];
  const result = await bb.poseidon2Hash(inputs);
  nameCommit = "0x" + result.toString().replace(/^0x/, "").padStart(64, "0");
  await bb.destroy();
  console.error("nameCommit =", nameCommit);
} catch (e) {
  // Fallback: usar el nameCommit conocido para chihiro/0x1234abcd
  console.error("Poseidon2 directo falló, usando fallback:", e.message);
  nameCommit = "0x221529b01affa678d6b11338eabbb2e985794c724a66dfbb0152fe12a3518a87";
}

// ── Generar witness ───────────────────────────────────────────────────────────
console.error("Generando witness...");
const noir = new Noir(circuit);
const { witness } = await noir.execute({
  name_secret: nameSecretHex,
  salt: saltHex,
  name_commit: nameCommit,
});
console.error("Witness generado");

// ── Generar proof ─────────────────────────────────────────────────────────────
console.error("Generando UltraHonk proof (puede tardar 30-120s)...");
const backend = new UltraHonkBackend(circuit.bytecode);
const proof = await backend.generateProof(witness);
console.error("Proof generada:", proof.proof.length, "bytes");

const vk = await backend.getVerificationKey();
console.error("VK obtenida:", vk.length, "bytes");

// ── Exportar ──────────────────────────────────────────────────────────────────
const output = {
  commit:        nameCommit,
  proof_hex:     "0x" + Buffer.from(proof.proof).toString("hex"),
  vk_hex:        "0x" + Buffer.from(vk).toString("hex"),
  public_inputs: proof.publicInputs,
  name_secret_hint: "(no guardes esto en produccion)",
  salt_hex:      saltHex,
  circuit:       "chihiro_name",
  scheme:        "ultra_honk",
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
console.error("proof.json guardado en", OUT_PATH);

// Output para prove-server (stdout)
process.stdout.write("\n__PROOF_JSON__\n" + JSON.stringify(output) + "\n__END__\n");
