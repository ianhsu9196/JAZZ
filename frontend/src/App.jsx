import { useMemo, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SongCard from './components/SongCard'
import ArtistChart from './components/ArtistChart'
import DetailPanel from './components/DetailPanel'
import SelectionModal from './components/SelectionModal'
import AnalysisDashboard from './components/AnalysisDashboard'
import InsightsPanel from './components/InsightsPanel'
import StatCard from './components/StatCard'
import { useJazzData } from './hooks/useJazzData'

const sortOptions = {
  rank: (a, b) => a.rank - b.rank,
  popularity: (a, b) => b.popularity - a.popularity,
  title: (a, b) => a.title.localeCompare(b.title),
}

const CHET_BAKER_COVER =
  'https://upload.wikimedia.org/wikipedia/en/6/60/Chet_Baker_Sings.jpg'

function App() {
  const { songs, artists, summary, analysis, loading, error, refreshData } = useJazzData()
  const [searchTerm, setSearchTerm] = useState('')
  const [songSort, setSongSort] = useState('rank')
  const [songDisplayCount, setSongDisplayCount] = useState(10)
  const [chartType, setChartType] = useState('bar')
  const [selectedSongId, setSelectedSongId] = useState(null)
  const [selectedArtistId, setSelectedArtistId] = useState(null)
  const [modalType, setModalType] = useState(null)

  const filteredSongs = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()

    return songs
      .filter((song) => {
        if (!normalizedQuery) {
          return true
        }

        return [song.title, song.artist, song.genre, song.summary]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .sort(sortOptions[songSort])
  }, [songs, searchTerm, songSort])

  const rankedArtists = useMemo(
    () => artists.map((artist, index) => ({ ...artist, rank: index + 1 })),
    [artists],
  )

  const visibleSongs = useMemo(
    () => filteredSongs.slice(0, songDisplayCount),
    [filteredSongs, songDisplayCount],
  )

  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? songs[0] ?? null
  const selectedArtist = rankedArtists.find((artist) => artist.id === selectedArtistId) ?? rankedArtists[0] ?? null

  const stats = useMemo(() => {
    const averagePopularity = visibleSongs.length
      ? Math.round(visibleSongs.reduce((sum, song) => sum + song.popularity, 0) / visibleSongs.length)
      : 0

    const averageHeat = visibleSongs.length
      ? (visibleSongs.reduce((sum, song) => sum + song.heatScore, 0) / visibleSongs.length).toFixed(1)
      : '0.0'

    const topArtist = artists[0]?.artist ?? 'Waiting for data'

    return [
      {
        label: 'Tracks in View',
        value: loading ? '...' : String(visibleSongs.length),
        hint: `目前畫面顯示前 ${songDisplayCount} 首歌曲`,
      },
      {
        label: 'Avg Popularity',
        value: loading ? '...' : String(averagePopularity),
        hint: `目前顯示歌曲的平均熱門度`,
      },
      {
        label: 'Top Artist',
        value: topArtist,
        hint: loading ? 'Loading artist momentum' : 'Heat Score 最高的藝人',
      },
      {
        label: 'Avg Tempo',
        value: loading ? '...' : `${summary.overview.averageTempo.toFixed(1)} BPM`,
        hint: '整體資料集的平均節奏',
      },
      {
        label: 'Avg Heat',
        value: loading ? '...' : averageHeat,
        hint: `目前顯示歌曲的平均 Heat Score`,
      },
      {
        label: 'Albums',
        value: loading ? '...' : summary.overview.totalAlbums.toLocaleString(),
        hint: '資料集中涉及的專輯數',
      },
    ]
  }, [artists, loading, songDisplayCount, summary.overview.averageTempo, summary.overview.totalAlbums, visibleSongs])

  function handleSelectSong(song) {
    setSelectedSongId(song.id)
    setModalType('song')
  }

  function handleSelectArtist(artist) {
    setSelectedArtistId(artist.id)
    setModalType('artist')
  }

  function handleSelectRecommendation(recommendation) {
    const matchedSong = songs.find((song) => song.id === recommendation.songId)
    if (matchedSong) {
      setSelectedSongId(matchedSong.id)
      setModalType('song')
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1b1b1b_0%,#101010_38%,#060606_100%)] text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-[#1DB954]/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_25%,transparent_70%,rgba(29,185,84,0.07))]" />
      </div>

      <Navbar />

      <main className="mx-auto grid w-full max-w-[1360px] gap-5 px-3 pb-8 pt-5 sm:px-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-6">
        <Sidebar
          topArtist={artists[0]?.artist}
          topSong={songs[0]?.title}
          totalArtists={artists.length}
          onRefresh={refreshData}
          loading={loading}
        />

        <section className="space-y-5">
          <div id="overview-section" className="rounded-[28px] border border-white/8 bg-white/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px_420px] xl:items-end">
              <div className="max-w-2xl animate-[fadeInUp_0.7s_ease-out]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
                  Curated Playlist Data
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl xl:text-[2.4rem]">
                  Relational Jazz intelligence, built for your playlist data.
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Dashboard 現在整合了正規化資料表、Heat Score 藝人分析、音樂特徵散點圖、年代分析與相似歌曲推薦。
                </p>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-[0_18px_45px_rgba(0,0,0,0.32)]">
                <img
                  src={CHET_BAKER_COVER}
                  alt="Chet Baker Sings album cover"
                  className="h-full min-h-[300px] w-full object-cover object-center"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-full">
                {stats.map((stat) => (
                  <StatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </div>
          </div>

          <DetailPanel
            selectedSong={selectedSong}
            selectedArtist={selectedArtist}
            onSelectRecommendation={handleSelectRecommendation}
          />

          <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div id="top-songs-section" className="rounded-[28px] border border-white/8 bg-[#0c0c0c]/82 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
                    Top Songs
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Essential Jazz Picks
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    點擊歌曲卡片即可查看歌曲介紹、音樂特徵與推薦系統產生的相似歌曲。
                  </p>
                  <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
                    {[10, 20].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSongDisplayCount(count)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          songDisplayCount === count
                            ? 'bg-[#1DB954] text-black shadow-[0_10px_24px_rgba(29,185,84,0.28)]'
                            : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        Top {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:w-[300px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search songs, artists, or summaries"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#1DB954]/50 focus:bg-white/8"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-[0.28em] text-zinc-500">Sort</label>
                    <select
                      value={songSort}
                      onChange={(event) => setSongSort(event.target.value)}
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#1DB954]/50"
                    >
                      <option value="rank">Original Rank</option>
                      <option value="popularity">Popularity</option>
                      <option value="title">Title A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {error ? (
                  <div className="sm:col-span-2 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200 shadow-[0_16px_40px_rgba(127,29,29,0.35)]">
                    <p className="font-semibold">Unable to load dashboard data.</p>
                    <p className="mt-2 text-red-100/80">{error}</p>
                  </div>
                ) : loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-40 animate-pulse rounded-3xl border border-white/8 bg-white/6" />
                  ))
                ) : visibleSongs.length ? (
                  visibleSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      compact={songDisplayCount === 20}
                      isActive={selectedSong?.id === song.id}
                      onSelect={handleSelectSong}
                    />
                  ))
                ) : (
                  <div className="sm:col-span-2 rounded-3xl border border-white/8 bg-white/5 p-6 text-sm text-zinc-400">
                    No songs matched your search. Try a different title, artist, or summary keyword.
                  </div>
                )}
              </div>
            </div>

            <div id="artist-ranking-section">
              <ArtistChart
                artists={rankedArtists}
                loading={loading}
                error={error}
                chartType={chartType}
                onChartTypeChange={setChartType}
                selectedArtistId={selectedArtist?.id}
                onSelectArtist={handleSelectArtist}
              />
            </div>
          </section>

          <InsightsPanel summary={summary} loading={loading} error={error} />
          <AnalysisDashboard analysis={analysis} loading={loading} error={error} />
        </section>
      </main>

      <SelectionModal
        selectedSong={selectedSong}
        selectedArtist={selectedArtist}
        modalType={modalType}
        onClose={() => setModalType(null)}
        onSelectRecommendation={handleSelectRecommendation}
      />
    </div>
  )
}

export default App
