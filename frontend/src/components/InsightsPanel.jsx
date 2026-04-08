import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

function InsightsPanel({ summary, loading, error }) {
  const doughnutData = {
    labels: summary.playlistDistribution.map((item) => item.playlist),
    datasets: [
      {
        data: summary.playlistDistribution.map((item) => item.count),
        backgroundColor: ['#1DB954', '#2fd06c', '#63e38f', '#8ef0af', '#c7fad8'],
        borderColor: '#090909',
        borderWidth: 4,
        hoverOffset: 8,
      },
    ],
  }

  const trendData = {
    labels: summary.popularityTrend.map((item) => item.title),
    datasets: [
      {
        label: 'Popularity Trend',
        data: summary.popularityTrend.map((item) => item.popularity),
        borderColor: '#1DB954',
        backgroundColor: 'rgba(29, 185, 84, 0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#a1a1aa', maxRotation: 0, autoSkip: true },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: { color: '#71717a' },
        grid: { color: 'rgba(255,255,255,0.06)' },
        border: { display: false },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#d4d4d8',
          padding: 18,
          usePointStyle: true,
        },
      },
    },
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
            Playlist Mix
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Distribution Snapshot
          </h2>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
            Playlist distribution is unavailable.
          </div>
        ) : loading ? (
          <div className="h-[340px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
        ) : summary.playlistDistribution.length ? (
          <div className="h-[340px] animate-[fadeInUp_0.7s_ease-out] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        ) : (
          <div className="rounded-3xl border border-white/8 bg-white/5 p-5 text-sm text-zinc-400">
            No playlist distribution data available.
          </div>
        )}
      </div>

      <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
            Trend View
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Top Song Popularity Curve
          </h2>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
            Popularity trend is unavailable.
          </div>
        ) : loading ? (
          <div className="h-[340px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
        ) : summary.popularityTrend.length ? (
          <div className="h-[340px] animate-[fadeInUp_0.85s_ease-out] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
            <Line data={trendData} options={trendOptions} />
          </div>
        ) : (
          <div className="rounded-3xl border border-white/8 bg-white/5 p-5 text-sm text-zinc-400">
            No popularity trend data available.
          </div>
        )}
      </div>
    </section>
  )
}

export default InsightsPanel