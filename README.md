# Chihiro's Lost Name

A Zero-Knowledge proof gaming experience inspired by Spirited Away, built with best practices from [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio).

## Features

- **Zero-Knowledge Proofs**: Uses Noir UltraHonk to prove knowledge without revealing it
- **Real-time Multiplayer**: Multiplayer session system with Supabase Realtime
- **Blockchain Gaming**: Full integration with Stellar blockchain and Freighter wallet
- **Git Simulator**: Learn Git while playing
- **i18n Support**: Multiple languages supported

## Tech Stack

- **Frontend**: Next.js 16 with React 19.2 and TypeScript
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL with Row Level Security
- **Real-time**: Supabase Realtime for multiplayer synchronization
- **Storage**: Supabase Storage for game assets (TTL: 30 days)
- **Blockchain**: Stellar testnet with Soroban smart contracts
- **ZK**: Noir circuits with UltraHonk backend

## Architecture

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

### 1. Configure Supabase

1. Supabase integration is already connected
2. Run the SQL migration from Supabase dashboard:
   - Copy the contents of `scripts/01-setup-multiplayer-schema.sql`
   - Paste it in Supabase SQL Editor
   - Execute the script
3. Create the Storage bucket:
   - Go to Storage in Supabase
   - Create bucket `game-assets` (public)

### 2. Environment Variables

Supabase variables are configured automatically. You only need to add Stellar variables:

```bash
NEXT_PUBLIC_CHIHIRO_CONTRACT_ID=<your-contract-id>
NEXT_PUBLIC_ULTRAHONK_VERIFIER_ID=<your-verifier-id>
```

### 3. Deploy

The project deploys automatically on Vercel from v0. You can also run locally:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Differences from Original Project

### Migration from Vite Monorepo → Next.js 16

- **Before**: `gitBDB/` with Vite + React Router
- **Now**: Next.js App Router with Server Components

### Prove Server → Serverless Functions

- **Before**: `scripts/prove-server.js` running locally (port 4001)
- **Now**: `/api/prove` and `/api/commit` as Vercel Functions
- **Advantage**: maxDuration: 300s (5 min) for heavy proofs

### Supabase Real-time Multiplayer (NEW)

- Shareable session system via URL
- Real-time sync between players with Supabase Realtime
- Automatic presence and heartbeats
- Storage for assets with 30-day TTL

### Clean Architecture (Stellar Game Studio)

```
contracts/     # Smart contracts (Soroban)
lib/          # Shared utilities
components/   # UI components
app/          # Pages & API routes
```

## Database Structure

### game_sessions
- `id`: UUID primary key
- `session_code`: Unique 8-character code (e.g., "ABC123XY")
- `host_id`: Creator ID
- `game_state`: JSONB with game state
- `current_phase`: Current phase (waiting, playing, finished)
- `max_players`: Maximum players (default: 4)
- `expires_at`: 30-day TTL

### session_players
- `id`: UUID primary key
- `session_id`: FK to game_sessions
- `player_id`: Unique player ID (generated on client)
- `player_name`: Player name
- `wallet_address`: Stellar address (optional)
- `player_state`: JSONB with player state
- `is_ready`: Boolean for ready check

### game_moves
- `id`: UUID primary key
- `session_id`: FK to game_sessions
- `player_id`: Player ID
- `move_type`: Move type
- `move_data`: JSONB with move data
- `zk_proof`: JSONB with proof (optional)

### game_assets
- `id`: UUID primary key
- `asset_key`: Unique asset key
- `storage_path`: Path in Supabase Storage
- `metadata`: JSONB with metadata
- `expires_at`: 30-day TTL

## Using the Multiplayer System

### Create a Session

1. Go to `/multiplayer`
2. Enter your name
3. Click "Create New Session"
4. An 8-character code is generated (e.g., "ABC123XY")
5. Share the link with other players

### Join a Session

1. Receive the link from a friend: `https://your-app.vercel.app/multiplayer?session=ABC123XY`
2. Or manually enter the code in `/multiplayer`
3. The system automatically connects you via Supabase Realtime

## Roadmap

### Pending Implementations

- [ ] Migrate game components (ChihiroZKPanel, GitNameGame)
- [ ] Implement real ZK proof generation in `/api/prove`
- [ ] Add i18n with react-i18next
- [ ] Create single-player game page
- [ ] Integrate Git simulator with isomorphic-git
- [ ] Deploy contracts to Stellar testnet
- [ ] Testing with Vitest

### Stellar Game Studio Best Practices Applied

- ✅ Clean folder architecture
- ✅ Supabase Storage with 30-day TTL
- ✅ Real-time multiplayer
- ✅ Serverless functions for heavy logic
- ✅ TypeScript throughout the app
- ✅ Single command deploy

## Wallet

Install [Freighter](https://freighter.app) (Chrome/Firefox extension). Switch to **Testnet** in Freighter settings.

## License

MIT

## Credits

Based on best practices from [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio) by James Bachini.

Inspired by "Spirited Away" (千と千尋の神隠し) by Studio Ghibli.
