function SelectionModal({ selectedSong, selectedArtist, modalType, onClose }) {
  if (!modalType) {
    return null
  }

  const isSong = modalType === 'song'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
              {isSong ? 'Song Detail' : 'Artist Detail'}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isSong ? selectedSong?.title : selectedArtist?.artist}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-[#1DB954]/35 hover:text-white"
          >
            Close
          </button>
        </div>

        {isSong && selectedSong ? (
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <img
              src={selectedSong.coverArt}
              alt={`${selectedSong.title} cover art`}
              className="h-[220px] w-full rounded-[24px] object-cover"
            />
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">歌手：{selectedSong.artist}</p>
              <p className="text-sm text-zinc-300">專輯：{selectedSong.albumName}</p>
              <p className="text-sm text-zinc-300">流行度：{selectedSong.popularity}</p>
              <p className="text-sm text-zinc-300">合作人數：{selectedSong.numArtists}</p>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">AI Summary</p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{selectedSong.summary}</p>
              </div>
              {selectedSong.trackUrl ? (
                <a
                  href={selectedSong.trackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-2xl bg-[#1DB954] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#1ed760]"
                >
                  Open Track
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isSong && selectedArtist ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <p className="text-sm text-zinc-300">藝人：{selectedArtist.artist}</p>
              <p className="mt-2 text-sm text-zinc-300">分數：{selectedArtist.score}</p>
              <p className="mt-2 text-sm text-zinc-300">排名：#{selectedArtist.rank}</p>
            </div>
            <p className="text-sm leading-7 text-zinc-400">
              這位藝人的排名來自目前的 Artist Ranking，可用來說明他在資料集中的整體影響力與表現。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SelectionModal
