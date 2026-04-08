import { useRef } from 'react'

function AlbumCarousel({ songs, onSelectSong }) {
  const trackRef = useRef(null)

  function scrollAlbums(direction) {
    if (!trackRef.current) {
      return
    }

    trackRef.current.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  return (
    <section className="rounded-[28px] border border-white/8 bg-[#0c0c0c]/82 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
            Jazz Albums
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            可滑動爵士專輯封面
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            這裡會根據 Top Songs 自動顯示專輯封面，右邊按鈕、觸控板或滑鼠滾輪都可以滑動。
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            提示：點右側綠色按鈕即可快速往右滑
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scrollAlbums('left')}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-[#1DB954]/40 hover:text-white"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => scrollAlbums('right')}
            className="rounded-2xl bg-[#1DB954] px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#1ed760]"
          >
            Right
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-16 [scrollbar-color:#1DB954_transparent] [scrollbar-width:thin] active:cursor-grabbing"
        >
          {songs.map((song) => (
            <button
              key={song.id}
              type="button"
              onClick={() => onSelectSong?.(song)}
              className="group min-w-[180px] max-w-[180px] cursor-pointer snap-start rounded-[24px] border border-white/8 bg-white/5 p-3 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#1DB954]/35 hover:bg-white/8 sm:min-w-[190px] sm:max-w-[190px]"
            >
              <div className="overflow-hidden rounded-[18px]">
                <img
                  src={song.coverArt}
                  alt={`${song.title} album cover`}
                  className="h-[170px] w-full object-cover transition duration-500 group-hover:scale-105 sm:h-[180px]"
                  loading="lazy"
                />
              </div>
              <div className="mt-3">
                <h3 className="line-clamp-2 text-base font-semibold text-white">{song.albumName}</h3>
                <p className="mt-2 line-clamp-1 text-sm text-zinc-400">{song.artist}</p>
                <p className="mt-1 line-clamp-1 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  {song.title}
                </p>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollAlbums('right')}
          className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#1DB954]/35 bg-[#1DB954] text-2xl font-bold text-black shadow-[0_16px_35px_rgba(29,185,84,0.45)] transition hover:scale-105 hover:bg-[#1ed760] sm:right-4 sm:h-14 sm:w-14"
          aria-label="Scroll albums right"
        >
          ›
        </button>
      </div>
    </section>
  )
}

export default AlbumCarousel
