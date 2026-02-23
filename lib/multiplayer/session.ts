import { getSupabaseClient, type Database } from '../supabase/client'
import { nanoid } from 'nanoid'

type GameSession = Database['public']['Tables']['game_sessions']['Row']
type SessionPlayer = Database['public']['Tables']['session_players']['Row']
type GameMove = Database['public']['Tables']['game_moves']['Row']

export function generateSessionCode(): string {
  return nanoid(8).toUpperCase()
}

export async function createGameSession(
  hostId: string,
  maxPlayers: number = 4
): Promise<{ sessionCode: string; sessionId: string } | null> {
  const supabase = getSupabaseClient()
  const sessionCode = generateSessionCode()

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      session_code: sessionCode,
      host_id: hostId,
      game_state: {},
      current_phase: 'waiting',
      max_players: maxPlayers,
    })
    .select('id, session_code')
    .single()

  if (error) {
    console.error('Create session error:', error)
    return null
  }

  return {
    sessionCode: data.session_code,
    sessionId: data.id,
  }
}

export async function joinGameSession(
  sessionCode: string,
  playerId: string,
  playerName?: string,
  walletAddress?: string
): Promise<{ sessionId: string } | null> {
  const supabase = getSupabaseClient()

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id, max_players')
    .eq('session_code', sessionCode)
    .single()

  if (sessionError || !session) {
    console.error('Session not found:', sessionError)
    return null
  }

  const { count } = await supabase
    .from('session_players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id)

  if (count && count >= session.max_players) {
    console.error('Session is full')
    return null
  }

  const { error: joinError } = await supabase
    .from('session_players')
    .insert({
      session_id: session.id,
      player_id: playerId,
      player_name: playerName || null,
      wallet_address: walletAddress || null,
      player_state: {},
      is_ready: false,
    })

  if (joinError) {
    console.error('Join session error:', joinError)
    return null
  }

  return { sessionId: session.id }
}

export async function getSession(sessionCode: string) {
  const supabase = getSupabaseClient()

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .single()

  if (sessionError || !session) return null

  const { data: players, error: playersError } = await supabase
    .from('session_players')
    .select('*')
    .eq('session_id', session.id)
    .order('joined_at', { ascending: true })

  if (playersError) return null

  return {
    session,
    players,
  }
}

export async function updatePlayerReady(
  sessionId: string,
  playerId: string,
  isReady: boolean
) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('session_players')
    .update({ is_ready: isReady })
    .eq('session_id', sessionId)
    .eq('player_id', playerId)

  if (error) {
    console.error('Update ready error:', error)
    return false
  }

  return true
}

export async function updateGameState(
  sessionId: string,
  gameState: Record<string, any>,
  currentPhase?: string
) {
  const supabase = getSupabaseClient()

  const update: any = { game_state: gameState }
  if (currentPhase) update.current_phase = currentPhase

  const { error } = await supabase
    .from('game_sessions')
    .update(update)
    .eq('id', sessionId)

  if (error) {
    console.error('Update game state error:', error)
    return false
  }

  return true
}

export async function recordGameMove(
  sessionId: string,
  playerId: string,
  moveType: string,
  moveData: Record<string, any>,
  zkProof?: Record<string, any>
) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from('game_moves').insert({
    session_id: sessionId,
    player_id: playerId,
    move_type: moveType,
    move_data: moveData,
    zk_proof: zkProof || null,
  })

  if (error) {
    console.error('Record move error:', error)
    return false
  }

  return true
}

export async function getSessionMoves(sessionId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('game_moves')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Get moves error:', error)
    return []
  }

  return data
}
