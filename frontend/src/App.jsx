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

function App() {
  const { songs, artists, summary, analysis, loading, error, refreshData } = useJazzData()
  const [searchTerm, setSearchTerm] = useState('')
  const [songSort, setSongSort] = useState('rank')
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

        return [song.title, song.artist, song.genre].join(' ').toLowerCase().includes(normalizedQuery)
      })
      .sort(sortOptions[songSort])
  }, [songs, searchTerm, songSort])

  const rankedArtists = useMemo(
    () => artists.map((artist, index) => ({ ...artist, rank: index + 1 })),
    [artists],
  )

  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? songs[0] ?? null
  const selectedArtist = rankedArtists.find((artist) => artist.id === selectedArtistId) ?? rankedArtists[0] ?? null

  const stats = useMemo(() => {
    const averagePopularity = songs.length
      ? Math.round(songs.reduce((sum, song) => sum + song.popularity, 0) / songs.length)
      : 0

    const totalArtistScore = artists.reduce((sum, artist) => sum + artist.score, 0)
    const topArtist = artists[0]?.artist ?? 'Waiting for data'

    return [
      {
        label: 'Tracks in View',
        value: loading ? '...' : String(filteredSongs.length),
        hint: 'Filtered top tracks',
      },
      {
        label: 'Avg Popularity',
        value: loading ? '...' : String(averagePopularity),
        hint: 'Across the top songs',
      },
      {
        label: 'Top Artist',
        value: topArtist,
        hint: loading ? 'Loading artist momentum' : 'Highest ranking artist',
      },
      {
        label: 'Avg Duration',
        value: loading ? '...' : `${summary.overview.averageDuration.toFixed(1)} min`,
        hint: 'Average track duration',
      },
      {
        label: 'Artist Score',
        value: loading ? '...' : totalArtistScore.toLocaleString(),
        hint: 'Combined artist momentum',
      },
      {
        label: 'Library Size',
        value: loading ? '...' : summary.overview.totalSongs.toLocaleString(),
        hint: 'Songs loaded into analysis',
      },
    ]
  }, [artists, filteredSongs.length, loading, songs, summary.overview.averageDuration, summary.overview.totalSongs])

  function handleSelectSong(song) {
    setSelectedSongId(song.id)
    setModalType('song')
  }

  function handleSelectArtist(artist) {
    setSelectedArtistId(artist.id)
    setModalType('artist')
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
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl animate-[fadeInUp_0.7s_ease-out]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
                  Curated Playlist Data
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl xl:text-[2.4rem]">
                  Spotify-style Jazz intelligence, built for your playlist data.
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Search top songs, watch artist momentum, and present extra database analysis that is ready for your report.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[440px]">
                {stats.map((stat) => (
                  <StatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </div>
          </div>

          <DetailPanel selectedSong={selectedSong} selectedArtist={selectedArtist} />

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
                    點擊歌曲卡片即可查看詳細資訊，包含歌手、流行度與專輯資料。
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:w-[300px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search songs or artists"
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
                    <div
                      key={index}
                      className="h-40 animate-pulse rounded-3xl border border-white/8 bg-white/6"
                    />
                  ))
                ) : filteredSongs.length ? (
                  filteredSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      isActive={selectedSong?.id === song.id}
                      onSelect={handleSelectSong}
                    />
                  ))
                ) : (
                  <div className="sm:col-span-2 rounded-3xl border border-white/8 bg-white/5 p-6 text-sm text-zinc-400">
                    No songs matched your search. Try a different title, artist, or sorting mode.
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
      />
    </div>
  )
}

export default App
