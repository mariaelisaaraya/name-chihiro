import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Required for SharedArrayBuffer (used by @aztec/bb.js WASM prover)
const crossOriginHeaders = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ],
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.{js,ts}'],
    pool: 'forks',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          warning.message?.includes('@creit-tech/stellar-wallets-kit')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  resolve: {
    // Deduplicate Stellar SDK + pino shim for bb.js
    dedupe: ['@stellar/stellar-sdk'],
    alias: {
      buffer: 'buffer',
      '@creit-tech/stellar-wallets-kit/sdk/modules/freighter.module': path.resolve('./node_modules/@creit-tech/stellar-wallets-kit/esm/sdk/modules/freighter.module.js'),
      // @aztec/bb.js imports pino (CJS) — redirect to our ESM shim
      'pino': path.resolve(__dirname, 'src/shims/pino.js'),
    },
  },
  optimizeDeps: {
    // Pre-bundle Stellar SDK as a single unit
    include: ['@stellar/stellar-sdk', '@stellar/stellar-sdk/rpc'],
    // Exclude WASM packages from pre-bundling (they need special handling)
    exclude: ['@aztec/bb.js', '@noir-lang/noir_js', '@noir-lang/acvm_js', '@noir-lang/noirc_abi'],
    esbuildOptions: {
      preserveSymlinks: false,
    },
  },
  server: {
    headers: crossOriginHeaders,
  },
  preview: {
    headers: crossOriginHeaders,
  },
})
