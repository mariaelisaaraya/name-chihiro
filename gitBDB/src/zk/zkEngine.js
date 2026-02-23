// src/zk/zkEngine.js — In-browser ZK prover for Chihiro's Lost Name
//
// Uses TWO compiled Noir circuits:
//   1. chihiro_commit — computes Poseidon2(secret, salt) and returns the hash
//   2. chihiro_name   — proves knowledge of (secret, salt) matching a commitment
//
// Both run entirely in the browser via WASM (@noir-lang + @aztec/bb.js UltraHonk).

// ── State ──────────────────────────────────────────────────────────────────────
let _initPromise = null;
let _zkAvailable = false;
let _initError = null;

let _commitCircuit = null;   // chihiro_commit (compute-only, no assertion)
let _proofCircuit = null;    // chihiro_name (with assertion, for real proof)
let _backend = null;         // UltraHonk backend for proof circuit
let _NoirClass = null;       // Noir constructor

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Normalize input: plaintext → hex field, hex passthrough */
function normalizeInput(input) {
  if (!input || typeof input !== "string") throw new Error("Invalid input");
  const trimmed = input.trim();
  if (trimmed.startsWith("0x")) return trimmed;
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 6) return "0x" + trimmed;
  // Plaintext → hex encode
  let hex = "";
  for (let i = 0; i < trimmed.length; i++) {
    hex += trimmed.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex;
}

async function loadCircuit(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Initialize the ZK engine. Loads WASM modules and both compiled circuits.
 * Safe to call multiple times — returns the same promise.
 */
export async function initZK() {
  if (_initPromise) return _initPromise;
  _initPromise = _doInit();
  return _initPromise;
}

async function _doInit() {
  try {
    console.log("[ZK] Step 1: Loading WASM modules...");
    const [noirModule, backendModule, acvmMod, abiMod] = await Promise.all([
      import("@noir-lang/noir_js"),
      import("@aztec/bb.js"),
      import("@noir-lang/acvm_js"),
      import("@noir-lang/noirc_abi"),
    ]);
    console.log("[ZK] Step 2: WASM modules loaded ✓");

    // Initialize WASM runtimes
    if (typeof acvmMod.default === "function") await acvmMod.default();
    if (typeof abiMod.default === "function") await abiMod.default();
    console.log("[ZK] Step 3: WASM initialized ✓");

    _NoirClass = noirModule.Noir;

    // Load both circuits
    console.log("[ZK] Step 4: Loading circuits...");
    const [commitCirc, proofCirc] = await Promise.all([
      loadCircuit("/circuits/chihiro_commit.json"),
      loadCircuit("/circuits/chihiro_name.json"),
    ]);
    _commitCircuit = commitCirc;
    _proofCircuit = proofCirc;
    console.log("[ZK] Step 5: Circuits loaded ✓",
      "(commit:", _commitCircuit.abi.parameters.map(p => p.name).join(","),
      "| proof:", _proofCircuit.abi.parameters.map(p => p.name).join(","), ")");

    // Create UltraHonk backend for the proof circuit
    if (!backendModule.UltraHonkBackend) {
      throw new Error("UltraHonkBackend not found in @aztec/bb.js");
    }
    console.log("[ZK] Step 6: Creating UltraHonk backend...");
    _backend = new backendModule.UltraHonkBackend(_proofCircuit.bytecode);
    console.log("[ZK] Step 7: UltraHonk backend created ✓");

    _zkAvailable = true;
    console.log("[ZK] ✅ ZK engine ready!");
    return true;
  } catch (err) {
    console.error("[ZK] Engine init FAILED:", err);
    _initError = err.message || String(err);
    _zkAvailable = false;
    return false;
  }
}

export function isZKAvailable() { return _zkAvailable; }
export function getZKError() { return _initError; }

/**
 * Compute nameCommit = Poseidon2(secret, salt) using the commit-only circuit.
 * This circuit has NO assertion — it just returns the hash.
 *
 * @param {string} secretInput - "chihiro" or "0x63686968697261"
 * @param {string} saltInput   - "0x1234abcd"
 * @returns {Promise<string>} The commitment as "0x..." hex
 */
export async function computeCommit(secretInput, saltInput) {
  if (!_zkAvailable) throw new Error("ZK engine not initialized");

  const nameSecret = normalizeInput(secretInput);
  const salt = normalizeInput(saltInput);
  console.log("[ZK] Computing Poseidon2 commitment...");

  const noir = new _NoirClass(_commitCircuit);
  const { returnValue } = await noir.execute({ name_secret: nameSecret, salt });

  // returnValue is the Poseidon2 hash as a field element
  const commit = "0x" + BigInt(returnValue).toString(16);
  console.log("[ZK] ✓ Commitment:", commit.slice(0, 24) + "...");
  return commit;
}

/**
 * Generate a full UltraHonk ZK proof.
 * 1. Computes the commitment via the commit circuit
 * 2. Generates the proof via the proof circuit + UltraHonk backend
 *
 * @param {string} secretInput - "chihiro" or hex
 * @param {string} saltInput   - "0x1234abcd"
 * @returns {Promise<{commit: string, proof_hex: string, vk_hex: string}>}
 */
export async function generateProof(secretInput, saltInput) {
  if (!_zkAvailable) throw new Error("ZK engine not initialized");

  const nameSecret = normalizeInput(secretInput);
  const salt = normalizeInput(saltInput);
  const startTime = Date.now();

  // Step 1: Compute the commitment using the helper circuit
  console.log("[ZK] Step 1/3: Computing Poseidon2 commitment...");
  const commit = await computeCommit(secretInput, saltInput);

  // Step 2: Execute the proof circuit with the correct commitment
  console.log("[ZK] Step 2/3: Generating witness...");
  const noir = new _NoirClass(_proofCircuit);
  const { witness } = await noir.execute({
    name_secret: nameSecret,
    salt: salt,
    name_commit: commit,
  });
  console.log("[ZK] ✓ Witness generated");

  // Step 3: Generate the UltraHonk proof
  console.log("[ZK] Step 3/3: Generating UltraHonk proof (this may take 30-120s)...");
  const proofResult = await _backend.generateProof(witness);

  // Extract proof bytes
  let proofHex;
  if (proofResult instanceof Uint8Array) {
    proofHex = "0x" + Array.from(proofResult).map(b => b.toString(16).padStart(2, "0")).join("");
  } else if (proofResult?.proof instanceof Uint8Array) {
    proofHex = "0x" + Array.from(proofResult.proof).map(b => b.toString(16).padStart(2, "0")).join("");
  } else {
    proofHex = "0x" + String(proofResult);
  }

  // Get verification key (optional)
  let vkHex = "";
  try {
    if (typeof _backend.getVerificationKey === "function") {
      const vk = await _backend.getVerificationKey();
      if (vk instanceof Uint8Array) {
        vkHex = "0x" + Array.from(vk).map(b => b.toString(16).padStart(2, "0")).join("");
      }
    }
  } catch { /* vk extraction optional */ }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ZK] ✅ Proof complete in ${elapsed}s (${proofHex.length / 2 - 1} bytes)`);

  return { commit, proof_hex: proofHex, vk_hex: vkHex };
}
