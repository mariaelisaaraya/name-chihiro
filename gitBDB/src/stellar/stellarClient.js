// src/stellar/stellarClient.js
// Stellar SDK + Wallets Kit integration for "Chihiro's Lost Name"

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit";
import { FreighterModule } from "@creit-tech/stellar-wallets-kit/sdk/modules/freighter.module";
import { Server } from "@stellar/stellar-sdk/rpc";

import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  scValToNative,
  Transaction,
} from "@stellar/stellar-sdk";

// ─── Network constants ────────────────────────────────────────────────────────

export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const GAME_HUB_CONTRACT_ID =
  "CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG";

export const CHIHIRO_CONTRACT_ID =
  import.meta.env.VITE_CHIHIRO_CONTRACT_ID ?? null;

export const ULTRAHONK_VERIFIER_ID =
  import.meta.env.VITE_ULTRAHONK_VERIFIER_ID ?? null;

// ─── Wallets Kit init ─────────────────────────────────────────────────────────
let _kitInitialized = false;

function ensureKit() {
  if (!_kitInitialized) {
    StellarWalletsKit.init({
      modules: [new FreighterModule()],
      network: Networks.TESTNET,
    });
    _kitInitialized = true;
  }
}

// ─── RPC Server singleton ─────────────────────────────────────────────────────
let _rpc = null;
function getRpc() {
  if (!_rpc) _rpc = new Server(RPC_URL);
  return _rpc;
}

// ─── Wallet API ───────────────────────────────────────────────────────────────

export async function connectWallet() {
  ensureKit();
  const { address } = await StellarWalletsKit.authModal();
  if (!address) throw new Error("authModal() returned empty address");
  return address;
}

export async function disconnectWallet() {
  ensureKit();
  StellarWalletsKit.disconnect?.();
}

export async function getConnectedAddress() {
  try {
    ensureKit();
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ─── Freighter detection ──────────────────────────────────────────────────────
export function detectFreighter() {
  if (typeof window === "undefined") return "missing";
  return window.freighter ? "installed" : "missing";
}

// ─── Core invoke ──────────────────────────────────────────────────────────────
async function invoke(contractId, method, args, signerAddress) {
  ensureKit();
  const rpc = getRpc();

  // 1. Obtener cuenta
  const account = await rpc.getAccount(signerAddress);

  // 2. Construir la transacción
  const builtTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  // FIX: round-trip through XDR base64 to ensure prepareTransaction gets a real Transaction
  const txXdr = builtTx.toEnvelope().toXDR("base64");
  const tx = new Transaction(txXdr, NETWORK_PASSPHRASE);

  // 3. prepareTransaction (simulate + assemble)
  let preparedTx;
  try {
    preparedTx = await rpc.prepareTransaction(tx);
  } catch (err) {
    throw new Error(`prepareTransaction failed: ${err.message}`);
  }

  // 4. Convertir a XDR base64 para Freighter
  const xdrBase64 = preparedTx.toEnvelope().toXDR("base64");

  // 5. Firmar — abre el popup del wallet
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdrBase64, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signerAddress,
  });

  // 6. Enviar — reconstruct Transaction from signed XDR
  const signedTx = new Transaction(signedTxXdr, NETWORK_PASSPHRASE);
  const submitted = await rpc.sendTransaction(signedTx);

  if (submitted.status === "ERROR") {
    throw new Error(`Submit error: ${JSON.stringify(submitted.errorResult)}`);
  }

  // 7. Polling
  const txHash = submitted.hash;

  if (submitted.status === "PENDING") {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const result = await rpc.getTransaction(txHash);

      if (result.status === "SUCCESS") {
        return {
          txHash,
          result: result.returnValue ? scValToNative(result.returnValue) : null,
        };
      }
      if (result.status === "FAILED") {
        throw new Error(`Transaction failed on-chain. Hash: ${txHash}`);
      }
    }
    throw new Error(`No confirmado después de 20s. Hash: ${txHash}`);
  }

  if (submitted.status === "SUCCESS") {
    return { txHash, result: null };
  }

  throw new Error(`Status inesperado: ${submitted.status}`);
}

// ─── Funciones del juego ──────────────────────────────────────────────────────

export async function initializeGame({
  adminAddress,
  player2Address,
  nameCommitHex,
  vkHex,
  contractId = CHIHIRO_CONTRACT_ID,
}) {
  if (!contractId) throw new Error("Set VITE_CHIHIRO_CONTRACT_ID in .env");

  // vkHex puede ser null/vacío — el contrato acepta cualquier Bytes
  const vkToUse = vkHex || "00";

  if (!ULTRAHONK_VERIFIER_ID) {
    throw new Error("VITE_ULTRAHONK_VERIFIER_ID is not set in .env");
  }

  const args = [
    new Address(adminAddress).toScVal(),
    new Address(player2Address).toScVal(),
    hexToBytes32(nameCommitHex),
    new Address(GAME_HUB_CONTRACT_ID).toScVal(),
    new Address(ULTRAHONK_VERIFIER_ID).toScVal(),
    hexToBytes(vkToUse),
  ];

  return invoke(contractId, "initialize", args, adminAddress);
}

export async function recoverName({
  playerAddress,
  proofHex,
  nameCommitHex,
  contractId = CHIHIRO_CONTRACT_ID,
}) {
  if (!contractId) throw new Error("Setear VITE_CHIHIRO_CONTRACT_ID en .env");

  const publicInputsVec = xdr.ScVal.scvVec([hexToBytes32(nameCommitHex)]);

  const args = [
    new Address(playerAddress).toScVal(),
    hexToBytes(proofHex),
    publicInputsVec,
  ];

  return invoke(contractId, "recover_name", args, playerAddress);
}

export async function getGameStatus(contractId = CHIHIRO_CONTRACT_ID) {
  if (!contractId) return null;
  try {
    const rpc = getRpc();
    const source = await rpc.getAccount(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
    );

    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(new Contract(contractId).call("get_game_status"))
      .setTimeout(30)
      .build();

    const simResult = await rpc.simulateTransaction(tx);
    if (simResult.error || !simResult.result?.retval) return null;

    const native = scValToNative(simResult.result.retval);
    return { gameId: native[0], started: native[1], ended: native[2] };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToBytes(hex) {
  return xdr.ScVal.scvBytes(Buffer.from(hex.replace(/^0x/, ""), "hex"));
}

function hexToBytes32(hex) {
  const clean = hex.replace(/^0x/, "").padStart(64, "0").slice(0, 64);
  return xdr.ScVal.scvBytes(Buffer.from(clean, "hex"));
}

export function formatAddress(addr) {
  if (!addr || addr.length < 12) return addr ?? "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function explorerTxUrl(txHash) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}