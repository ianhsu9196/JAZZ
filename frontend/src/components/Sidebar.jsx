function Sidebar({ topArtist, topSong, totalArtists, onRefresh, loading }) {
  const navItems = [
    { label: 'Overview', targetId: 'overview-section', active: true },
    { label: 'Top Songs', targetId: 'top-songs-section', active: false },
    { label: 'Artist Ranking', targetId: 'artist-ranking-section', active: false },
  ]

  function scrollToSection(targetId) {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <aside className="rounded-[26px] border border-white/8 bg-[#0a0a0a]/86 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
      <div className="flex h-full flex-col gap-4">
        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(29,185,84,0.16),rgba(255,255,255,0.04))] p-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#9af4bc]">Listening Room</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">Jazz Pulse</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Your playlist analytics panel with a clean Spotify-like control center.
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => scrollToSection(item.targetId)}
              className={[
                'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition',
                item.active
                  ? 'border border-[#1DB954]/20 bg-[#1DB954]/12 text-white shadow-[0_12px_30px_rgba(29,185,84,0.12)]'
                  : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8 hover:text-white',
              ].join(' ')}
            >
              <span>{item.label}</span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">View</span>
            </button>
          ))}
        </nav>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Top Artist</p>
            <p className="mt-3 text-base font-semibold text-white">{loading ? 'Loading...' : topArtist || 'N/A'}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Top Song</p>
            <p className="mt-3 text-base font-semibold text-white">{loading ? 'Loading...' : topSong || 'N/A'}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Artists</p>
            <p className="mt-3 text-base font-semibold text-white">{loading ? '...' : totalArtists}</p>
          </div>
        </div>

        <div className="mt-auto rounded-[24px] border border-white/8 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Actions</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-4 w-full rounded-2xl bg-[#1DB954] px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-[#1ed760]"
          >
            Refresh Dashboard
          </button>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Re-fetch the latest songs and artist rankings from your local Flask API.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar