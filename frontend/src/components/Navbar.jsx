function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#050505]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1DB954] text-lg font-black text-black shadow-[0_12px_30px_rgba(29,185,84,0.35)]">
            J
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Spotify Style</p>
            <h2 className="text-lg font-semibold tracking-tight text-white">Jazz Dashboard</h2>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            Top Songs
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            Search + Sort
          </span>
          <span className="rounded-full border border-[#1DB954]/20 bg-[#1DB954]/10 px-3 py-1 text-xs text-[#7df0a7]">
            Artist Ranking
          </span>
        </div>
      </div>
    </header>
  )
}

export default Navbar