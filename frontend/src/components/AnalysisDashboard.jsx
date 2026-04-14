import { Fragment } from 'react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line, Scatter } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
)

const axisStyle = {
  x: {
    ticks: { color: '#a1a1aa', font: { size: 11 } },
    grid: { display: false },
    border: { display: false },
  },
  y: {
    ticks: { color: '#71717a', font: { size: 11 } },
    grid: { color: 'rgba(255,255,255,0.06)' },
    border: { display: false },
    beginAtZero: true,
  },
}

function StatBox({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{hint}</p>
    </div>
  )
}

function SchemaDiagram({ tables }) {
  const schemaMap = tables.reduce((acc, table) => {
    acc[table.name] = table
    return acc
  }, {})

  const orderedTables = [
    'Artists',
    'Songs',
    'Albums',
    'Song_Album',
    'Audio_Features',
    'User_Behavior',
    'Playlists',
    'Song_Playlist',
  ]
    .map((name) => schemaMap[name])
    .filter(Boolean)

  const relationNotes = [
    'Artists 1:N Songs',
    'Songs M:N Albums via Song_Album',
    'Songs 1:1 Audio_Features',
    'Songs 1:N User_Behavior',
    'Songs M:N Playlists via Song_Playlist',
  ]

  function formatColumn(tableName, column) {
    const primaryKeys = {
      Artists: ['artist_id'],
      Songs: ['song_id'],
      Albums: ['album_id'],
      Song_Album: ['song_id', 'album_id'],
      Audio_Features: ['song_id'],
      User_Behavior: ['user_id', 'song_id'],
      Playlists: ['playlist_id'],
      Song_Playlist: ['song_id', 'playlist_id'],
    }

    const foreignKeys = {
      Songs: ['artist_id'],
      Song_Album: ['song_id', 'album_id'],
      Audio_Features: ['song_id'],
      User_Behavior: ['song_id'],
      Song_Playlist: ['song_id', 'playlist_id'],
    }

    const keyParts = []

    if (primaryKeys[tableName]?.includes(column)) {
      keyParts.push('PK')
    }

    if (foreignKeys[tableName]?.includes(column)) {
      keyParts.push('FK')
    }

    return {
      label: column,
      keyTag: keyParts.join('/'),
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {orderedTables.map((table) => (
          <div
            key={table.name}
            className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{table.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">Relational Schema</p>
              </div>
              <span className="rounded-full border border-[#1DB954]/30 bg-[#1DB954]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86efac]">
                {table.columns.length} 欄位
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {table.columns.map((column) => {
                const item = formatColumn(table.name, column)
                return (
                  <div
                    key={`${table.name}-${column}`}
                    className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="text-sm text-zinc-200">{item.label}</span>
                    {item.keyTag ? (
                      <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                        {item.keyTag}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">主要關聯</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {relationNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-white/6 bg-[#0f1511] px-4 py-3 text-sm text-zinc-300">
                {note}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">拆表理由</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <p>1. 把藝人、專輯、歌曲主資料分開，避免同一位藝人名稱在每首歌中重複出現。</p>
            <p>2. 用關聯表處理多對多關係，讓 Songs 可以同時對應多張專輯與播放清單。</p>
            <p>3. 將 Audio_Features 與 User_Behavior 獨立，方便做特徵分析、推薦與使用者行為評估。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CorrelationGrid({ items }) {
  const featureLabels = ['tempo', 'energy', 'danceability', 'valence', 'loudness', 'popularity']

  function bgColor(value) {
    const alpha = Math.min(Math.abs(value), 1)
    return value >= 0
      ? `rgba(29,185,84,${0.18 + alpha * 0.45})`
      : `rgba(239,68,68,${0.18 + alpha * 0.45})`
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[620px] grid-cols-7 gap-2 text-xs">
        <div />
        {featureLabels.map((label) => (
          <div
            key={label}
            className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:text-xs"
          >
            {label}
          </div>
        ))}
        {featureLabels.map((rowLabel) => (
          <Fragment key={rowLabel}>
            <div className="flex items-center text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">
              {rowLabel}
            </div>
            {featureLabels.map((columnLabel) => {
              const cell = items.find((item) => item.x === rowLabel && item.y === columnLabel)
              const value = cell?.value ?? 0
              return (
                <div
                  key={`${rowLabel}-${columnLabel}`}
                  className="flex h-11 min-w-[74px] items-center justify-center rounded-xl border border-white/5 px-1 text-[11px] font-medium text-zinc-100"
                  style={{ backgroundColor: bgColor(value) }}
                >
                  {value.toFixed(2)}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function AnalysisDashboard({ analysis, loading, error }) {
  const topHeatArtist = analysis.artistPerformance.byHeatScore[0]
  const topPlayArtist = analysis.artistPerformance.byPlayCount[0]
  const topRatedArtist = analysis.artistPerformance.byAverageRating[0]
  const bestPlaylist = analysis.playlistEffectiveness[0]
  const strongestBucket = analysis.audioFeatureAnalysis.valenceDistribution.reduce(
    (best, item) => (item.count > (best?.count ?? -1) ? item : best),
    null,
  )

  const heatScoreChart = {
    labels: analysis.artistPerformance.byHeatScore.map((item) => item.artist),
    datasets: [
      {
        label: 'Heat Score',
        data: analysis.artistPerformance.byHeatScore.map((item) => item.heatScore),
        backgroundColor: '#1DB954',
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 34,
      },
    ],
  }

  const playCountChart = {
    labels: analysis.artistPerformance.byPlayCount.map((item) => item.artist),
    datasets: [
      {
        label: 'Play Count',
        data: analysis.artistPerformance.byPlayCount.map((item) => item.playCount),
        backgroundColor: '#84cc16',
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 34,
      },
    ],
  }

  const ratingChart = {
    labels: analysis.artistPerformance.byAverageRating.map((item) => item.artist),
    datasets: [
      {
        label: 'Average Rating',
        data: analysis.artistPerformance.byAverageRating.map((item) => item.avgRating),
        backgroundColor: '#22c55e',
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 34,
      },
    ],
  }

  const tempoScatter = {
    datasets: [
      {
        label: 'Tempo vs Popularity',
        data: analysis.audioFeatureAnalysis.tempoVsPopularity.map((item) => ({
          x: item.tempo,
          y: item.popularity,
        })),
        backgroundColor: 'rgba(29,185,84,0.72)',
        pointRadius: 4,
      },
    ],
  }

  const energyDanceabilityScatter = {
    datasets: [
      {
        label: 'Energy vs Danceability',
        data: analysis.audioFeatureAnalysis.energyVsDanceability.map((item) => ({
          x: item.energy,
          y: item.danceability,
        })),
        backgroundColor: 'rgba(34,211,238,0.72)',
        pointRadius: 4,
      },
    ],
  }

  const valenceChart = {
    labels: analysis.audioFeatureAnalysis.valenceDistribution.map((item) => item.label),
    datasets: [
      {
        data: analysis.audioFeatureAnalysis.valenceDistribution.map((item) => item.count),
        backgroundColor: ['#14532d', '#1DB954', '#86efac'],
        borderColor: '#090909',
        borderWidth: 4,
      },
    ],
  }

  const eraChart = {
    labels: analysis.eraAnalysis.map((item) => item.decade),
    datasets: [
      {
        label: 'Average Tempo',
        data: analysis.eraAnalysis.map((item) => item.avgTempo),
        borderColor: '#1DB954',
        backgroundColor: 'rgba(29,185,84,0.18)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Average Popularity',
        data: analysis.eraAnalysis.map((item) => item.avgPopularity),
        borderColor: '#facc15',
        backgroundColor: 'rgba(250,204,21,0.14)',
        fill: false,
        tension: 0.35,
      },
    ],
  }

  const collabChart = {
    labels: analysis.collaborationAnalysis.map((item) => `${item.numArtists} 人`),
    datasets: [
      {
        label: 'Average Popularity',
        data: analysis.collaborationAnalysis.map((item) => item.avgPopularity),
        borderColor: '#1ed760',
        backgroundColor: 'rgba(29,185,84,0.18)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Average Heat Score',
        data: analysis.collaborationAnalysis.map((item) => item.avgHeatScore),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.14)',
        fill: false,
        tension: 0.35,
      },
    ],
  }

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#d4d4d8' } } },
    scales: axisStyle,
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
            Relational Analytics
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            資料庫與分析升級總覽
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            這一區整合了 relational schema、藝人熱度、音樂特徵、年代趨勢與推薦系統，適合直接放進報告與 demo 展示。
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
            分析資料目前無法載入。
          </div>
        ) : loading ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl border border-white/8 bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            <StatBox
              label="Schema Tables"
              value={String(analysis.schemaOverview.tables.length)}
              hint="包含 Artists、Songs、Albums、Audio Features、User Behavior 等資料表。"
            />
            <StatBox
              label="Top Heat Artist"
              value={topHeatArtist?.artist ?? 'N/A'}
              hint={`Heat Score ${topHeatArtist?.heatScore?.toFixed(1) ?? '0.0'}`}
            />
            <StatBox
              label="Top Play Artist"
              value={topPlayArtist?.artist ?? 'N/A'}
              hint={`播放數 ${topPlayArtist?.playCount ?? 0}`}
            />
            <StatBox
              label="Best Playlist"
              value={bestPlaylist?.playlistName ?? 'N/A'}
              hint={`平均熱門度 ${bestPlaylist?.avgPopularity?.toFixed(1) ?? '0.0'}，最高評分藝人：${topRatedArtist?.artist ?? 'N/A'}`}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">1. Artist 分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Heat Score / 播放數 / 平均評分</h3>
            <p className="mt-2 text-sm text-zinc-400">這裡把你要的三種 Artist 指標拆開呈現，方便比較真正的影響力來源。</p>
          </div>
          {loading ? (
            <div className="h-[320px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-5">
              <div className="h-[280px] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
                <Bar data={heatScoreChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisStyle }} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-[240px] rounded-3xl border border-white/6 bg-white/5 p-4">
                  <Bar data={playCountChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisStyle }} />
                </div>
                <div className="h-[240px] rounded-3xl border border-white/6 bg-white/5 p-4">
                  <Bar data={ratingChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisStyle }} />
                </div>
              </div>
              <p className="text-sm leading-6 text-zinc-400">{analysis.artistPerformance.formula}</p>
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">2. 音樂特徵分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">tempo / energy / danceability / valence</h3>
            <p className="mt-2 text-sm text-zinc-400">利用 Spotify-like audio features 觀察歌曲熱門度與情緒特徵的關聯。</p>
          </div>
          {loading ? (
            <div className="h-[320px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-[260px] rounded-3xl border border-white/6 bg-white/5 p-4">
                  <Scatter data={tempoScatter} options={scatterOptions} />
                </div>
                <div className="h-[260px] rounded-3xl border border-white/6 bg-white/5 p-4">
                  <Scatter data={energyDanceabilityScatter} options={scatterOptions} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-[260px] rounded-3xl border border-white/6 bg-white/5 p-4">
                  <Doughnut data={valenceChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#d4d4d8' } } } }} />
                </div>
                <div className="rounded-3xl border border-white/6 bg-white/5 p-4">
                  <p className="mb-4 text-sm font-medium text-white">Correlation Matrix</p>
                  <CorrelationGrid items={analysis.audioFeatureAnalysis.correlationMatrix} />
                </div>
              </div>
              <p className="text-sm leading-6 text-zinc-400">情緒分布以「{strongestBucket?.label ?? 'N/A'}」最多，代表資料中的歌曲情緒大多集中在這個區間。</p>
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">3. 時代分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">不同年代的爵士特徵</h3>
            <p className="mt-2 text-sm text-zinc-400">用年代來看 tempo、populariy 與音樂風格的變化，強化報告中的 insight。</p>
          </div>
          {loading ? (
            <div className="h-[320px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-5">
              <div className="h-[320px] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
                <Line data={eraChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#d4d4d8' } } }, scales: axisStyle }} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.eraAnalysis.map((era) => (
                  <div key={era.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{era.decade}</p>
                    <p className="mt-2 text-sm text-zinc-300">平均 tempo：{era.avgTempo.toFixed(1)}</p>
                    <p className="text-sm text-zinc-300">平均熱門度：{era.avgPopularity.toFixed(1)}</p>
                    <p className="mt-2 text-sm text-zinc-400">{era.styleLabel}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">4. Schema / 推薦 / 合作分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Relational Schema Diagram</h3>
            <p className="mt-2 text-sm text-zinc-400">這一區用更正式的 schema 方式呈現資料表、PK/FK 與拆表理由，讓評審更容易看出資料庫設計脈絡。</p>
          </div>
          {loading ? (
            <div className="h-[320px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-5">
              <SchemaDiagram tables={analysis.schemaOverview.tables} />
              <div className="h-[320px] rounded-3xl border border-white/6 bg-white/5 p-4">
                <Line data={collabChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#d4d4d8' } } }, scales: axisStyle }} />
              </div>
              <p className="text-sm leading-6 text-zinc-400">推薦系統採用 cosine similarity，比對 tempo、energy、danceability、valence 與 popularity，並在歌曲細節區提供「You may also like」推薦清單。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AnalysisDashboard
