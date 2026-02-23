'use client'

import { StellarWalletsKit, FreighterModule } from '@creit-tech/stellar-wallets-kit'
import { Server } from '@stellar/stellar-sdk/rpc'
import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  scValToNative,
} from '@stellar/stellar-sdk'

// Network configuration
export const RPC_URL = 'https://soroban-testnet.stellar.org'
export const NETWORK_PASSPHRASE = Networks.TESTNET

export const GAME_HUB_CONTRACT_ID =
  process.env.NEXT_PUBLIC_GAME_HUB_CONTRACT_ID ||
  'CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG'

export const CHIHIRO_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CHIHIRO_CONTRACT_ID || null

export const ULTRAHONK_VERIFIER_ID =
  process.env.NEXT_PUBLIC_ULTRAHONK_VERIFIER_ID || null

let kitInitialized = false

function ensureKit() {
  if (!kitInitialized && typeof window !== 'undefined') {
    StellarWalletsKit.init({
      modules: [new FreighterModule()],
      network: Networks.TESTNET,
    })
    kitInitialized = true
  }
}

let rpc: Server | null = null

function getRpc(): Server {
  if (!rpc) rpc = new Server(RPC_URL)
  return rpc
}

export async function connectWallet(): Promise<string> {
  ensureKit()
  const { address } = await StellarWalletsKit.authModal()
  if (!address) throw new Error('No address returned from wallet')
  return address
}

export async function disconnectWallet() {
  ensureKit()
  StellarWalletsKit.disconnect?.()
}

export async function getConnectedAddress(): Promise<string | null> {
  try {
    ensureKit()
    const { address } = await StellarWalletsKit.getAddress()
    return address || null
  } catch {
    return null
  }
}

async function invoke(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signerAddress: string
) {
  ensureKit()
  const rpcServer = getRpc()

  const account = await rpcServer.getAccount(signerAddress)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build()

  const preparedTx = await rpcServer.prepareTransaction(tx)
  const xdrBase64 = preparedTx.toXDR()

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdrBase64, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signerAddress,
  })

  const submitted = await rpcServer.sendTransaction(signedTxXdr)

  if (submitted.status === 'ERROR') {
    throw new Error(`Submit error: ${JSON.stringify(submitted.errorResult)}`)
  }

  const txHash = submitted.hash

  if (submitted.status === 'PENDING') {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const result = await rpcServer.getTransaction(txHash)

      if (result.status === 'SUCCESS') {
        return {
          txHash,
          result: result.returnValue ? scValToNative(result.returnValue) : null,
        }
      }
      if (result.status === 'FAILED') {
        throw new Error(`Transaction failed. Hash: ${txHash}`)
      }
    }
    throw new Error(`Transaction not confirmed after 20s. Hash: ${txHash}`)
  }

  return { txHash, result: null }
}

export async function initializeGame({
  adminAddress,
  player2Address,
  nameCommitHex,
  vkHex = null,
  contractId = CHIHIRO_CONTRACT_ID,
}: {
  adminAddress: string
  player2Address: string
  nameCommitHex: string
  vkHex?: string | null
  contractId?: string | null
}) {
  if (!contractId) throw new Error('CHIHIRO_CONTRACT_ID not set')

  const vkToUse = vkHex ?? '00'

  const args = [
    new Address(adminAddress).toScVal(),
    new Address(player2Address).toScVal(),
    hexToBytes32(nameCommitHex),
    new Address(GAME_HUB_CONTRACT_ID).toScVal(),
    new Address(ULTRAHONK_VERIFIER_ID ?? adminAddress).toScVal(),
    hexToBytes(vkToUse),
  ]

  return invoke(contractId, 'initialize', args, adminAddress)
}

export async function recoverName({
  playerAddress,
  proofHex,
  nameCommitHex,
  contractId = CHIHIRO_CONTRACT_ID,
}: {
  playerAddress: string
  proofHex: string
  nameCommitHex: string
  contractId?: string | null
}) {
  if (!contractId) throw new Error('CHIHIRO_CONTRACT_ID not set')

  const publicInputsVec = xdr.ScVal.scvVec([hexToBytes32(nameCommitHex)])

  const args = [
    new Address(playerAddress).toScVal(),
    hexToBytes(proofHex),
    publicInputsVec,
  ]

  return invoke(contractId, 'recover_name', args, playerAddress)
}

function hexToBytes(hex: string): xdr.ScVal {
  const clean = hex.replace(/^0x/, '')
  return xdr.ScVal.scvBytes(Buffer.from(clean, 'hex'))
}

function hexToBytes32(hex: string): xdr.ScVal {
  const clean = hex.replace(/^0x/, '').padStart(64, '0').slice(0, 64)
  return xdr.ScVal.scvBytes(Buffer.from(clean, 'hex'))
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr ?? ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function explorerTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`
}
