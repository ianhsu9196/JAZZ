import { useCallback, useEffect, useState } from 'react'

const TOP_SONGS_API = 'http://localhost:3000/top_songs'
const ARTIST_RANK_API = 'http://localhost:3000/artist_rank'
const DASHBOARD_SUMMARY_API = 'http://localhost:3000/dashboard_summary'
const ANALYSIS_OVERVIEW_API = 'http://localhost:3000/analysis_overview'
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search'
const FALLBACK_COVER = 'https://placehold.co/600x600/111111/1DB954?text=Jazz+Cover'

function normalizeSong(song, index) {
  return {
    id: song.id ?? `${song.title ?? song.song ?? 'song'}-${index}`,
    rank: index + 1,
    title: song.title ?? song.song ?? song.name ?? `Jazz Song ${index + 1}`,
    artist: song.artist ?? song.artist_name ?? 'Unknown Artist',
    popularity: Number(song.popularity ?? song.score ?? song.streams ?? 0),
    genre: song.genre ?? 'Jazz',
    numArtists: Number(song.num_artists ?? song.numArtists ?? 1),
    coverArt: song.cover_art ?? song.coverArt ?? FALLBACK_COVER,
    albumName: song.album_name ?? song.albumName ?? 'Jazz Collection',
    previewUrl: song.preview_url ?? song.previewUrl ?? '',
    trackUrl: song.track_url ?? song.trackUrl ?? '',
    summary:
      song.summary ??
      '歌曲介紹：這首歌目前還沒有生成完整介紹文，你可以稍後重新整理再試一次。',
  }
}

function normalizeArtist(artist, index) {
  return {
    id: artist.id ?? `${artist.artist ?? artist.name ?? 'artist'}-${index}`,
    artist: artist.artist ?? artist.name ?? artist.artist_name ?? `Artist ${index + 1}`,
    score: Number(artist.score ?? artist.popularity ?? artist.count ?? 0),
  }
}

function normalizeSummary(summary) {
  const safeSummary = summary && typeof summary === 'object' ? summary : {}

  return {
    playlistDistribution: Array.isArray(safeSummary.playlistDistribution)
      ? safeSummary.playlistDistribution.map((item, index) => ({
          id: `${item.playlist ?? 'playlist'}-${index}`,
          playlist: item.playlist ?? `Playlist ${index + 1}`,
          count: Number(item.count ?? 0),
        }))
      : [],
    popularityTrend: Array.isArray(safeSummary.popularityTrend)
      ? safeSummary.popularityTrend.map((item, index) => ({
          id: `${item.title ?? 'song'}-${index}`,
          title: item.title ?? `Song ${index + 1}`,
          popularity: Number(item.popularity ?? 0),
        }))
      : [],
    overview: {
      totalSongs: Number(safeSummary.overview?.totalSongs ?? 0),
      averagePopularity: Number(safeSummary.overview?.averagePopularity ?? 0),
      averageDuration: Number(safeSummary.overview?.averageDuration ?? 0),
    },
  }
}

function normalizeAnalysis(data) {
  const safeData = data && typeof data === 'object' ? data : {}

  return {
    artistInfluence: Array.isArray(safeData.artistInfluence)
      ? safeData.artistInfluence.map((item, index) => ({
          id: `${item.artist ?? 'artist'}-${index}`,
          artist: item.artist ?? `Artist ${index + 1}`,
          songCount: Number(item.song_count ?? item.songCount ?? 0),
          avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
          totalPopularity: Number(item.total_popularity ?? item.totalPopularity ?? 0),
        }))
      : [],
    playlistEffectiveness: Array.isArray(safeData.playlistEffectiveness)
      ? safeData.playlistEffectiveness.map((item, index) => ({
          id: `${item.playlist_name ?? 'playlist'}-${index}`,
          playlistName: item.playlist_name ?? item.playlistName ?? `Playlist ${index + 1}`,
          totalSongs: Number(item.total_songs ?? item.totalSongs ?? 0),
          avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
        }))
      : [],
    popularityDistribution: Array.isArray(safeData.popularityDistribution)
      ? safeData.popularityDistribution.map((item, index) => ({
          id: `${item.popularity_level ?? 'level'}-${index}`,
          popularityLevel: item.popularity_level ?? item.popularityLevel ?? `Level ${index + 1}`,
          count: Number(item.count ?? 0),
        }))
      : [],
    collaborationAnalysis: Array.isArray(safeData.collaborationAnalysis)
      ? safeData.collaborationAnalysis.map((item, index) => ({
          id: `${item.num_artists ?? 'artist-count'}-${index}`,
          numArtists: Number(item.num_artists ?? item.numArtists ?? 0),
          avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
          songCount: Number(item.song_count ?? item.songCount ?? 0),
        }))
      : [],
  }
}

async function fetchSongArtwork(song) {
  try {
    const term = encodeURIComponent(`${song.title} ${song.artist}`)
    const response = await fetch(`${ITUNES_SEARCH_API}?term=${term}&entity=song&limit=1&country=us`)

    if (!response.ok) {
      return song
    }

    const payload = await response.json()
    const result = payload.results?.[0]

    if (!result) {
      return song
    }

    return {
      ...song,
      coverArt: (result.artworkUrl100 || FALLBACK_COVER).replace('100x100bb', '600x600bb'),
      albumName: result.collectionName ?? song.albumName,
      previewUrl: result.previewUrl ?? '',
      trackUrl: result.trackViewUrl ?? result.collectionViewUrl ?? '',
    }
  } catch {
    return song
  }
}

export function useJazzData() {
  const [songs, setSongs] = useState([])
  const [artists, setArtists] = useState([])
  const [summary, setSummary] = useState(normalizeSummary())
  const [analysis, setAnalysis] = useState(normalizeAnalysis())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [songsResponse, artistsResponse, summaryResponse, analysisResponse] = await Promise.all([
        fetch(TOP_SONGS_API),
        fetch(ARTIST_RANK_API),
        fetch(DASHBOARD_SUMMARY_API),
        fetch(ANALYSIS_OVERVIEW_API),
      ])

      if (!songsResponse.ok || !artistsResponse.ok || !summaryResponse.ok || !analysisResponse.ok) {
        throw new Error('The API responded with an unexpected status code.')
      }

      const [songsData, artistsData, summaryData, analysisData] = await Promise.all([
        songsResponse.json(),
        artistsResponse.json(),
        summaryResponse.json(),
        analysisResponse.json(),
      ])

      const normalizedSongs = (Array.isArray(songsData) ? songsData : []).slice(0, 10).map(normalizeSong)
      const songsWithArtwork = await Promise.all(normalizedSongs.map(fetchSongArtwork))

      setSongs(songsWithArtwork)
      setArtists((Array.isArray(artistsData) ? artistsData : []).slice(0, 10).map(normalizeArtist))
      setSummary(normalizeSummary(summaryData))
      setAnalysis(normalizeAnalysis(analysisData))
    } catch (fetchError) {
      setError(fetchError.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    songs,
    artists,
    summary,
    analysis,
    loading,
    error,
    refreshData: fetchDashboardData,
  }
}
