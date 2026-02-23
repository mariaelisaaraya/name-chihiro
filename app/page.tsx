'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        
        <div className="relative max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-block mb-4">
            <span className="text-sm font-mono text-indigo-300 border border-indigo-400/30 px-4 py-2 rounded-full">
              ZK Gaming on Stellar
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-balance leading-none">
            Chihiro's
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Lost Name
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto text-pretty leading-relaxed">
            Recupera tu nombre robado usando Zero-Knowledge proofs. Aprende Git mientras exploras un mundo mágico inspirado en Spirited Away.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link
              href="/game"
              className="group relative bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-100 transition-all"
            >
              Empezar Aventura
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/multiplayer"
              className="bg-slate-800/50 backdrop-blur border border-slate-700 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-800 transition-all"
            >
              Modo Multijugador
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-slate-800/30 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 transition-all">
              <div className="text-5xl mb-4">🔮</div>
              <h3 className="text-2xl font-bold mb-3">Zero-Knowledge Proofs</h3>
              <p className="text-slate-400 leading-relaxed">
                Demuestra que conoces tu nombre sin revelarlo usando Noir UltraHonk. Tu secreto nunca sale del navegador.
              </p>
            </div>

            <div className="group relative bg-slate-800/30 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 transition-all">
              <div className="text-5xl mb-4">🌊</div>
              <h3 className="text-2xl font-bold mb-3">Real-time Multiplayer</h3>
              <p className="text-slate-400 leading-relaxed">
                Juega con amigos en tiempo real. Crea una sesión y comparte el link. Hasta 4 jugadores simultáneos.
              </p>
            </div>

            <div className="group relative bg-slate-800/30 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 transition-all">
              <div className="text-5xl mb-4">🏯</div>
              <h3 className="text-2xl font-bold mb-3">Blockchain Gaming</h3>
              <p className="text-slate-400 leading-relaxed">
                Verifica proofs on-chain en Stellar testnet. Integración completa con Freighter wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-24 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-balance">
            Aprende Git jugando
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Ritual Git</h3>
                <p className="text-slate-400">Completa el ritual sagrado: <code className="text-indigo-300 bg-slate-800 px-2 py-1 rounded">git init → branch → commit</code></p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Genera tu Proof</h3>
                <p className="text-slate-400">Crea una prueba ZK de que conoces tu nombre sin revelarlo. Todo sucede en tu navegador.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Recupera tu Nombre</h3>
                <p className="text-slate-400">Envía tu proof on-chain y recupera tu identidad. Yubaba no podrá detenerte.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-slate-500 mb-6 uppercase tracking-wider">Built with</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-sm">Next.js 16</span>
            <span className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-sm">Supabase Realtime</span>
            <span className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-sm">Stellar Blockchain</span>
            <span className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-sm">Noir ZK</span>
            <span className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-sm">TypeScript</span>
          </div>
        </div>
      </section>
    </main>
  )
}
