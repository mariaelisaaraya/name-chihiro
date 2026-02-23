'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseClient } from '../supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface GameSessionUpdate {
  id: string
  session_code: string
  game_state: Record<string, any>
  current_phase: string
  updated_at: string
}

interface PlayerUpdate {
  id: string
  session_id: string
  player_id: string | null
  player_name: string | null
  wallet_address: string | null
  player_state: Record<string, any>
  is_ready: boolean
  last_active: string
}

interface GameMoveUpdate {
  id: string
  session_id: string
  player_id: string | null
  move_type: string
  move_data: Record<string, any>
  zk_proof: Record<string, any> | null
  created_at: string
}

/**
 * Real-time subscription hook for multiplayer game sessions
 * Follows Stellar Game Studio pattern for WebSocket-based game state sync
 */
export function useRealtimeSession(sessionId: string | null) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionUpdate, setSessionUpdate] = useState<GameSessionUpdate | null>(null)
  const [playerUpdates, setPlayerUpdates] = useState<PlayerUpdate[]>([])
  const [moveUpdates, setMoveUpdates] = useState<GameMoveUpdate[]>([])

  useEffect(() => {
    if (!sessionId) return

    console.log('[v0] Setting up real-time subscription for session:', sessionId)
    const supabase = getSupabaseClient()

    // Create channel for this session
    const realtimeChannel = supabase.channel(`game-session-${sessionId}`)

    // Subscribe to game_sessions changes
    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[v0] Session updated:', payload)
          setSessionUpdate(payload.new as GameSessionUpdate)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[v0] Player update:', payload)
          if (payload.eventType === 'INSERT') {
            setPlayerUpdates((prev) => [...prev, payload.new as PlayerUpdate])
          } else if (payload.eventType === 'UPDATE') {
            setPlayerUpdates((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as PlayerUpdate) : p
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPlayerUpdates((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_moves',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[v0] New move:', payload)
          setMoveUpdates((prev) => [...prev, payload.new as GameMoveUpdate])
        }
      )
      .subscribe((status) => {
        console.log('[v0] Subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    setChannel(realtimeChannel)

    // Cleanup on unmount
    return () => {
      console.log('[v0] Cleaning up real-time subscription')
      realtimeChannel.unsubscribe()
    }
  }, [sessionId])

  const disconnect = useCallback(() => {
    if (channel) {
      console.log('[v0] Disconnecting channel')
      channel.unsubscribe()
      setChannel(null)
      setIsConnected(false)
    }
  }, [channel])

  return {
    isConnected,
    sessionUpdate,
    playerUpdates,
    moveUpdates,
    disconnect,
  }
}

/**
 * Hook for broadcasting presence (heartbeat)
 */
export function usePresence(sessionId: string | null, playerId: string | null) {
  useEffect(() => {
    if (!sessionId || !playerId) return

    const supabase = getSupabaseClient()

    // Update last_active every 30 seconds
    const interval = setInterval(async () => {
      const { error } = await supabase
        .from('session_players')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('player_id', playerId)

      if (error) {
        console.error('[v0] Presence update error:', error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [sessionId, playerId])
}
