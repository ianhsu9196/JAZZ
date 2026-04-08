import { useRef } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { artistChartOptions } from '../utils/chartOptions'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

function ArtistChart({ artists, loading, error, chartType, onChartTypeChange, selectedArtistId, onSelectArtist }) {
  const chartRef = useRef(null)
  const labels = artists.map((artist) => artist.artist)
  const values = artists.map((artist) => artist.heatScore)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Heat Score',
        data: values,
        backgroundColor: artists.map((artist) =>
          artist.id === selectedArtistId ? '#1ed760' : '#1DB954',
        ),
        borderColor: '#1ed760',
        borderWidth: 2,
        borderRadius: 14,
        borderSkipped: false,
        hoverBackgroundColor: '#1ed760',
        maxBarThickness: 42,
        pointBackgroundColor: '#1ed760',
        pointBorderColor: '#0b0b0b',
        pointHoverRadius: 6,
        pointRadius: artists.map((artist) => (artist.id === selectedArtistId ? 6 : 4)),
        fill: false,
        tension: 0.35,
      },
    ],
  }

  const ChartComponent = chartType === 'line' ? Line : Bar

  function handleChartClick(event) {
    const chart = chartRef.current
    if (!chart) {
      return
    }

    const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, true)
    if (!elements.length) {
      return
    }

    const artist = artists[elements[0].index]
    onSelectArtist?.(artist)
  }

  return (
    <section className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
            Artist Ranking
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Top Artist by Heat Score
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            排名依照 Heat Score 計算：0.5 x 播放數 + 0.3 x 熱門度 + 0.2 x 平均評分。
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
          {['bar', 'line'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChartTypeChange(type)}
              className={[
                'rounded-2xl px-4 py-2 text-sm font-medium capitalize transition',
                chartType === type
                  ? 'bg-[#1DB954] text-black shadow-[0_10px_24px_rgba(29,185,84,0.28)]'
                  : 'text-zinc-300 hover:text-white',
              ].join(' ')}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
          Artist ranking could not be displayed.
        </div>
      ) : loading ? (
        <div className="flex h-[420px] animate-pulse items-center justify-center rounded-3xl border border-white/8 bg-white/5 text-sm text-zinc-500">
          Loading artist chart...
        </div>
      ) : artists.length === 0 ? (
        <div className="flex h-[420px] items-center justify-center rounded-3xl border border-white/8 bg-white/5 text-sm text-zinc-500">
          No artist ranking data available.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-[420px] cursor-pointer rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
            <ChartComponent ref={chartRef} data={chartData} options={artistChartOptions} onClick={handleChartClick} />
          </div>
          <div className="flex flex-wrap gap-2">
            {artists.slice(0, 10).map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => onSelectArtist?.(artist)}
                className={[
                  'rounded-full border px-3 py-2 text-xs transition',
                  artist.id === selectedArtistId
                    ? 'border-[#1DB954]/45 bg-[#1DB954]/15 text-white'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:border-[#1DB954]/30 hover:text-white',
                ].join(' ')}
              >
                {artist.artist}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ArtistChart
