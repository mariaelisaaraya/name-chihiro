import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern for Supabase client (Stellar Game Studio best practice)
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[v0] Supabase not configured - multiplayer features disabled')
    return null
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  
  return supabaseClient
}

// Type-safe database types (will be auto-generated later)
export type Database = {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string
          session_code: string
          host_id: string | null
          game_state: Record<string, any>
          current_phase: string
          max_players: number
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: Omit<Database['public']['Tables']['game_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['game_sessions']['Insert']>
      }
      session_players: {
        Row: {
          id: string
          session_id: string
          player_id: string | null
          player_name: string | null
          wallet_address: string | null
          player_state: Record<string, any>
          is_ready: boolean
          joined_at: string
          last_active: string
        }
        Insert: Omit<Database['public']['Tables']['session_players']['Row'], 'id' | 'joined_at' | 'last_active'>
        Update: Partial<Database['public']['Tables']['session_players']['Insert']>
      }
      game_moves: {
        Row: {
          id: string
          session_id: string
          player_id: string | null
          move_type: string
          move_data: Record<string, any>
          zk_proof: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['game_moves']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['game_moves']['Insert']>
      }
      game_assets: {
        Row: {
          id: string
          asset_key: string
          storage_path: string
          asset_type: string | null
          metadata: Record<string, any>
          uploaded_at: string
          expires_at: string
        }
        Insert: Omit<Database['public']['Tables']['game_assets']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['game_assets']['Insert']>
      }
    }
  }
}
