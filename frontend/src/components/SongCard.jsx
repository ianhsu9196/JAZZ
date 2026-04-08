function SongCard({ song, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(song)}
      className={[
        'group relative w-full cursor-pointer overflow-hidden rounded-3xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#1DB954]/40 hover:shadow-[0_28px_65px_rgba(29,185,84,0.18)]',
        isActive ? 'border-[#1DB954]/50 bg-[linear-gradient(180deg,rgba(29,185,84,0.16),rgba(255,255,255,0.04))]' : 'border-white/8',
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,185,84,0.18),transparent_42%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative flex h-full gap-4">
        <img
          src={song.coverArt}
          alt={`${song.title} cover art`}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
          loading="lazy"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1DB954]">
                #{song.rank}
              </p>
              <h3 className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-lg font-semibold tracking-tight text-white">
                {song.title}
              </h3>
              <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-zinc-400">
                {song.artist}
              </p>
              <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs uppercase tracking-[0.24em] text-zinc-500">
                {song.albumName}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-zinc-300">
              {song.genre}
            </span>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-zinc-500">
              <span>Popularity</span>
              <span className="text-zinc-200">{song.popularity}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/8">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#169c46] via-[#1DB954] to-[#6df39f] shadow-[0_0_20px_rgba(29,185,84,0.45)] transition-all duration-500"
                style={{ width: `${Math.min(song.popularity, 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">AI Summary</p>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-zinc-300">{song.summary}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

export default SongCard
