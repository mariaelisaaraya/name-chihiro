# 🌊 Chihiro's Lost Name — gitBDB
### Stellar Hacks: ZK Gaming Hackathon · Git Education Tool

**🌐 Language / Idioma:** [English](#english-version) | [Español](#versión-en-español)

---

## English Version

> *"Yubaba stole your name and encrypted it on the blockchain. To recover it you must complete the Sacred Git Ritual and mathematically prove you know your secret — without revealing it."*

### What is this project?

Two projects in one:

| Project | Audience | What it demonstrates |
|---------|----------|----------------------|
| **🌊 Chihiro's Lost Name** | Hackathon judges / ZK devs | ZK Gaming on Stellar Soroban (Protocol 25 / BN254 + Poseidon2) |
| **📚 gitBDB Git Simulator** | Students / Git learners | Git & GitHub learning via missions and a browser-based terminal |

### Quick Start

**Prerequisites:** Node.js 18+, npm 9+. Works on Linux, macOS, and Windows.

```bash
# Clone and install
git clone <repo-url>
cd gitBDB
npm install
npm run dev
# → Open http://localhost:5173
```

**No installation required to play** — the app runs entirely in the browser. Git operations use [isomorphic-git](https://isomorphic-git.org/) with an in-memory filesystem.

### Game Flow (Chihiro's Lost Name)

```
Admin browser              Stellar Testnet            Player2 browser
─────────────              ───────────────            ───────────────
nameSecret + salt    →     nameCommit (hash)
                     →     game_id (from Game Hub)

                                               nameSecret + salt
                                               ↓
                                           ZK proof (WASM)
                                               ↓
                           verify(proof)  ←──────────────────
                           end_game()
                               ↓
                           player2 wins ✓
```

**Mission 1** — Create a `rescue/` branch: `git checkout -b rescue/chihiro`

**Mission 2** — Make 3 commits: `git commit --allow-empty -m "clue:1"` (repeat for clue:2, clue:3)

**Mission 3** — Generate ZK proof in the browser and submit to Stellar Soroban

### Language Support

The UI auto-detects your browser language (English/Spanish). You can also toggle manually using the **EN/ES** button in the bottom status bar. The git commands themselves (git init, git commit, etc.) are universal and never change.

### Cross-Platform Notes

| Platform | Status | Notes |
|----------|--------|-------|
| **Linux** | ✅ Fully tested | Use any modern browser |
| **macOS** | ✅ Fully tested | Chrome/Firefox/Safari |
| **Windows** | ✅ Supported | Use npm in PowerShell or Git Bash |

**Windows-specific:** If you encounter path issues, run `npm run dev` from Git Bash. Node.js 18+ required (download from [nodejs.org](https://nodejs.org)).

### ZK Proofs on Stellar (Protocol 25 / X-Ray)

> 📖 Official docs: [developers.stellar.org/docs/build/apps/zk](https://developers.stellar.org/docs/build/apps/zk)

Protocol 25 "X-Ray" (active on testnet) added native host functions for:
- **BN254** — elliptic curve + pairing operations (equivalent to EIP-196/EIP-197 on Ethereum)
- **Poseidon2** — ZK-friendly hash native to Soroban contracts

This enables fully on-chain ZK proof verification without intermediaries.

### Deploy the Soroban Contract

```bash
# Step 1: Upload WASM (returns hash)
stellar contract upload --wasm target/wasm32v1-none/release/chihiro_game.wasm \
  --source admin --network testnet

# Step 2: Deploy using the hash
stellar contract deploy --wasm-hash <WASM_HASH> \
  --source admin --network testnet
# → Save the CONTRACT_ID

# Step 3: Generate TypeScript bindings (optional but recommended)
stellar contract bindings typescript \
  --contract-id $CHIHIRO_CONTRACT_ID \
  --output-dir ./src/contracts/chihiro-game \
  --network testnet
```

### Project Structure

```
gitBDB/                        ← Frontend (React + Vite)
  src/
    i18n/                      ← Internationalization (react-i18next)
    components/chihiro/        ← ZK Panel UI
    activities/                ← Mission definitions + validators
    stellar/                   ← Stellar SDK integration
    public/locales/en/         ← English translations (JSON)
    public/locales/es/         ← Spanish translations (JSON)

gitBDB-contracts/              ← Soroban smart contract (Rust)
gitBDB-circuits/               ← Noir ZK circuit
```

---

## Versión en Español

> *"Yubaba robó tu nombre y lo encriptó en la blockchain. Para recuperarlo tenés que completar el Ritual Git Sagrado y demostrar matemáticamente que conocés tu secreto — sin revelarlo."*

---

## 📋 Índice

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [Entender el producto — Flujo completo](#entender-el-producto--flujo-completo)
3. [Estructura de archivos](#estructura-de-archivos)
4. [Requisitos previos](#requisitos-previos)
5. [Setup inicial del frontend](#setup-inicial-del-frontend)
6. [Compilar y deployar el contrato Soroban](#compilar-y-deployar-el-contrato-soroban)
7. [Compilar el circuito Noir](#compilar-el-circuito-noir)
8. [Flujo de juego paso a paso (con comandos)](#flujo-de-juego-paso-a-paso-con-comandos)
9. [Cómo probarlo localmente (demo sin blockchain)](#cómo-probarlo-localmente-demo-sin-blockchain)
10. [Cómo probarlo en testnet real](#cómo-probarlo-en-testnet-real)
11. [Para la clase de Git](#para-la-clase-de-git)
12. [Checklist hackathon](#checklist-hackathon)
13. [Troubleshooting](#troubleshooting)

---

## ¿Qué es este proyecto?

**Dos proyectos en uno:**

| Proyecto | Audiencia | Qué demuestra |
|---|---|---|
| 🎓 **Git Trainer** | Alumnos | Git branches y commits como mecánica de juego interactiva |
| 🏆 **ZK Game** | Hackathon | ZK proofs verificables on-chain en Stellar con Game Hub |

**La mecánica central (ZK como gameplay):**
- El "admin" (Yubaba/player1) encripta un nombre con `Poseidon2(secreto, salt)` → guarda ese hash on-chain. Ese hash es el "nombre robado".
- El jugador (Chihiro/player2) debe **demostrar matemáticamente** que conoce el nombre secreto, *sin revelarlo*, usando un ZK proof.
- El contrato verifica el proof on-chain y declara ganador a player2.

---

## Entender el producto — Flujo completo

```
╔══════════════════════════════════════════════════════════════════════╗
║                    FLUJO COMPLETO DEL JUEGO                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ANTES DEL JUEGO (preparación única):                                ║
║  ─────────────────────────────────────                               ║
║  [ADMIN/DEV] Deploy del contrato ChihiroGame.wasm en Stellar testnet ║
║      ↓                                                               ║
║  [ADMIN/DEV] Compila circuito Noir → genera VK (verification key)    ║
║                                                                      ║
║  ════════════════════════════════════════════════════════            ║
║                                                                      ║
║  TURNO DEL ADMIN (player1 / "Yubaba" / el que roba el nombre):       ║
║  ─────────────────────────────────────────────────────────           ║
║  1. Abre la UI → selecciona rol "Admin"                              ║
║  2. Conecta su wallet Freighter (player1)                            ║
║  3. Ingresa el nombre secreto + salt en el panel ZK                  ║
║     → La UI calcula: nameCommit = Poseidon2(secreto, salt)           ║
║     → Este hash se guardará on-chain. El secreto nunca sale.         ║
║  4. Ingresa la address de player2 (Chihiro)                          ║
║  5. Click "Inicializar → start_game()"                               ║
║     → Freighter abre popup para firmar la tx                         ║
║     → Tx se envía a Soroban testnet                                  ║
║     → ChihiroGame.initialize() se ejecuta:                           ║
║         ├─ guarda nameCommit on-chain                                ║
║         ├─ llama game_hub.start_game(player1, player2)               ║
║         └─ guarda game_id devuelto por el hub                        ║
║  6. Comparte el Contract ID con Chihiro (player2)                    ║
║                                                                      ║
║  ════════════════════════════════════════════════════════            ║
║                                                                      ║
║  TURNO DEL JUGADOR (player2 / "Chihiro" / el que recupera):          ║
║  ─────────────────────────────────────────────────────────           ║
║  7. Abre la UI → selecciona rol "Chihiro"                            ║
║  8. Conecta su wallet Freighter (DISTINTA a la del admin)            ║
║  9. Ingresa el Contract ID que le dio el admin                       ║
║  10. Completa el Ritual Git en la terminal de la UI:                 ║
║      git init                                                        ║
║      git checkout -b rescue/chihiro                                  ║
║      git commit --allow-empty -m "clue:1"                            ║
║      git commit --allow-empty -m "clue:2"                            ║
║      git commit --allow-empty -m "clue:3"                            ║
║      → La UI detecta automáticamente que el ritual está completo     ║
║  11. Ingresa el mismo secreto + salt que usó el admin                ║
║      → La UI calcula nameCommit para verificación local              ║
║  12. Click "Recuperar Nombre → ZK + end_game()"                      ║
║      PASO A) Valida el ritual (local o GitHub API)                   ║
║      PASO B) Genera ZK proof en el browser:                          ║
║              - Input privado: secreto, salt (NUNCA salen del browser)║
║              - Input público: nameCommit (el hash on-chain)          ║
║              - Proof demuestra: "sé el preimage de ese hash"         ║
║      PASO C) Envía a Soroban: recover_name(proof, [nameCommit])      ║
║              → Freighter abre popup para firmar                      ║
║              → ChihiroGame.recover_name() se ejecuta:                ║
║                  ├─ verifica proof con UltraHonk verifier (BN254)    ║
║                  ├─ llama game_hub.end_game(game_id, player2)        ║
║                  └─ emite evento WIN(player2, game_id, nameCommit)   ║
║  13. 🏆 player2 gana — el nombre fue "recuperado"                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### ¿Qué pasa exactamente en cada capa?

```
BROWSER (React)                SOROBAN TESTNET              GAME HUB
──────────────────             ──────────────────           ──────────────
UI Admin Panel
  │
  ├─ connectWallet()     ←→    Freighter firma tx
  │
  ├─ initializeGame()
  │   nameCommit = SHA256/Poseidon2(secreto, salt)
  │   build tx → simulate → sign → submit
  │                       ──→   ChihiroGame.initialize()
  │                                 │
  │                                 └──────────────────→  start_game(p1,p2)
  │                                                        returns game_id
  │                                 game_id stored ←──────
  │
UI Player Panel
  │
  ├─ validateRitual()    ←→    isomorphic-git (local) / GitHub API
  │
  ├─ generateZKProof()
  │   Noir.js + Barretenberg WASM
  │   private: secreto, salt
  │   public:  nameCommit
  │   → proof bytes (~2-8KB)
  │
  ├─ recoverName()
  │   build tx → simulate → sign → submit
  │                       ──→   ChihiroGame.recover_name()
  │                                 │
  │                                 ├── UltraHonkVerifier.verify(proof)
  │                                 │   (BN254 / Protocol 25 / X-Ray)
  │                                 │   ← true / panic
  │                                 │
  │                                 └──────────────────→  end_game(game_id, p2)
  │
  └─ txHash + WIN event ←─────────────────────────────────────────────
```

---

## Estructura de archivos

```
gitBDB/                              ← Frontend React (Vite)
├── .env.example                     ← Variables de entorno (copiar a .env)
├── src/
│   ├── stellar/
│   │   └── stellarClient.js         ← ⭐ NÚCLEO: Stellar SDK + Wallets Kit
│   │       ├── connectWallet()      ←    Abre modal Freighter/xBull
│   │       ├── initializeGame()     ←    Llama initialize() → start_game()
│   │       ├── recoverName()        ←    Llama recover_name() → end_game()
│   │       └── getGameStatus()      ←    Lee estado del contrato
│   │
│   ├── components/chihiro/
│   │   ├── ChihiroZKPanel.jsx       ← UI del panel ZK (Admin + Player)
│   │   ├── SpiritWorldBackground.jsx← Fondo animado del castillo
│   │   └── chihiro.css              ← Estilos Spirit World
│   │
│   ├── activities/
│   │   ├── chihiroActivity.js       ← Config de la actividad (misiones, comandos)
│   │   ├── chihiroValidators.js     ← Detecta branches/commits via isomorphic-git
│   │   └── registry.js              ← Todas las actividades registradas
│   │
│   ├── pages/
│   │   ├── HomePage.jsx             ← Landing con Chihiro featured
│   │   └── ActivityPage.jsx         ← Router de actividades
│   │
│   └── App.jsx                      ← Shell principal + Spirit World toggle

gitBDB-contracts/
└── chihiro-game/
    ├── Cargo.toml                   ← Dependencias Rust (soroban-sdk 22)
    └── src/lib.rs                   ← ⭐ Contrato Soroban
        ├── GameHub trait            ←    start_game() + end_game()
        ├── UltraHonkVerifier trait  ←    verify(proof, inputs, vk)
        ├── initialize()             ←    Registra juego + llama start_game()
        ├── recover_name()           ←    Verifica ZK proof + llama end_game()
        ├── get_name_commit()        ←    View: lee el hash guardado
        └── get_game_status()        ←    View: (game_id, started, ended)

gitBDB-circuits/
└── chihiro-name/
    ├── Nargo.toml                   ← Config del circuito Noir
    └── src/main.nr                  ← ⭐ Circuito ZK
        └── main(secret, salt, pub nameCommit)
            └── assert Poseidon2(secret, salt) == nameCommit
```

---

## Requisitos previos

### Para correr el frontend (mínimo para demo):
```bash
node --version    # Necesitás Node.js >= 18
npm --version     # npm >= 9
```

### Para compilar y deployar el contrato:
```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Target WASM para Soroban (usar wasm32v1-none, NO wasm32-unknown-unknown)
rustup target add wasm32v1-none

# Stellar CLI
cargo install --locked stellar-cli --features opt

# Verificar
stellar --version    # debe ser >= 22
```

### Para compilar el circuito Noir:
```bash
# Noir (Nargo)
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup                   # instala la última versión estable
nargo --version          # verificar
```

### Wallet (para testnet real):
- Instalar **Freighter** en Chrome: https://freighter.app/
- Cambiar a **Testnet** en la configuración de Freighter

---

## Setup inicial del frontend

```bash
# 1. Clonar o descomprimir el proyecto
cd gitBDB

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con los contract IDs después de deployar (ver sección Deploy)

# 3. Instalar dependencias
# El kit de wallets (@creit-tech/stellar-wallets-kit v2) está en JSR, no NPM.
# npm lo resuelve automáticamente vía el campo "exports" del package.json.
# Si usás pnpm o deno, ver: stellarwalletskit.dev/installation
npm install

# 4. Correr en modo desarrollo
npm run dev
# → Abre http://localhost:5173
# → Ir a la card "🌊 Chihiro's Lost Name"

# Para producción:
npm run build
npm run preview
```

**Nota:** Sin llenar el `.env`, el juego funciona en **modo demo** — los mocks simulan el blockchain. Para conectar la blockchain real, necesitás deployar el contrato (sección siguiente).

---

## Compilar y deployar el contrato Soroban

> ⚠️ Este proceso se hace **una sola vez** antes de que alguien juegue. Lo hace el admin (el dev, vos).

### Paso 1 — Compilar el contrato a WASM

```bash
cd gitBDB-contracts/chihiro-game

# Compilar
stellar contract build
# El output es: target/wasm32v1-none/release/chihiro_game.wasm

# Si falla, asegurarse de tener el target correcto:
rustup target add wasm32v1-none
```

### Paso 2 — Crear cuentas en testnet

```bash
# Crear keypairs para admin y player2
stellar keys generate admin --network testnet
stellar keys generate player2 --network testnet

# Ver las addresses
stellar keys address admin
# → G... (guardá esto, es tu player1 address)

stellar keys address player2
# → G... (guardá esto, es tu player2 address)

# Fondear con XLM de testnet (gratis, es testnet)
stellar keys fund admin --network testnet
stellar keys fund player2 --network testnet
```

### Paso 3 — Deployar el contrato

```bash
# PASO 3A — Subir el WASM a la red (guarda el bytecode, devuelve un hash)
# Nota: 'stellar contract install' está DEPRECADO — usar 'upload'
stellar contract upload \
  --wasm target/wasm32v1-none/release/chihiro_game.wasm \
  --source admin \
  --network testnet
# → Output: <WASM_HASH>  (guárdalo)

# PASO 3B — Deployar usando el hash (crea la instancia del contrato)
stellar contract deploy \
  --wasm-hash <WASM_HASH> \
  --source admin \
  --network testnet
# → Output: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Ese es tu CONTRACT_ID — guardalo

export CHIHIRO_CONTRACT_ID="CXXX..."
```

### Paso 4 — Generar TypeScript bindings (opcional pero recomendado)

```bash
# Genera tipos TypeScript del contrato — hace el frontend type-safe
cd ../../gitBDB

stellar contract bindings typescript \
  --contract-id $CHIHIRO_CONTRACT_ID \
  --output-dir ./src/contracts/chihiro-game \
  --network testnet

# Luego podés importar el cliente tipado en lugar de invocar manualmente:
# import ChihiroGameContract from './contracts/chihiro-game'
# const result = await ChihiroGameContract.get_game_status()
```

### Paso 5 — Copiar el ID al .env del frontend

```bash
# En gitBDB/.env
VITE_CHIHIRO_CONTRACT_ID=CXXX...
VITE_ULTRAHONK_VERIFIER_ID=CYYY...    # ver sección siguiente
```

### Paso 5 — Verificar el deploy (opcional pero recomendado)

```bash
# Leer el estado inicial — debe devolver game_id=0, started=false, ended=false
stellar contract invoke \
  --id $CHIHIRO_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- get_game_status

# Ver en el explorador
echo "https://stellar.expert/explorer/testnet/contract/$CHIHIRO_CONTRACT_ID"
```

---

## ZK Proofs en Stellar (Protocol 25 / X-Ray)

> 📖 Documentación oficial: [developers.stellar.org/docs/build/apps/zk](https://developers.stellar.org/docs/build/apps/zk)

El **Protocol 25 "X-Ray"** (activo en testnet) agregó funciones host nativas para:
- **BN254** — curva elíptica + operaciones de pairing (equivalente a EIP-196/EIP-197 de Ethereum)
- **Poseidon2** — hash ZK-friendly nativo en contratos Soroban

Esto permite verificar pruebas ZK **completamente on-chain** sin intermediarios.

Este proyecto usa **Noir + UltraHonk** sobre BN254:
- El circuito prueba `Poseidon2(nameSecret, salt) == nameCommit` sin revelar el secreto
- La prueba se genera en el browser (WASM de Barretenberg)
- El contrato `ChihiroGame` la verifica llamando a `UltraHonkVerifier.verify()`
- La verificación ocurre 100% on-chain gracias a las host functions de Protocol 25

> La SDF también publicó un prototipo de **Stellar Private Payments** usando
> Groth16 + Circom (misma arquitectura, diferente sistema de prueba).
> Código abierto en GitHub para referencia.

## Compilar el circuito Noir

> Este paso genera la **Verification Key (VK)** que el contrato usa para verificar los proofs. También se hace una sola vez.

```bash
cd gitBDB-circuits/chihiro-name

# Verificar que el circuito compila
nargo check

# Correr los tests del circuito
nargo test
# → test test_valid_name_recovery ... ok
# → test test_wrong_secret_fails ... ok (expected fail)
# → test test_wrong_salt_fails   ... ok (expected fail)

# Compilar → genera los artefactos
nargo compile
# Output en: target/chihiro_name.json       ← el circuito compilado
#            target/chihiro_name.vk         ← la verification key

# Convertir la VK a hex para pasarla al contrato
xxd -p target/chihiro_name.vk | tr -d '\n'
# → string hexadecimal largo, ej: 0102030405...
# Guardá esto — es el --verification_key que necesita initialize()
```

---

## Flujo de juego paso a paso (con comandos)

Este es el **flujo completo end-to-end** para una partida real en testnet.

### 🔧 PRE-JUEGO (solo el dev/admin, una vez)

```bash
# ── TERMINAL 1 ──

# 1. Compilar contrato
cd gitBDB-contracts/chihiro-game
stellar contract build

# 2. Upload WASM + Deploy ('install' está deprecado, usar 'upload')
stellar contract upload \
  --wasm target/wasm32v1-none/release/chihiro_game.wasm \
  --source admin \
  --network testnet
# → Guardá el WASM_HASH

stellar contract deploy \
  --wasm-hash <WASM_HASH> \
  --source admin \
  --network testnet
# → Guardá el CONTRACT_ID

# 3. Compilar circuito y obtener VK
cd ../../gitBDB-circuits/chihiro-name
nargo compile
VK_HEX=$(xxd -p target/chihiro_name.vk | tr -d '\n')

# 4. Levantar el frontend
cd ../../gitBDB
echo "VITE_CHIHIRO_CONTRACT_ID=$CHIHIRO_CONTRACT_ID" >> .env
npm install && npm run dev
```

### 🏯 TURNO ADMIN (player1 — "roba el nombre")

> Esto puede hacerse desde la UI o desde la CLI. Acá muestro los dos.

**Opción A — desde la UI (recomendado para la demo):**

1. Abrir `http://localhost:5173`
2. Click en **"🌊 Chihiro's Lost Name"**
3. En el panel lateral, seleccionar rol → **Admin**
4. Click **"Conectar Wallet"** → Freighter abre popup → aprobar
5. Completar los campos:
   - **Contract ID**: el que obtuviste al deployar
   - **Player2 address**: la G... de player2
   - **nameSecret**: `chihiro` (o cualquier nombre)
   - **salt**: `0x1a2b3c4d` (o cualquier valor)
6. Click **"Calcular nameCommit"** → verás el hash
7. Click **"⚡ Inicializar → start_game()"**
   - Freighter abre popup → confirmar la tx
   - La UI muestra el log: `start_game() ejecutado ✓`
8. Copiar el Contract ID y pasárselo a player2

**Opción B — desde la CLI (útil para testing/debugging):**

```bash
# Primero calcular el nameCommit off-chain
# (en producción usás Poseidon2, acá usamos SHA-256 como placeholder)
# El valor real lo calcula la UI y lo mostrás en pantalla

# Invocar initialize() en el contrato
stellar contract invoke \
  --id $CHIHIRO_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin) \
  --player2 $(stellar keys address player2) \
  --name_commit "0102030405060708091011121314151617181920212223242526272829303132" \
  --game_hub_contract "CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG" \
  --verifier_contract "CYYY..." \
  --verification_key "$VK_HEX"

# Verificar que el juego quedó iniciado
stellar contract invoke \
  --id $CHIHIRO_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- get_game_status
# → (game_id: 42, started: true, ended: false)
# El game_id lo asigna el Game Hub automáticamente
```

### 🌊 TURNO JUGADOR (player2 — "recupera el nombre")

**Paso 1 — Ritual Git (en la terminal de la UI):**

```
# Estos comandos se tipean en la terminal DENTRO de la app
# (No es tu terminal real — es la terminal simulada de la UI)

git init
git checkout -b rescue/chihiro
git commit --allow-empty -m "clue:1"
git commit --allow-empty -m "clue:2"
git commit --allow-empty -m "clue:3"
git log --oneline
# → verás los 3 commits
```

Una vez completado, el panel lateral muestra automáticamente:
`✅ Ritual completo — rescue/ + clue:1/2/3 detectados`

**Paso 2 — ZK Proof y end_game() (desde la UI):**

1. Seleccionar rol → **Chihiro**
2. Click **"Conectar Wallet"** → Freighter de player2 (distinto al admin)
3. Ingresar el Contract ID del admin
4. Ingresar el mismo `nameSecret` y `salt` que usó el admin
5. Click **"Calcular nameCommit"** → debe coincidir con el on-chain
6. Click **"⚡ Recuperar Nombre → ZK + end_game()"**

Internamente ocurre esto (visible en el log de la UI):
```
🔍 Verificando ritual local...        ← detecta rescue/ + clue:1/2/3
✅ Ritual verificado

🔮 Generando ZK proof (Noir UltraHonk)...
   Private: secret, salt  |  Public: nameCommit
✅ Proof: 0x3a7f12...                 ← ~2KB de bytes

🌟 recover_name(proof, [nameCommit]) → Soroban...
   → UltraHonk verifier (BN254 / Protocol 25)
   → game_hub.end_game(game_id, player2)

🎉 Proof verificado on-chain!
   Tx: A3F12B...
   end_game() ejecutado ✅
   🏆 player2 = winner
   🌊 ¡Nombre recuperado, Chihiro!
```

7. Freighter abre popup → confirmar la tx
8. El link **"Ver en Stellar Expert →"** te lleva a la tx real

**Verificar desde CLI que el juego terminó:**

```bash
stellar contract invoke \
  --id $CHIHIRO_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- get_game_status
# → (game_id: 42, started: true, ended: true)  ← ended=true confirma el fin
```

---

## Cómo probarlo localmente (demo sin blockchain)

Si no querés deployar nada, el proyecto funciona en **modo demo** — el botón ZK simula todo con mocks que imitan delays reales.

```bash
cd gitBDB
npm install
npm run dev
# → http://localhost:5173
```

1. Click en **"🌊 Chihiro's Lost Name"**
2. Seleccionar rol **Admin** → conectar wallet (Freighter en testnet)
   - Si no tenés Freighter, el sistema mockea también la conexión
3. Ingresar cualquier secreto + salt → calcular hash
4. Click "Inicializar" → verás el log simulado (sin tx real)
5. Ir a rol **Chihiro** → completar el ritual en la terminal
6. Click "Recuperar Nombre" → verás la simulación completa del flujo ZK

**La diferencia entre demo y real:**
- Demo: los mocks usan `setTimeout` para simular latencia, el "txHash" es aleatorio
- Real: Freighter firma transacciones reales, el txHash existe en el explorador

---

## Cómo probarlo en testnet real

```bash
# Requisitos:
# - Freighter instalado en Chrome
# - Freighter configurado en Testnet
# - Contrato deployado (sección anterior)
# - .env con los contract IDs

cd gitBDB
npm run dev

# En Freighter:
# Settings → Network → Testnet → Save

# En la app:
# 1. Admin conecta → inicializa con start_game()
# 2. Player2 conecta con OTRA cuenta Freighter → ritual → end_game()
```

**Tip:** Para tener dos cuentas Freighter distintas en la misma máquina, usá dos perfiles de Chrome.

---

## Para la clase de Git

Este proyecto fue diseñado para enseñar Git de forma memorable.

**Script para la clase:**

> "Hoy vamos a aprender Git de la manera más rara posible. Chihiro perdió su nombre. Para recuperarlo necesita hacer exactamente tres cosas en Git. Cada comando que van a aprender hoy es parte del hechizo."

**Conceptos que cubre cada comando:**

```bash
git init
# → Concepto: inicializar un repositorio. El "mundo virtual" donde Git trackea cambios.

git checkout -b rescue/chihiro
# → Concepto: branches (ramas). Un espacio de trabajo aislado con nombre propio.
#   La convención "rescue/" es un prefijo — como "feature/" o "fix/" en proyectos reales.
#   Pregunta a la clase: ¿por qué usar una rama y no trabajar en main?

git commit --allow-empty -m "clue:1"
# → Concepto: commits con mensajes exactos como datos estructurados.
#   El flag --allow-empty permite commitear sin archivos (para este ritual).
#   Pregunta: ¿qué pasa si el mensaje dice "Clue:1" con mayúscula?
#   Respuesta: el validador falla — Git es case-sensitive.

git log --oneline
# → Concepto: el historial de Git como registro inmutable.
#   Cada commit tiene un hash único. Si cambiás algo, el hash cambia.
#   Conexión ZK: esto es lo mismo que hace Poseidon2 con el nombre secreto.
```

**La conexión ZK para la clase:**

```
Hash en Git:
  git commit -m "clue:1"  →  SHA-1: a3f72b...
  Cambio de mensaje       →  SHA-1: 99c120...  (completamente diferente)

Hash en ZK:
  Poseidon2("chihiro", salt)  →  0x3a7f12...
  Poseidon2("chihira", salt)  →  0x99c130...  (completamente diferente)

Mismo concepto: función hash = función unidireccional
Si solo conocés el hash, no podés recuperar el input original.
Pero si conocés el input, podés demostrar (con ZK) que sabés el preimage.
```

---

## Checklist hackathon

```
✅ ZK como mecánica central
   Poseidon2 hash preimage proof (Noir UltraHonk)
   Protocolo 25 / X-Ray: BN254 + Poseidon2 nativo en Stellar

✅ start_game() llamado
   ChihiroGame.initialize() → game_hub.start_game(player1, player2) → u64

✅ end_game() llamado
   ChihiroGame.recover_name() → game_hub.end_game(game_id, player2)

✅ Game Hub contract
   CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG

✅ Frontend funcional
   React + Vite + Stellar Wallets Kit + Spirit World theme

✅ 2 jugadores con wallets distintas
   Admin Panel (player1) + Player Panel (player2)

✅ ZK verificable on-chain
   UltraHonk verifier en Soroban (BN254)

⏳ Repo público en GitHub
   Crear y pushear el repo antes de la deadline

⏳ Video demo (2-3 min)
   Mostrar: UI → ritual Git → ZK proof → tx en Stellar Expert
```

---

## Troubleshooting

### "CHIHIRO_CONTRACT_ID not set"
```bash
# El .env no tiene el contract ID
cp .env.example .env
# Agregar el ID que obtuviste al deployar
echo "VITE_CHIHIRO_CONTRACT_ID=CXXX..." >> .env
npm run dev  # reiniciar el servidor
```

### "stellar contract build" falla
```bash
# Asegurarse del target correcto
rustup target add wasm32v1-none
# NO usar wasm32-unknown-unknown — Soroban requiere wasm32v1-none
```

### Freighter no aparece en la UI
```bash
# La extensión debe estar instalada y desbloqueada
# https://freighter.app/
# Verificar que esté en la red Testnet (no Mainnet)
```

### La tx falla con "Simulation failed"
```bash
# Puede ser que la cuenta no tenga XLM en testnet
stellar keys fund admin --network testnet
# O que el contrato no esté inicializado correctamente
stellar contract invoke --id $ID --source admin --network testnet -- get_game_status
```

### El proof ZK falla con "InvalidProof"
```bash
# El nameCommit que envía el jugador no coincide con el guardado on-chain
# Verificar que admin y player2 usaron EXACTAMENTE el mismo secreto y salt
# El contrato hace: assert(public_inputs[0] == stored_name_commit)
```

### El ritual no se detecta en la UI
```bash
# En la terminal de la app, verificar:
git branch          # debe mostrar rescue/chihiro o rescue/algo
git log --oneline   # deben aparecer clue:1, clue:2, clue:3
# Los mensajes son EXACTOS — case sensitive, sin espacios extra
```

---

*Proyecto creado para Stellar Hacks: ZK Gaming · gitBDB · 2026*
