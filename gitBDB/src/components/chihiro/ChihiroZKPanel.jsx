// src/components/chihiro/ChihiroZKPanel.jsx  — v10 (REAL ZK)
//
// ARQUITECTURA:
//   Commit hash → Poseidon2(secret, salt)  [in-browser via Noir WASM]
//   ZK proof    → UltraHonk real via bb.js [in-browser WASM]
//   On-chain    → ChihiroGame.recover_name() → UltraHonkVerifier.verify()
//
// Todo se ejecuta en el browser — no requiere prove-server ni proof.json manual.
// El circuito Noir compilado se carga desde /circuits/chihiro_name.json

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  connectWallet, disconnectWallet, getConnectedAddress,
  initializeGame, recoverName, formatAddress, explorerTxUrl,
  GAME_HUB_CONTRACT_ID, CHIHIRO_CONTRACT_ID,
} from "../../stellar/stellarClient.js";
import "./chihiro.css";

// ── In-browser ZK Engine (replaces prove-server) ──────────────────────────────
import { initZK, isZKAvailable, getZKError, generateProof as zkGenerateProof } from "../../zk/zkEngine.js";

// ── GitHub validation ─────────────────────────────────────────────────────────
async function validateGitHub(owner, repo, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  try {
    const res     = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers });
    if (!res.ok)   throw new Error("no_access");
    const branches = await res.json();
    const branch   = branches.find((b) => b.name.startsWith("rescue/"));
    if (!branch)   return { ok: false, errorKey: "ghErrNoBranch" };
    const cRes     = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch.name}&per_page=10`, { headers });
    const commits  = await cRes.json();
    const msgs     = commits.map((c) => c.commit.message.trim());
    const missing  = ["clue:1", "clue:2", "clue:3"].filter((m) => !msgs.includes(m));
    if (missing.length) return { ok: false, errorKey: "ghErrMissingCommits", missing: missing.join(", ") };
    return { ok: true, branch: branch.name };
  } catch { return { ok: false, errorKey: "ghErrNoAccess" }; }
}

// ── Freighter detection ────────────────────────────────────────────────────────
function detectFreighter() {
  return "installed"; // kit maneja detección internamente
  if (typeof window === "undefined") return "unknown";
  if (window.freighterApi)            return "installed";
  return "missing";
}

// ── RitualStepper ─────────────────────────────────────────────────────────────
const STEP_DEFS = [
  { icon: "🔑", key: "stepWallet"     },
  { icon: "🏯", key: "stepInitialize" },
  { icon: "🌿", key: "stepRitual"     },
  { icon: "🔮", key: "stepProve"      },
];

function RitualStepper({ walletAddr, adminDone, ritualComplete, playerDone, t }) {
  let active = 0;
  if (walletAddr)     active = Math.max(active, 1);
  if (adminDone)      active = Math.max(active, 2);
  if (ritualComplete) active = Math.max(active, 2);
  if (playerDone)     active = 4;

  return (
    <div className="ritual-stepper">
      {STEP_DEFS.map((s, i) => {
        const done    = i < active;
        const current = i === active;
        return (
          <React.Fragment key={i}>
            <div className={`stepper-step ${done ? "done" : current ? "current" : "pending"}`}>
              <div className="stepper-dot">{done ? "✓" : s.icon}</div>
              <div className="stepper-label">{t(s.key, { defaultValue: s.key })}</div>
            </div>
            {i < STEP_DEFS.length - 1 && <div className={`stepper-line ${done ? "done" : ""}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── WalletHeader ──────────────────────────────────────────────────────────────
const FREIGHTER_POPUP = "chrome-extension://bcacfldlkkdogcmkkibnjlakofdplcbk/popup.html";

function WalletHeader({ address, loading, walletError, onConnect, onDisconnect, t }) {
  const freighterMissing = detectFreighter() === "missing";
  return (
    <div className="wallet-header-bar">
      <div className="wallet-header-row">
        <div className="wallet-header-left">
          {loading ? (
            <div className="wallet-btn wallet-btn-loading" style={{ width: "auto", padding: "5px 12px" }}>
              <span className="zk-spinner" /><span>{t("walletConnecting")}</span>
            </div>
          ) : address ? (
            <div className="wallet-connected">
              <span className="wallet-dot" />
              <span className="wallet-addr">{formatAddress(address)}</span>
              <button className="wallet-disconnect" onClick={onDisconnect}>{t("walletDisconnect")}</button>
            </div>
          ) : freighterMissing ? (
            <div className="wallet-missing">
              <span>⚠️</span>
              <span className="wallet-missing-text">{t("walletFreighterMissing", { defaultValue: "Freighter no instalado" })}</span>
              <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="wallet-install-link">
                {t("walletInstall", { defaultValue: "Instalar →" })}
              </a>
            </div>
          ) : (
            <button className="wallet-btn" style={{ width: "auto", padding: "5px 14px" }} onClick={onConnect}>
              {t("walletConnect")}
            </button>
          )}
        </div>
        <div className="wallet-header-right">
          <span className="wallet-network-badge">TESTNET</span>
          <a href={FREIGHTER_POPUP} target="_blank" rel="noopener noreferrer"
             className="wallet-unlock-link" title="Abrir / desbloquear Freighter">🔓</a>
        </div>
      </div>
      {loading && (
        <div className="wallet-localhost-hint">
          {t("walletLocalhostHint", { defaultValue: "Si queda en 'Conectando…', revisá que Freighter esté desbloqueada y que Chrome permita popups en localhost." })}
        </div>
      )}
      {walletError && !loading && (
        <div className="wallet-error-bar">
          <div className="wallet-error-msg">⚠️ {walletError}</div>
          <div className="wallet-error-actions">
            <button className="wallet-retry-btn" onClick={onConnect}>
              {t("walletRetry", { defaultValue: "↺ Reintentar" })}
            </button>
            <a href={FREIGHTER_POPUP} target="_blank" rel="noopener noreferrer" className="wallet-open-link">
              {t("walletOpenFreighter", { defaultValue: "Abrir Freighter →" })}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ZKStatus ──────────────────────────────────────────────────────────────────
function ZKStatus({ available, checking, error }) {
  if (checking) return (
    <div className="server-status checking">
      <span className="zk-spinner" style={{ width: 8, height: 8 }} />
      <span>{" "}Cargando ZK engine (WASM)...</span>
    </div>
  );
  if (available) return (
    <div className="server-status ok">
      🟢 ZK engine listo — pruebas in-browser via UltraHonk
    </div>
  );
  return (
    <div className="server-status offline">
      🔴 ZK engine no disponible
      {error && (
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.8, wordBreak: "break-all" }}>
          Error: {error}
        </div>
      )}
      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>
        Abrí la consola (F12) para más detalles.
      </div>
    </div>
  );
}


// ── RoleSelector ──────────────────────────────────────────────────────────────
function RoleSelector({ onSelect, t }) {
  return (
    <div className="role-selector">
      <div className="role-selector-title">{t("roleSelectorTitle")}</div>
      <p className="role-selector-sub">{t("roleSelectorSub")}</p>
      <div className="role-cards">
        <button className="role-card role-admin" onClick={() => onSelect("admin")}>
          <span className="role-icon">🏯</span>
          <span className="role-name">{t("roleAdmin")}</span>
          <span className="role-desc" style={{ whiteSpace: "pre-line" }}>{t("roleAdminDesc")}</span>
        </button>
        <button className="role-card role-player" onClick={() => onSelect("player")}>
          <span className="role-icon">🌊</span>
          <span className="role-name">{t("rolePlayer")}</span>
          <span className="role-desc" style={{ whiteSpace: "pre-line" }}>{t("rolePlayerDesc")}</span>
        </button>
      </div>
    </div>
  );
}

// ── AdminPanel ────────────────────────────────────────────────────────────────
// El Admin calcula nameCommit = Poseidon2(secret, salt) in-browser y llama initialize().

function AdminPanel({ addr, zkAvailable, onDone, t }) {
  const [p2Addr,     setP2Addr]     = useState("");
  const [secret,     setSecret]     = useState("");
  const [salt,       setSalt]       = useState("");
  const [nameCommit, setNameCommit] = useState("");
  const [vkHex,      setVkHex]      = useState("");
  const [contractId, setContractId] = useState(CHIHIRO_CONTRACT_ID || "");
  const [step,       setStep]       = useState("idle");
  const [logs,       setLogs]       = useState([]);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState("");
  const log = useCallback((msg) => setLogs((p) => [...p, msg]), []);

  const handleCommit = useCallback(async () => {
    if (!secret || !salt) return;
    setError("");
    log("🔮 Generando proof + nameCommit in-browser (UltraHonk WASM)...");
    log("   Esto puede tardar 30-120 segundos...");
    try {
      const data = await zkGenerateProof(secret, salt);
      setNameCommit(data.commit);
      if (data.vk_hex) setVkHex(data.vk_hex);
      log(`✓ nameCommit = Poseidon2(secret, salt)`);
      log(`  ${data.commit.slice(0, 26)}...`);
    } catch (e) {
      setError(`ZK error: ${e.message}`);
      log(`❌ ${e.message}`);
    }
  }, [secret, salt, log]);

  const handleInit = useCallback(async () => {
    if (!addr || !p2Addr || !nameCommit || !contractId) return;
    setError(""); setStep("init");
    log(t("logInitCalling")); log(t("logInitHub"));
    try {
      const r = await initializeGame({
        adminAddress: addr,
        player2Address: p2Addr,
        nameCommitHex: nameCommit,
        vkHex: vkHex || null,      // si hay vk real, lo manda; sino placeholder "00"
        contractId,
      });
      setTxHash(r.txHash); setStep("done");
      log(t("logInitOk")); log(t("logInitTx", { hash: r.txHash.slice(0, 22) }));
      onDone?.();
    } catch (e) { setError(e.message); setStep("idle"); log(`❌ ${e.message}`); }
  }, [addr, p2Addr, nameCommit, contractId, vkHex, log, t, onDone]);

  return (
    <div className="role-panel">
      <div className="zk-section">
        <div className="zk-section-title">{t("adminTitle")}</div>
        {!addr && <p className="zk-hint" style={{ color: "rgba(240,192,96,0.7)" }}>↑ Conectá tu wallet primero.</p>}
      </div>

      <div className="zk-section">
        <div className="zk-section-title">{t("adminS1")}</div>
        <div className="zk-field"><label>Contract ID</label>
          <input className="zk-input" placeholder={t("adminContractPlaceholder")} value={contractId} onChange={(e) => setContractId(e.target.value)} /></div>
        <p className="zk-hint">{t("adminGameHubLabel")}{" "}
          <code style={{ color: "var(--spirit-teal)", fontSize: 10 }}>{GAME_HUB_CONTRACT_ID.slice(0, 12)}...</code></p>
      </div>

      <div className="zk-section">
        <div className="zk-section-title">{t("adminS2")}</div>
        <div className="zk-field"><label>{t("adminP2Label")}</label>
          <input className="zk-input" placeholder={t("adminP2Placeholder")} value={p2Addr} onChange={(e) => setP2Addr(e.target.value)} /></div>
      </div>

      {/* Paso 3: Calcular nameCommit = Poseidon2(secret, salt) */}
      <div className="zk-section">
        <div className="zk-section-title">{t("adminS3")}</div>
        <p className="zk-hint">
          🔐 Poseidon2(name_secret, salt) — igual al circuito Noir. El secreto nunca sale del browser.
        </p>
        <div className="zk-field"><label>{t("adminSecretLabel")}</label>
          <input type="password" className="zk-input" placeholder={t("adminSecretPlaceholder")}
            value={secret} onChange={(e) => setSecret(e.target.value)} /></div>
        <div className="zk-field"><label>{t("adminSaltLabel")}</label>
          <input type="password" className="zk-input" placeholder="0x1234abcd (hex)"
            value={salt} onChange={(e) => setSalt(e.target.value)} /></div>

        <button className="zk-btn zk-btn-secondary" onClick={handleCommit}
          disabled={!secret || !salt || !zkAvailable}>
          🔮 Calcular nameCommit (Poseidon2 in-browser)
        </button>
        {!zkAvailable && (
          <p className="zk-hint" style={{ color: "rgba(240,192,96,0.6)", marginTop: 6 }}>
            ⚠ ZK engine no disponible — compilá el circuito primero.
          </p>
        )}

        {nameCommit && (
          <div className="zk-commit-hash">
            <span className="zk-commit-label">nameCommit (Poseidon2):</span>
            <code>{nameCommit.slice(0, 26)}...</code>
          </div>
        )}

        {/* VK — extraído automáticamente del ZK engine */}
        {vkHex && (
          <div className="zk-commit-hash" style={{ marginTop: 6 }}>
            <span className="zk-commit-label">vk:</span>
            <code style={{ color: "rgba(100,200,180,0.7)", fontSize: 10 }}>{vkHex.slice(0, 20)}...</code>
          </div>
        )}
      </div>

      <button className={`zk-btn zk-btn-primary ${step === "done" ? "zk-btn-success" : ""}`} onClick={handleInit}
        disabled={!addr || !p2Addr || !nameCommit || !contractId || step === "init" || step === "done"}>
        {step === "init" ? <span className="zk-loading"><span className="zk-spinner" />{t("adminInitBtnLoading")}</span>
          : step === "done" ? t("adminInitBtnDone") : t("adminInitBtn")}
      </button>
      {error && <div className="zk-error">{error}</div>}
      {logs.length > 0 && <div className="zk-logs"><div className="zk-logs-title">{t("adminLogTitle")}</div>
        {logs.map((l, i) => <div key={i} className="zk-log-line">{l}</div>)}</div>}
      {step === "done" && txHash && (
        <div className="zk-success-card">
          <div className="zk-success-title">{t("adminSuccessTitle")}</div>
          <div className="zk-success-detail"><span>{t("adminSuccessStartGame")}</span><code>{t("adminSuccessOnChain")}</code></div>
          <div className="zk-success-detail"><span>nameCommit:</span><code>{nameCommit.slice(0, 18)}...</code></div>
          <a href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer" className="zk-explorer-link">{t("seeOnStellar")}</a>
        </div>
      )}
    </div>
  );
}

// ── PlayerPanel ───────────────────────────────────────────────────────────────
// El player hace el ritual de git, genera la proof ZK in-browser
// (UltraHonk WASM) y llama recover_name().

function PlayerPanel({ addr, zkAvailable, ritualComplete, localCommits, localBranches, onDone, t }) {
  const [contractId, setContractId] = useState(CHIHIRO_CONTRACT_ID || "");
  const [secret,     setSecret]     = useState("");
  const [salt,       setSalt]       = useState("");
  const [nameCommit, setNameCommit] = useState("");
  const [proofHex,   setProofHex]   = useState("");
  const [vkHex,      setVkHex]      = useState("");
  const [useGH,      setUseGH]      = useState(false);
  const [ghOwner,    setGhOwner]    = useState("");
  const [ghRepo,     setGhRepo]     = useState("");
  const [ghToken,    setGhToken]    = useState("");
  const [step,       setStep]       = useState("idle");
  const [logs,       setLogs]       = useState([]);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState("");
  const log = useCallback((msg) => setLogs((p) => [...p, msg]), []);

  const handleProve = useCallback(async () => {
    if (!secret || !salt) return;
    setError("");
    log("🔮 Generando UltraHonk proof in-browser (Poseidon2 real)...");
    log("   Esto puede tardar 30-120 segundos...");
    try {
      const data = await zkGenerateProof(secret, salt);
      setNameCommit(data.commit);
      setProofHex(data.proof_hex);
      if (data.vk_hex) setVkHex(data.vk_hex);
      log(`✓ proof generada (${data.proof_hex.length / 2 - 1} bytes)`);
      log(`  commit = ${data.commit.slice(0, 22)}...`);
    } catch (e) {
      setError(`ZK error: ${e.message}`);
      log(`❌ ${e.message}`);
    }
  }, [secret, salt, log]);

  const handleRecover = useCallback(async () => {
    if (!addr || !nameCommit || !proofHex || !contractId || !ritualComplete) return;
    setError("");
    try {
      setStep("ritual");
      // Verificar ritual
      if (useGH && ghOwner && ghRepo) {
        log(t("logGHVerifying"));
        const r = await validateGitHub(ghOwner, ghRepo, ghToken);
        if (!r.ok) { setError(r.missing ? t("ghErrMissingCommits", { missing: r.missing }) : t(r.errorKey)); setStep("idle"); return; }
        log(t("ghOk", { branch: r.branch }));
      } else {
        log(t("logLocalVerifying"));
        const ok = localBranches.some((b) => b.startsWith("rescue/")) &&
          ["clue:1", "clue:2", "clue:3"].every((c) => localCommits.some((cm) => cm.message === c));
        if (!ok) { setError(t("ritualNotComplete")); setStep("idle"); return; }
        log(t("logRitualOk"));
      }
      // Llamar recover_name con la proof real
      setStep("stellar");
      log("⛓ Enviando proof a ChihiroGame.recover_name()...");
      log("   UltraHonkVerifier.verify() ← proof + public_inputs + vk");
      log("   game_hub.end_game() si verify() == true");
      const r = await recoverName({
        playerAddress: addr,
        proofHex,
        nameCommitHex: nameCommit,
        contractId,
        vkHex: vkHex || null,
      });
      setTxHash(r.txHash); setStep("done");
      log(t("logProofVerified")); log(t("logEndGameOk")); log(t("logWinner")); log(t("logNameRecovered"));
      localStorage.setItem("chihiro-zk-proof-done", "true");
      onDone?.();
    } catch (e) { setError(e.message); setStep("idle"); log(`❌ ${e.message}`); }
  }, [addr, nameCommit, proofHex, contractId, vkHex, ritualComplete, useGH, ghOwner, ghRepo, ghToken, localBranches, localCommits, log, t, onDone]);

  const hasProof   = !!proofHex && !!nameCommit;
  const canProceed = addr && hasProof && contractId && ritualComplete;

  return (
    <div className="role-panel">
      <div className="zk-section">
        <div className="zk-section-title">{t("playerTitle")}</div>
        {!addr && <p className="zk-hint" style={{ color: "rgba(240,192,96,0.7)" }}>↑ Conectá tu wallet primero.</p>}
      </div>

      <div className="zk-section">
        <div className="zk-section-title">{t("playerS1")}</div>
        <div className="zk-field"><label>{t("playerContractLabel")}</label>
          <input className="zk-input" placeholder="C..." value={contractId} onChange={(e) => setContractId(e.target.value)} /></div>
      </div>

      {/* Paso 2: Generar proof (Poseidon2 + UltraHonk in-browser) */}
      <div className="zk-section">
        <div className="zk-section-title">🔮 Generar ZK proof (UltraHonk in-browser)</div>
        <p className="zk-hint">{t("playerSecretHint")}</p>
        <div className="zk-field"><label>{t("adminSecretLabel")}</label>
          <input type="password" className="zk-input" placeholder="tu secreto"
            value={secret} onChange={(e) => setSecret(e.target.value)} /></div>
        <div className="zk-field"><label>{t("adminSaltLabel")}</label>
          <input type="password" className="zk-input" placeholder="0x1234abcd (hex)"
            value={salt} onChange={(e) => setSalt(e.target.value)} /></div>
        <button className="zk-btn zk-btn-secondary" onClick={handleProve}
          disabled={!secret || !salt || step === "proving" || !zkAvailable}>
          🔮 Generar UltraHonk proof (in-browser, ~60s)
        </button>
        {!zkAvailable && (
          <p className="zk-hint" style={{ color: "rgba(240,192,96,0.6)", marginTop: 6 }}>
            ⚠ ZK engine no disponible — compilá el circuito primero.
          </p>
        )}
        {hasProof && (
          <div className="zk-commit-hash">
            <span className="zk-commit-label">✓ proof lista</span>
            <code style={{ color: "#50d890" }}>{nameCommit.slice(0, 20)}... ({proofHex.length / 2 - 1}B)</code>
          </div>
        )}
      </div>

      {/* Paso 3: Verificar ritual Git */}
      <div className="zk-section">
        <div className="zk-section-title">{t("playerS3")}</div>
        <div className="zk-toggle"><label>
          <input type="checkbox" checked={useGH} onChange={(e) => setUseGH(e.target.checked)} />
          <span>{t("playerGHToggle")}</span></label></div>
        {useGH ? (<>
          <div className="zk-field"><label>{t("playerGHOwner")}</label><input className="zk-input" placeholder="username" value={ghOwner} onChange={(e) => setGhOwner(e.target.value)} /></div>
          <div className="zk-field"><label>{t("playerGHRepo")}</label><input className="zk-input" placeholder="repo" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} /></div>
          <div className="zk-field"><label>{t("playerGHToken")}</label><input type="password" className="zk-input" placeholder="ghp_..." value={ghToken} onChange={(e) => setGhToken(e.target.value)} /></div>
        </>) : <p className="zk-hint">{t("playerLocalHint")}</p>}
      </div>

      <div className={`ritual-status-bar ${ritualComplete ? "complete" : "pending"}`}>
        {ritualComplete ? t("playerRitualOk") : t("playerRitualPending")}
      </div>

      <button className={`zk-btn zk-btn-primary ${step === "done" ? "zk-btn-success" : ""}`} onClick={handleRecover}
        disabled={!canProceed || step === "stellar" || step === "done"}>
        {step === "stellar" ? <span className="zk-loading"><span className="zk-spinner" />{t("playerRecoverStellar")}</span>
          : step === "done" ? t("playerRecoverDone")
          : "⚡ Recuperar Nombre → verify on-chain + end_game()"}
      </button>

      {error && <div className="zk-error">{error}</div>}
      {logs.length > 0 && <div className="zk-logs"><div className="zk-logs-title">{t("playerLogTitle")}</div>
        {logs.map((l, i) => <div key={i} className="zk-log-line">{l}</div>)}</div>}
      {step === "done" && txHash && (
        <div className="zk-success-card">
          <div className="zk-success-title">{t("playerSuccessTitle")}</div>
          <div className="zk-success-detail"><span>ZK proof</span><code>UltraHonk BN254 ✓</code></div>
          <div className="zk-success-detail"><span>Poseidon2 commit</span><code>{nameCommit.slice(0, 18)}...</code></div>
          <div className="zk-success-detail"><span>{t("playerSuccessHub")}</span><code>{GAME_HUB_CONTRACT_ID.slice(0, 10)}...</code></div>
          <a href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer" className="zk-explorer-link">{t("seeOnStellar")}</a>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ChihiroZKPanel({ ritualComplete, localCommits = [], localBranches = [] }) {
  const { t } = useTranslation("zk");
  const [role,           setRole]          = useState(null);
  const [adminDone,      setAdminDone]     = useState(false);
  const [playerDone,     setPlayerDone]    = useState(false);
  const [walletAddr,     setWalletAddr]    = useState(null);
  const [walletLoading,  setLoading]       = useState(false);
  const [walletError,    setWalletError]   = useState("");
  const [zkAvailable,    setZkAvail]       = useState(false);
  const [zkChecking,     setZkCheck]       = useState(true);
  const [zkError,        setZkError]       = useState(null);

  useEffect(() => { getConnectedAddress().then((a) => { if (a) setWalletAddr(a); }); }, []);

  // Inicializa el ZK engine (carga WASM + circuito compilado)
  useEffect(() => {
    initZK().then((ok) => {
      setZkAvail(ok);
      setZkCheck(false);
      if (!ok) setZkError(getZKError());
    });
  }, []);

  const handleConnect = useCallback(async () => {
    if (detectFreighter() === "missing") {
      setWalletError("Freighter no instalado. → freighter.app");
      return;
    }
    setWalletError(""); setLoading(true);
    try { const a = await connectWallet(); setWalletAddr(a); }
    catch (e) { setWalletError(e.message || String(e)); }
    finally { setLoading(false); }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await disconnectWallet(); setWalletAddr(null); setWalletError("");
  }, []);

  return (
    <div className="zk-panel">
      <RitualStepper walletAddr={walletAddr} adminDone={adminDone}
        ritualComplete={ritualComplete} playerDone={playerDone} t={t} />

      <div className="zk-header">
        <div className="zk-title-row">
          <span className="zk-icon">🔮</span>
          <span className="zk-title">{t("panelTitle")}</span>
          <span className={`zk-badge ${ritualComplete ? "complete" : "pending"}`}>
            {ritualComplete ? t("ritualBadgeOk") : t("ritualBadgePending")}
          </span>
        </div>
        <p className="zk-subtitle">{t("panelSubtitle")}</p>

        <ZKStatus available={zkAvailable} checking={zkChecking} error={zkError} />

        <WalletHeader address={walletAddr} loading={walletLoading} walletError={walletError}
          onConnect={handleConnect} onDisconnect={handleDisconnect} t={t} />

        {role && <button className="role-back-btn" onClick={() => setRole(null)}>{t("changeRole")}</button>}
      </div>

      {!role
        ? <RoleSelector onSelect={setRole} t={t} />
        : role === "admin"
          ? <AdminPanel addr={walletAddr} zkAvailable={zkAvailable} onDone={() => setAdminDone(true)} t={t} />
          : <PlayerPanel addr={walletAddr} zkAvailable={zkAvailable} ritualComplete={ritualComplete}
              localCommits={localCommits} localBranches={localBranches}
              onDone={() => setPlayerDone(true)} t={t} />
      }
    </div>
  );
}
