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

export function useRealtimeSession(sessionId: string | null) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionUpdate, setSessionUpdate] = useState<GameSessionUpdate | null>(null)
  const [playerUpdates, setPlayerUpdates] = useState<PlayerUpdate[]>([])
  const [moveUpdates, setMoveUpdates] = useState<GameMoveUpdate[]>([])

  useEffect(() => {
    if (!sessionId) return

    const supabase = getSupabaseClient()
    const realtimeChannel = supabase.channel(`game-session-${sessionId}`)

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
          setMoveUpdates((prev) => [...prev, payload.new as GameMoveUpdate])
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    setChannel(realtimeChannel)

    return () => {
      realtimeChannel.unsubscribe()
    }
  }, [sessionId])

  const disconnect = useCallback(() => {
    if (channel) {
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

export function usePresence(sessionId: string | null, playerId: string | null) {
  useEffect(() => {
    if (!sessionId || !playerId) return

    const supabase = getSupabaseClient()

    const interval = setInterval(async () => {
      const { error } = await supabase
        .from('session_players')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('player_id', playerId)

      if (error) {
        console.error('Presence update error:', error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [sessionId, playerId])
}
