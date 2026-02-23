#!/usr/bin/env node
// scripts/prove-server.js
//
// Servidor local (puerto 4001) para que el frontend genere proofs sin CLI.
// Llama a prove.mjs que usa @aztec/bb.js (Barretenberg WASM) + @noir-lang/noir_js.
//
// Rutas:
//   GET  /health   — verifica dependencias
//   POST /commit   — calcula Poseidon2(secret, salt) → nameCommit
//   POST /prove    — genera UltraHonk proof completa
//   GET  /proof    — devuelve el último proof.json generado
//
// Uso:
//   node scripts/prove-server.js
//   # → http://localhost:4001
//
// CORS: solo localhost:5173 (dev server de Vite).

import { createServer }  from "http";
import { spawn }         from "child_process";
import { readFile, access, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir      = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dir, "..");
const PORT       = process.env.PORT ?? 4001;
const PROVE_MJS  = join(ROOT, "scripts", "prove.mjs");
const PROOF_JSON = join(ROOT, "gitBDB-circuits", "chihiro-name", "target", "proof.json");

// ── Helpers ───────────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  // Allow any localhost port for development (dev server can be on 5173, 5174, 5175, etc)
  const isLocalhost = origin && origin.includes('localhost');
  
  return {
    "Access-Control-Allow-Origin":  isLocalhost ? origin : "http://localhost:5174",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type":                 "application/json",
  };
}

async function readBody(req) {
  return new Promise((res, rej) => {
    let d = "";
    req.on("data", c => d += c);
    req.on("end",  () => { try { res(JSON.parse(d || "{}")); } catch { rej(new Error("JSON inválido")); } });
    req.on("error", rej);
  });
}

function send(res, status, body, origin) {
  res.writeHead(status, corsHeaders(origin));
  res.end(JSON.stringify(body, null, 2));
}

// Run prove.mjs as child process, capture stdout+stderr
function runProveMjs(nameSecretInput, saltInput) {
  return new Promise((resolve, reject) => {
    const out = [];
    const err = [];
    const child = spawn(process.execPath, [PROVE_MJS, nameSecretInput, saltInput], {
      cwd: ROOT,
      env: process.env,
    });
    child.stdout.on("data", d => { out.push(d.toString()); process.stdout.write(d); });
    child.stderr.on("data", d => { err.push(d.toString()); process.stderr.write(d); });
    child.on("close", code => {
      const combined = out.join("") + err.join("");
      if (code === 0) resolve(combined);
      else reject(new Error(combined.slice(-500) || `prove.mjs salió con código ${code}`));
    });
    child.on("error", reject);
  });
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleHealth(res, origin) {
  const checks = { prove_mjs: false, circuit_compiled: false, bb_js: false, noir_js: false };
  try { await access(PROVE_MJS);                                               checks.prove_mjs = true; } catch {}
  try { await access(join(ROOT, "gitBDB-circuits/chihiro-name/target/chihiro_name.json")); checks.circuit_compiled = true; } catch {}
  try { require.resolve("@aztec/bb.js");                                       checks.bb_js    = true; } catch {}
  try { require.resolve("@noir-lang/noir_js");                                 checks.noir_js  = true; } catch {}
  const ok = checks.prove_mjs && checks.circuit_compiled;
  send(res, ok ? 200 : 503, {
    ok,
    checks,
    message: ok
      ? "Servidor listo. Si bb_js/noir_js son false: cd scripts && npm install"
      : "Faltan dependencias. Ver README.",
  });
}

async function handleCommit(req, res, origin) {
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }, origin); }

  const { name_secret, salt_hex } = body;
  if (!name_secret || !salt_hex) return send(res, 400, { error: "Se requieren name_secret y salt_hex" }, origin);

  console.log(`[commit] secret="${name_secret}"  salt=${salt_hex}`);
  try {
    // prove.mjs genera el proof.json completo — para solo commit también sirve
    await runProveMjs(name_secret, salt_hex);
    const raw  = await readFile(PROOF_JSON, "utf8");
    const data = JSON.parse(raw);
    console.log(`[commit] ✓ nameCommit=${data.commit?.slice(0, 22)}...`);
    send(res, 200, { ok: true, commit: data.commit, proof_available: true }, origin);
  } catch (e) {
    console.error("[commit] Error:", e.message.slice(0, 300));
    send(res, 500, { error: e.message.slice(0, 300) });
  }
}

async function handleProve(req, res, origin) {
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }, origin); }

  const { name_secret, salt_hex } = body;
  if (!name_secret || !salt_hex) return send(res, 400, { error: "Se requieren name_secret y salt_hex" }, origin);

  console.log(`[prove] secret="${name_secret}"  salt=${salt_hex}`);
  console.log("[prove] Generando proof — puede tardar 30-120s...");

  const start = Date.now();
  try {
    await runProveMjs(name_secret, salt_hex);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const raw     = await readFile(PROOF_JSON, "utf8");
    const data    = JSON.parse(raw);
    // No exponer name_secret ni salt_hex al cliente
    const { name_secret_hint: _a, salt_hex: _b, ...safe } = data;
    console.log(`[prove] ✓ done in ${elapsed}s`);
    send(res, 200, { ok: true, elapsed_seconds: parseFloat(elapsed), ...safe }, origin);
  } catch (e) {
    console.error("[prove] Error:", e.message.slice(0, 300));
    send(res, 500, { error: e.message.slice(0, 300) }, origin);
  }
}

async function handleGetProof(res, origin) {
  try {
    const raw  = await readFile(PROOF_JSON, "utf8");
    const data = JSON.parse(raw);
    const { name_secret_hint: _a, salt_hex: _b, ...safe } = data;
    send(res, 200, { ok: true, ...safe }, origin);
  } catch {
    send(res, 404, { error: "Sin proof. Corré POST /prove primero." }, origin);
  }
}

// ── Server ────────────────────────────────────────────────────────────────────
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const server = createServer(async (req, res) => {
  const { method, url } = req;
  console.log(`${new Date().toISOString().slice(11, 19)}  ${method} ${url}`);

  const origin = req.headers.origin;
  if (method === "OPTIONS") { res.writeHead(204, corsHeaders(origin)); return res.end(); }

  try {
    if (url === "/health" && method === "GET")  return await handleHealth(res, origin);
    if (url === "/commit" && method === "POST") return await handleCommit(req, res, origin);
    if (url === "/prove"  && method === "POST") return await handleProve(req, res, origin);
    if (url === "/proof"  && method === "GET")  return await handleGetProof(res, origin);
    send(res, 404, { error: "Ruta no encontrada", routes: ["GET /health", "POST /commit", "POST /prove", "GET /proof"] }, origin);
  } catch (e) {
    console.error("Error:", e);
    send(res, 500, { error: e.message }, origin);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  🔮 Chihiro Prove Server`);
  console.log(`  ▶ http://localhost:${PORT}\n`);
  console.log(`  GET  /health  — verificar dependencias`);
  console.log(`  POST /commit  — Poseidon2(secret, salt) → nameCommit`);
  console.log(`  POST /prove   — generar UltraHonk proof completa`);
  console.log(`  GET  /proof   — leer el último proof.json\n`);
  console.log(`  Ejemplo:`);
  console.log(`    curl -s http://localhost:${PORT}/health | jq`);
  console.log(`    curl -s -X POST http://localhost:${PORT}/prove \\`);
  console.log(`      -H 'Content-Type: application/json' \\`);
  console.log(`      -d '{"name_secret":"chihiro","salt_hex":"0x1234abcd"}' | jq .commit\n`);
  console.log(`  Detener: Ctrl+C\n`);
});
