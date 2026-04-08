function DetailPanel({ selectedSong, selectedArtist, onSelectRecommendation }) {
  return (
    <section className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
          Quick Details
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          即時重點資訊
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          這裡會同步顯示目前選到的歌曲、藝人以及推薦結果，方便你直接整理成分析報告。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Top Song</p>
          {selectedSong ? (
            <div className="mt-4 space-y-3">
              <img
                src={selectedSong.coverArt}
                alt={`${selectedSong.title} cover art`}
                className="h-32 w-32 rounded-2xl object-cover"
              />
              <p className="text-xl font-semibold text-white">{selectedSong.title}</p>
              <p className="text-sm text-zinc-300">歌手：{selectedSong.artist}</p>
              <p className="text-sm text-zinc-300">專輯：{selectedSong.albumName}</p>
              <p className="text-sm text-zinc-300">流行度：{selectedSong.popularity}</p>
              <p className="text-sm text-zinc-300">播放數：{selectedSong.playCount}</p>
              <p className="text-sm text-zinc-300">平均評分：{selectedSong.avgRating.toFixed(2)}</p>
              <p className="text-sm text-zinc-300">Heat Score：{selectedSong.heatScore.toFixed(1)}</p>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">歌曲介紹</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{selectedSong.summary}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">You may also like</p>
                <div className="mt-3 space-y-2">
                  {selectedSong.recommendations?.length ? (
                    selectedSong.recommendations.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectRecommendation?.(item)}
                        className="block w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left transition hover:border-[#1DB954]/35 hover:bg-white/10"
                      >
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-zinc-400">{item.artist}</p>
                        <p className="mt-1 text-xs text-zinc-500">{item.reason}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-400">目前沒有可顯示的相似歌曲推薦。</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              目前沒有選取歌曲，點一下 Top Songs 裡的卡片就會顯示詳細內容。
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Artist Ranking</p>
          {selectedArtist ? (
            <div className="mt-4 space-y-3">
              <p className="text-xl font-semibold text-white">{selectedArtist.artist}</p>
              <p className="text-sm text-zinc-300">Heat Score：{selectedArtist.heatScore.toFixed(1)}</p>
              <p className="text-sm text-zinc-300">播放數：{selectedArtist.playCount}</p>
              <p className="text-sm text-zinc-300">平均評分：{selectedArtist.avgRating.toFixed(2)}</p>
              <p className="text-sm text-zinc-300">平均熱門度：{selectedArtist.avgPopularity.toFixed(1)}</p>
              <p className="text-sm text-zinc-300">歌曲數量：{selectedArtist.songCount}</p>
              <p className="text-sm text-zinc-300">排名：#{selectedArtist.rank}</p>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-sm leading-6 text-zinc-400">
                  這位藝人的 Heat Score 來自播放數、歌曲熱門度與平均評分的綜合指標，因此可以同時反映人氣與整體表現。
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              目前沒有選取藝人，點一下 Artist Ranking 圖表或下方按鈕就會顯示詳細內容。
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default DetailPanel
