'use client'

import { useState } from 'react'
import Link from 'next/link'

type GamePhase = 'intro' | 'git-ritual' | 'proof-generation' | 'recovery' | 'complete'

export default function GamePage() {
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [playerName, setPlayerName] = useState('')
  const [secretName, setSecretName] = useState('')
  const [gitCommands, setGitCommands] = useState<string[]>([])

  const handleStartGame = () => {
    if (playerName.trim()) {
      setPhase('git-ritual')
    }
  }

  const executeGitCommand = (command: string) => {
    setGitCommands([...gitCommands, command])
    
    // Simular progreso del juego
    if (command === 'git init' && gitCommands.length === 0) {
      return 'Initialized empty Git repository'
    } else if (command.startsWith('git branch') && gitCommands.length === 1) {
      return 'Branch created successfully'
    } else if (command.startsWith('git commit') && gitCommands.length === 2) {
      setPhase('proof-generation')
      return 'Commit successful! Ready to generate ZK proof'
    }
    return 'Command executed'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold hover:text-indigo-300 transition-colors">
            ← Chihiro's Lost Name
          </Link>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-400">Jugador: <span className="text-white">{playerName || 'Anónimo'}</span></span>
            <Link
              href="/multiplayer"
              className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              Multijugador
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="space-y-8 max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-6">🏮</div>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Bienvenida al Mundo de los Espíritus
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed text-pretty">
              Yubaba ha robado tu nombre. Para recuperarlo, debes completar el ritual sagrado del Git y demostrar que conoces tu verdadero nombre sin revelarlo.
            </p>
            
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 space-y-6">
              <label className="block text-left">
                <span className="text-sm text-slate-400 mb-2 block">¿Cuál es tu nombre?</span>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingresa tu nombre..."
                  onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
                />
              </label>

              <button
                onClick={handleStartGame}
                disabled={!playerName.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comenzar Aventura
              </button>
            </div>

            <div className="pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500 mb-4">¿Qué aprenderás?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <span className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-sm">Git básico</span>
                <span className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-sm">Zero-Knowledge Proofs</span>
                <span className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-sm">Blockchain</span>
              </div>
            </div>
          </div>
        )}

        {/* Git Ritual Phase */}
        {phase === 'git-ritual' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">📜</div>
              <h2 className="text-3xl md:text-4xl font-bold">El Ritual del Git</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Completa estos tres comandos sagrados para preparar tu prueba
              </p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-8 space-y-6">
              {/* Terminal */}
              <div className="bg-black rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="text-green-400">$ chihiro@bathhouse:~</div>
                {gitCommands.map((cmd, i) => (
                  <div key={i} className="text-slate-300">
                    <span className="text-blue-400">$</span> {cmd}
                  </div>
                ))}
                <div className="text-green-400 animate-pulse">█</div>
              </div>

              {/* Command Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => executeGitCommand('git init')}
                  disabled={gitCommands.length > 0}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white py-3 rounded-lg font-mono text-left px-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-indigo-400">1.</span> git init
                </button>

                <button
                  onClick={() => executeGitCommand('git branch chihiro-recovery')}
                  disabled={gitCommands.length !== 1}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white py-3 rounded-lg font-mono text-left px-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-indigo-400">2.</span> git branch chihiro-recovery
                </button>

                <button
                  onClick={() => executeGitCommand('git commit -m "Recover my name"')}
                  disabled={gitCommands.length !== 2}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white py-3 rounded-lg font-mono text-left px-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-indigo-400">3.</span> git commit -m "Recover my name"
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 text-center">
                  Progreso: {gitCommands.length} / 3 comandos completados
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Proof Generation Phase */}
        {phase === 'proof-generation' && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">🔮</div>
              <h2 className="text-3xl md:text-4xl font-bold">Genera tu Proof</h2>
              <p className="text-xl text-slate-300">
                Ahora debes demostrar que conoces tu verdadero nombre sin revelarlo
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 space-y-6">
              <label className="block">
                <span className="text-sm text-slate-400 mb-2 block">Tu nombre secreto (no se mostrará a nadie)</span>
                <input
                  type="password"
                  value={secretName}
                  onChange={(e) => setSecretName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ingresa tu nombre secreto..."
                />
              </label>

              <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-4">
                <p className="text-sm text-indigo-200">
                  💡 <strong>Zero-Knowledge:</strong> Tu nombre nunca sale de este navegador. Solo se genera una prueba matemática.
                </p>
              </div>

              <button
                onClick={() => setPhase('recovery')}
                disabled={!secretName.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generar Prueba ZK
              </button>
            </div>
          </div>
        )}

        {/* Recovery Phase */}
        {phase === 'recovery' && (
          <div className="space-y-8 max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              ¡Generando tu Proof!
            </h2>
            <p className="text-xl text-slate-300">
              La prueba está siendo creada usando Noir UltraHonk...
            </p>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{width: '75%'}} />
                </div>
                <p className="text-sm text-slate-400">Esto puede tomar unos segundos...</p>
              </div>
            </div>

            <button
              onClick={() => setPhase('complete')}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              Continuar (Demo)
            </button>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <div className="space-y-8 max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              ¡Has Recuperado tu Nombre!
            </h2>
            <p className="text-xl text-slate-300">
              Felicitaciones, {playerName}. Has completado el ritual y demostrado tu conocimiento sin revelar tu secreto.
            </p>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 space-y-4">
              <h3 className="text-xl font-semibold">Lo que aprendiste:</h3>
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Comandos básicos de Git (init, branch, commit)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Cómo funcionan las Zero-Knowledge Proofs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Integración blockchain con Stellar</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setPhase('intro')
                  setPlayerName('')
                  setSecretName('')
                  setGitCommands([])
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-8 py-4 rounded-lg font-semibold transition-all"
              >
                Jugar de Nuevo
              </button>
              <Link
                href="/multiplayer"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all"
              >
                Probar Multiplayer
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
