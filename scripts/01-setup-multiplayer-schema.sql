-- Chihiro's Lost Name - Multiplayer Schema
-- Storage for game sessions with real-time capabilities

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game sessions table for multiplayer
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID,
  game_state JSONB NOT NULL DEFAULT '{}',
  current_phase VARCHAR(50) DEFAULT 'waiting',
  max_players INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Players in sessions
CREATE TABLE IF NOT EXISTS session_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID,
  player_name VARCHAR(100),
  wallet_address VARCHAR(100),
  player_state JSONB DEFAULT '{}',
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- Game moves/actions for ZK proofs
CREATE TABLE IF NOT EXISTS game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID,
  move_type VARCHAR(50) NOT NULL,
  move_data JSONB NOT NULL,
  zk_proof JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset metadata (references to Supabase Storage)
CREATE TABLE IF NOT EXISTS game_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_key VARCHAR(255) UNIQUE NOT NULL,
  storage_path TEXT NOT NULL,
  asset_type VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON game_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_players_session ON session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_moves_session ON game_moves(session_id);
CREATE INDEX IF NOT EXISTS idx_assets_key ON game_assets(asset_key);

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for now (can be restricted later with auth)
CREATE POLICY "Allow all on game_sessions" ON game_sessions FOR ALL USING (true);
CREATE POLICY "Allow all on session_players" ON session_players FOR ALL USING (true);
CREATE POLICY "Allow all on game_moves" ON game_moves FOR ALL USING (true);
CREATE POLICY "Allow all on game_assets" ON game_assets FOR ALL USING (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM game_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for game assets (this needs to be done via Supabase Storage API)
-- We'll handle this in the app initialization
