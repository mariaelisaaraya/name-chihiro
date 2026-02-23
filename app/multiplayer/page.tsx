'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createGameSession, joinGameSession, getSession } from '@/lib/multiplayer/session'
import { useRealtimeSession, usePresence } from '@/lib/multiplayer/use-realtime'
import { nanoid } from 'nanoid'

export default function MultiplayerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionCodeFromUrl = searchParams.get('session')

  const [playerId] = useState(() => nanoid())
  const [playerName, setPlayerName] = useState('')
  const [sessionCode, setSessionCode] = useState(sessionCodeFromUrl || '')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  
  // Real-time subscription
  const { isConnected, sessionUpdate, playerUpdates } = useRealtimeSession(currentSessionId)
  usePresence(currentSessionId, playerId)

  // Auto-join if session code in URL
  useEffect(() => {
    if (sessionCodeFromUrl && !currentSessionId) {
      handleJoinSession()
    }
  }, [sessionCodeFromUrl])

  const handleCreateSession = async () => {
    if (!playerName.trim()) {
      setError('Ingresa tu nombre')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const result = await createGameSession(playerId, 4)
      
      if (!result) {
        setError('Error al crear sesión')
        return
      }

      setSessionCode(result.sessionCode)
      setCurrentSessionId(result.sessionId)

      // Add creator as first player
      await joinGameSession(result.sessionCode, playerId, playerName)

      // Update URL
      router.push(`/multiplayer?session=${result.sessionCode}`)

    } catch (err) {
      console.error('Create session error:', err)
      setError('Error al crear sesión')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      setError('Ingresa el código de sesión')
      return
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      const result = await joinGameSession(sessionCode, playerId, playerName)
      
      if (!result) {
        setError('Sesión no encontrada o llena')
        return
      }

      setCurrentSessionId(result.sessionId)
      router.push(`/multiplayer?session=${sessionCode}`)

    } catch (err) {
      console.error('Join session error:', err)
      setError('Error al unirse a la sesión')
    } finally {
      setIsJoining(false)
    }
  }

  const copySessionLink = () => {
    const link = `${window.location.origin}/multiplayer?session=${sessionCode}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  if (currentSessionId) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">
                  Sesión: {sessionCode}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isConnected ? (
                    <span className="text-accent">🟢 Conectado en tiempo real</span>
                  ) : (
                    <span className="text-muted-foreground">⚪ Conectando...</span>
                  )}
                </p>
              </div>
              <button
                onClick={copySessionLink}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity"
              >
                Copiar Link
              </button>
            </div>
          </div>

          {/* Players */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              Jugadores ({playerUpdates.length}/4)
            </h2>
            <div className="space-y-2">
              {playerUpdates.length === 0 ? (
                <p className="text-muted-foreground text-sm">Esperando jugadores...</p>
              ) : (
                playerUpdates.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-muted p-3 rounded"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {player.player_name || 'Anónimo'}
                      </p>
                      {player.wallet_address && (
                        <p className="text-xs text-muted-foreground">
                          {player.wallet_address.slice(0, 10)}...
                        </p>
                      )}
                    </div>
                    <div className="text-sm">
                      {player.is_ready ? (
                        <span className="text-accent">✓ Listo</span>
                      ) : (
                        <span className="text-muted-foreground">Esperando...</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Game State */}
          {sessionUpdate && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                Estado del Juego
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Fase:</span>{' '}
                  <span className="text-accent font-mono">{sessionUpdate.current_phase}</span>
                </p>
                <p className="text-muted-foreground">
                  Última actualización: {new Date(sessionUpdate.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/game')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Iniciar Juego →
            </button>
            <button
              onClick={() => {
                setCurrentSessionId(null)
                router.push('/multiplayer')
              }}
              className="bg-muted text-muted-foreground px-6 py-3 rounded-lg hover:opacity-80 transition-opacity"
            >
              Salir
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Multijugador</h1>
          <p className="text-slate-400">
            Crea una sesión o únete usando un código
          </p>
        </div>

        {/* Name Input */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tu Nombre
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleCreateSession}
            disabled={isCreating || !playerName.trim()}
            className="w-full bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creando...' : 'Crear Nueva Sesión'}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-900 px-2 text-slate-500">o</span>
          </div>
        </div>

        {/* Join Session */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Código de Sesión
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123XY"
              className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
              maxLength={8}
            />
          </div>

          <button
            onClick={handleJoinSession}
            disabled={isJoining || !sessionCode.trim() || !playerName.trim()}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Uniéndose...' : 'Unirse a Sesión'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </main>
  )
}
