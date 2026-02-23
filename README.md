# Chihiro's Lost Name

Una experiencia de gaming con Zero-Knowledge proofs inspirada en El Viaje de Chihiro, construida con las mejores prácticas de [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio).

## Características

- **Zero-Knowledge Proofs**: Usa Noir UltraHonk para probar conocimiento sin revelarlo
- **Multiplayer Real-time**: Sistema de sesiones multiplayer con Supabase Realtime
- **Blockchain Gaming**: Integración completa con Stellar blockchain y Freighter wallet
- **Git Simulator**: Aprende Git mientras juegas
- **i18n Support**: Múltiples idiomas soportados

## Tech Stack

- **Frontend**: Next.js 16 con React 19.2 y TypeScript
- **Backend**: Vercel Serverless Functions (reemplazo del prove-server local)
- **Database**: Supabase PostgreSQL con Row Level Security
- **Real-time**: Supabase Realtime para sincronización multiplayer
- **Storage**: Supabase Storage para assets del juego (TTL: 30 días)
- **Blockchain**: Stellar testnet con Soroban smart contracts
- **ZK**: Noir circuits con UltraHonk backend

## Arquitectura

```
app/
├── api/                    # Serverless Functions (prove, commit, health)
├── game/                   # Single-player game page
├── multiplayer/            # Multiplayer lobby & sessions
└── page.tsx               # Landing page

lib/
├── supabase/              # Database client & utilities
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client
│   └── storage.ts         # Asset management
├── stellar/               # Blockchain integration
│   └── client.ts          # Wallet & contract interactions
└── multiplayer/           # Real-time multiplayer
    ├── session.ts         # Session management
    └── use-realtime.ts    # Real-time hooks

scripts/
└── 01-setup-multiplayer-schema.sql  # Database migration

gitBDB/                    # Original Vite project (legacy)
gitBDB-contracts/          # Soroban smart contracts (Rust)
gitBDB-circuits/           # Noir ZK circuits
```

## Deployment

### 1. Configurar Supabase

1. La integración de Supabase ya está conectada
2. Ejecuta la migración SQL desde Supabase dashboard:
   - Copia el contenido de `scripts/01-setup-multiplayer-schema.sql`
   - Pégalo en SQL Editor de Supabase
   - Ejecuta el script
3. Crea el bucket de Storage: 
   - Ve a Storage en Supabase
   - Crea bucket `game-assets` (público)

### 2. Variables de Entorno

Las variables de Supabase se configuran automáticamente. Solo necesitas agregar las de Stellar:

```bash
NEXT_PUBLIC_CHIHIRO_CONTRACT_ID=<tu-contract-id>
NEXT_PUBLIC_ULTRAHONK_VERIFIER_ID=<tu-verifier-id>
```

### 3. Deploy

El proyecto se deploya automáticamente en Vercel desde v0. También puedes correr localmente:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Diferencias con el Proyecto Original

### Migración de Vite Monorepo → Next.js 16

- **Antes**: `gitBDB/` con Vite + React Router
- **Ahora**: Next.js App Router con Server Components

### Prove Server → Serverless Functions

- **Antes**: `scripts/prove-server.js` corriendo en local (puerto 4001)
- **Ahora**: `/api/prove` y `/api/commit` como Vercel Functions
- **Ventaja**: maxDuration: 300s (5 min) para proofs pesados

### Supabase Real-time Multiplayer (NUEVO)

- Sistema de sesiones compartibles vía URL
- Real-time sync entre jugadores con Supabase Realtime
- Presencia y heartbeats automáticos
- Storage para assets con TTL de 30 días

### Arquitectura Limpia (Stellar Game Studio)

```
contracts/     # Smart contracts (Soroban)
lib/          # Utilidades compartidas
components/   # UI components
app/          # Pages & API routes
```

## Estructura de Base de Datos

### game_sessions
- `id`: UUID primary key
- `session_code`: Código único de 8 caracteres (ej: "ABC123XY")
- `host_id`: ID del creador
- `game_state`: JSONB con el estado del juego
- `current_phase`: Fase actual (waiting, playing, finished)
- `max_players`: Máximo de jugadores (default: 4)
- `expires_at`: TTL de 30 días

### session_players
- `id`: UUID primary key
- `session_id`: FK a game_sessions
- `player_id`: ID único del jugador (generado en cliente)
- `player_name`: Nombre del jugador
- `wallet_address`: Dirección de Stellar (opcional)
- `player_state`: JSONB con estado del jugador
- `is_ready`: Boolean para ready check

### game_moves
- `id`: UUID primary key
- `session_id`: FK a game_sessions
- `player_id`: ID del jugador
- `move_type`: Tipo de movimiento
- `move_data`: JSONB con datos del movimiento
- `zk_proof`: JSONB con la proof (opcional)

### game_assets
- `id`: UUID primary key
- `asset_key`: Clave única del asset
- `storage_path`: Path en Supabase Storage
- `metadata`: JSONB con metadatos
- `expires_at`: TTL de 30 días

## Uso del Sistema Multiplayer

### Crear una Sesión

1. Ve a `/multiplayer`
2. Ingresa tu nombre
3. Haz clic en "Crear Nueva Sesión"
4. Se genera un código de 8 caracteres (ej: "ABC123XY")
5. Comparte el link con otros jugadores

### Unirse a una Sesión

1. Recibe el link de un amigo: `https://tu-app.vercel.app/multiplayer?session=ABC123XY`
2. O ingresa el código manualmente en `/multiplayer`
3. El sistema te conecta automáticamente vía Supabase Realtime

## Roadmap

### Implementaciones Pendientes

- [ ] Migrar componentes del juego (ChihiroZKPanel, GitNameGame)
- [ ] Implementar generación real de ZK proofs en `/api/prove`
- [ ] Agregar i18n con react-i18next
- [ ] Crear página de juego single-player
- [ ] Integrar Git simulator con isomorphic-git
- [ ] Deploy contracts a Stellar testnet
- [ ] Testing con Vitest

### Stellar Game Studio Best Practices Aplicadas

- ✅ Arquitectura de carpetas limpia
- ✅ Supabase Storage con TTL de 30 días
- ✅ Real-time multiplayer
- ✅ Serverless functions para lógica pesada
- ✅ TypeScript en toda la app
- ✅ Single command deploy

## Wallet

Install [Freighter](https://freighter.app) (Chrome/Firefox extension). Switch to **Testnet** in Freighter settings.

## Licencia

MIT

## Credits

Basado en las mejores prácticas de [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio) por James Bachini.

Inspirado en "El Viaje de Chihiro" (千と千尋の神隠し) de Studio Ghibli.
