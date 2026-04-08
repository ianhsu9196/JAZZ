import { useCallback, useEffect, useState } from 'react'

const TOP_SONGS_API = 'http://localhost:3000/top_songs'
const ARTIST_RANK_API = 'http://localhost:3000/artist_rank'
const DASHBOARD_SUMMARY_API = 'http://localhost:3000/dashboard_summary'
const ANALYSIS_OVERVIEW_API = 'http://localhost:3000/analysis_overview'
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search'
const FALLBACK_COVER = 'https://placehold.co/600x600/111111/1DB954?text=Jazz+Cover'

function normalizeSong(song, index) {
  return {
    id: song.id ?? `${song.title ?? 'song'}-${index}`,
    rank: song.rank ?? index + 1,
    title: song.title ?? `Jazz Song ${index + 1}`,
    artist: song.artist ?? 'Unknown Artist',
    popularity: Number(song.popularity ?? 0),
    genre: song.genre ?? 'Jazz',
    numArtists: Number(song.num_artists ?? song.numArtists ?? 1),
    tempo: Number(song.tempo ?? 0),
    musicalKey: Number(song.key ?? 0),
    energy: Number(song.energy ?? 0),
    danceability: Number(song.danceability ?? 0),
    valence: Number(song.valence ?? 0),
    loudness: Number(song.loudness ?? 0),
    playCount: Number(song.play_count ?? song.playCount ?? 0),
    avgRating: Number(song.avg_rating ?? song.avgRating ?? 0),
    heatScore: Number(song.heat_score ?? song.heatScore ?? song.score ?? 0),
    releaseYear: Number(song.release_year ?? song.releaseYear ?? 0),
    decade: song.decade ?? 'Unknown',
    coverArt: song.cover_art ?? song.coverArt ?? FALLBACK_COVER,
    albumName: song.album_name ?? song.albumName ?? 'Jazz Collection',
    previewUrl: song.preview_url ?? song.previewUrl ?? '',
    trackUrl: song.track_url ?? song.trackUrl ?? '',
    summary:
      song.summary ??
      '歌曲介紹：這首歌目前還沒有生成完整介紹文，你可以稍後重新整理再試一次。',
    recommendations: Array.isArray(song.recommendations)
      ? song.recommendations.map((item, recIndex) => ({
          id: item.song_id ?? `${item.title ?? 'rec'}-${recIndex}`,
          songId: item.song_id ?? item.songId ?? null,
          title: item.title ?? `Recommended Song ${recIndex + 1}`,
          artist: item.artist ?? 'Unknown Artist',
          similarity: Number(item.similarity ?? 0),
          reason: item.reason ?? '和目前歌曲的音樂特徵接近。',
        }))
      : [],
  }
}

function normalizeArtist(artist, index) {
  return {
    id: artist.id ?? `${artist.artist ?? 'artist'}-${index}`,
    artist: artist.artist ?? `Artist ${index + 1}`,
    score: Number(artist.score ?? 0),
    heatScore: Number(artist.heat_score ?? artist.heatScore ?? artist.score ?? 0),
    playCount: Number(artist.play_count ?? artist.playCount ?? 0),
    avgRating: Number(artist.avg_rating ?? artist.avgRating ?? 0),
    avgPopularity: Number(artist.avg_popularity ?? artist.avgPopularity ?? 0),
    songCount: Number(artist.song_count ?? artist.songCount ?? 0),
    rank: Number(artist.rank ?? index + 1),
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
      totalArtists: Number(safeSummary.overview?.totalArtists ?? 0),
      totalAlbums: Number(safeSummary.overview?.totalAlbums ?? 0),
      averagePopularity: Number(safeSummary.overview?.averagePopularity ?? 0),
      averageDuration: Number(safeSummary.overview?.averageDuration ?? 0),
      averageTempo: Number(safeSummary.overview?.averageTempo ?? 0),
      averageEnergy: Number(safeSummary.overview?.averageEnergy ?? 0),
    },
  }
}

function normalizeAnalysis(data) {
  const safeData = data && typeof data === 'object' ? data : {}
  const artistPerformance = safeData.artistPerformance ?? {}
  const audioFeatureAnalysis = safeData.audioFeatureAnalysis ?? {}

  return {
    schemaOverview: {
      tables: Array.isArray(safeData.schemaOverview?.tables) ? safeData.schemaOverview.tables : [],
    },
    artistPerformance: {
      formula: artistPerformance.formula ?? '',
      byHeatScore: Array.isArray(artistPerformance.byHeatScore)
        ? artistPerformance.byHeatScore.map((item, index) => ({
            id: `${item.artist ?? 'artist'}-heat-${index}`,
            artist: item.artist ?? `Artist ${index + 1}`,
            heatScore: Number(item.heat_score ?? item.heatScore ?? 0),
            playCount: Number(item.play_count ?? item.playCount ?? 0),
            avgRating: Number(item.avg_rating ?? item.avgRating ?? 0),
            avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
            songCount: Number(item.song_count ?? item.songCount ?? 0),
          }))
        : [],
      byPlayCount: Array.isArray(artistPerformance.byPlayCount)
        ? artistPerformance.byPlayCount.map((item, index) => ({
            id: `${item.artist ?? 'artist'}-play-${index}`,
            artist: item.artist ?? `Artist ${index + 1}`,
            playCount: Number(item.play_count ?? item.playCount ?? 0),
            songCount: Number(item.song_count ?? item.songCount ?? 0),
          }))
        : [],
      byAverageRating: Array.isArray(artistPerformance.byAverageRating)
        ? artistPerformance.byAverageRating.map((item, index) => ({
            id: `${item.artist ?? 'artist'}-rating-${index}`,
            artist: item.artist ?? `Artist ${index + 1}`,
            avgRating: Number(item.avg_rating ?? item.avgRating ?? 0),
            songCount: Number(item.song_count ?? item.songCount ?? 0),
          }))
        : [],
    },
    playlistEffectiveness: Array.isArray(safeData.playlistEffectiveness)
      ? safeData.playlistEffectiveness.map((item, index) => ({
          id: `${item.playlist_name ?? 'playlist'}-${index}`,
          playlistName: item.playlist_name ?? item.playlistName ?? `Playlist ${index + 1}`,
          totalSongs: Number(item.total_songs ?? item.totalSongs ?? 0),
          avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
          avgHeat: Number(item.avg_heat ?? item.avgHeat ?? 0),
        }))
      : [],
    audioFeatureAnalysis: {
      tempoVsPopularity: Array.isArray(audioFeatureAnalysis.tempoVsPopularity)
        ? audioFeatureAnalysis.tempoVsPopularity.map((item, index) => ({
            id: item.song_id ?? `${item.title ?? 'song'}-tempo-${index}`,
            songId: item.song_id ?? null,
            title: item.title ?? `Song ${index + 1}`,
            artist: item.artist ?? 'Unknown Artist',
            tempo: Number(item.tempo ?? 0),
            popularity: Number(item.popularity ?? 0),
          }))
        : [],
      energyVsDanceability: Array.isArray(audioFeatureAnalysis.energyVsDanceability)
        ? audioFeatureAnalysis.energyVsDanceability.map((item, index) => ({
            id: item.song_id ?? `${item.title ?? 'song'}-energy-${index}`,
            songId: item.song_id ?? null,
            title: item.title ?? `Song ${index + 1}`,
            artist: item.artist ?? 'Unknown Artist',
            energy: Number(item.energy ?? 0),
            danceability: Number(item.danceability ?? 0),
            popularity: Number(item.popularity ?? 0),
          }))
        : [],
      valenceDistribution: Array.isArray(audioFeatureAnalysis.valenceDistribution)
        ? audioFeatureAnalysis.valenceDistribution.map((item, index) => ({
            id: `${item.label ?? 'valence'}-${index}`,
            label: item.label ?? `Bucket ${index + 1}`,
            count: Number(item.count ?? 0),
          }))
        : [],
      correlationMatrix: Array.isArray(audioFeatureAnalysis.correlationMatrix)
        ? audioFeatureAnalysis.correlationMatrix.map((item, index) => ({
            id: `${item.x ?? 'x'}-${item.y ?? 'y'}-${index}`,
            x: item.x ?? 'x',
            y: item.y ?? 'y',
            value: Number(item.value ?? 0),
          }))
        : [],
    },
    eraAnalysis: Array.isArray(safeData.eraAnalysis)
      ? safeData.eraAnalysis.map((item, index) => ({
          id: `${item.decade ?? 'decade'}-${index}`,
          decade: item.decade ?? `Era ${index + 1}`,
          avgTempo: Number(item.avg_tempo ?? item.avgTempo ?? 0),
          avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
          avgEnergy: Number(item.avg_energy ?? item.avgEnergy ?? 0),
          avgDanceability: Number(item.avg_danceability ?? item.avgDanceability ?? 0),
          songCount: Number(item.song_count ?? item.songCount ?? 0),
          styleLabel: item.style_label ?? item.styleLabel ?? '',
        }))
      : [],
    collaborationAnalysis: Array.isArray(safeData.collaborationAnalysis)
      ? safeData.collaborationAnalysis.map((item, index) => ({
          id: `${item.num_artists ?? item.numArtists ?? 'collab'}-${index}`,
          numArtists: Number(item.num_artists ?? item.numArtists ?? 0),
          avgPopularity: Number(item.avg_popularity ?? item.avgPopularity ?? 0),
          avgHeatScore: Number(item.avg_heat_score ?? item.avgHeatScore ?? 0),
          songCount: Number(item.song_count ?? item.songCount ?? 0),
        }))
      : [],
    recommendationMap: safeData.recommendationMap ?? {},
  }
}

async function fetchSongArtwork(song) {
  try {
    if (song.coverArt && song.coverArt !== FALLBACK_COVER) {
      return song
    }

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
