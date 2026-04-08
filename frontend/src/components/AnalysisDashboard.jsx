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
import { Bar, Doughnut, Line } from 'react-chartjs-2'

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

function AnalysisDashboard({ analysis, loading, error }) {
  const artistInfluenceData = {
    labels: analysis.artistInfluence.map((item) => item.artist),
    datasets: [
      {
        label: '總流行度',
        data: analysis.artistInfluence.map((item) => item.totalPopularity),
        backgroundColor: '#1DB954',
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 36,
      },
    ],
  }

  const popularityDistributionData = {
    labels: analysis.popularityDistribution.map((item) => item.popularityLevel),
    datasets: [
      {
        data: analysis.popularityDistribution.map((item) => item.count),
        backgroundColor: ['#1DB954', '#7bd89b', '#d5f9e1'],
        borderColor: '#090909',
        borderWidth: 4,
      },
    ],
  }

  const collaborationData = {
    labels: analysis.collaborationAnalysis.map((item) => `${item.numArtists} artists`),
    datasets: [
      {
        label: '平均流行度',
        data: analysis.collaborationAnalysis.map((item) => item.avgPopularity),
        borderColor: '#1ed760',
        backgroundColor: 'rgba(29, 185, 84, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  }

  const topPlaylist = analysis.playlistEffectiveness[0]
  const topArtist = analysis.artistInfluence[0]
  const strongestPopularityBucket = analysis.popularityDistribution.reduce(
    (best, item) => (item.count > (best?.count ?? -1) ? item : best),
    null,
  )
  const bestCollab = analysis.collaborationAnalysis.reduce(
    (best, item) => (item.avgPopularity > (best?.avgPopularity ?? -1) ? item : best),
    null,
  )

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">
            加分分析
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            報告可直接使用的洞察
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            這四組分析把資料庫結果轉成更完整的故事線，適合課堂展示與報告撰寫。
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
            加分分析資料載入失敗。
          </div>
        ) : loading ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl border border-white/8 bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">歌手影響力</p>
              <p className="mt-3 text-xl font-semibold text-white">{topArtist?.artist ?? 'N/A'}</p>
              <p className="mt-2 text-sm text-zinc-400">
                累積總流行度為 {topArtist?.totalPopularity ?? 0}，來自 {topArtist?.songCount ?? 0} 首歌曲。
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">最強播放清單</p>
              <p className="mt-3 text-xl font-semibold text-white">{topPlaylist?.playlistName ?? 'N/A'}</p>
              <p className="mt-2 text-sm text-zinc-400">
                平均流行度 {topPlaylist?.avgPopularity ?? 0}，共收錄 {topPlaylist?.totalSongs ?? 0} 首歌。
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">流行度分布</p>
              <p className="mt-3 text-xl font-semibold text-white">{strongestPopularityBucket?.popularityLevel ?? 'N/A'}</p>
              <p className="mt-2 text-sm text-zinc-400">
                這是目前占比最大的流行度區間，共有 {strongestPopularityBucket?.count ?? 0} 首歌。
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">最佳合作規模</p>
              <p className="mt-3 text-xl font-semibold text-white">{bestCollab ? `${bestCollab.numArtists} artists` : 'N/A'}</p>
              <p className="mt-2 text-sm text-zinc-400">
                平均流行度最高的合作人數為 {bestCollab?.numArtists ?? 0} 人，平均值為 {bestCollab?.avgPopularity ?? 0}。
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">1. 歌手影響力分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">哪些爵士歌手最有影響力？</h3>
            <p className="mt-2 text-sm text-zinc-400">
              以歌手的總流行度作為主要指標，綜合歌曲數量與整體受歡迎程度。
            </p>
          </div>
          {loading ? (
            <div className="h-[340px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-4">
              <div className="h-[340px] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
              <Bar data={artistInfluenceData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisStyle }} />
              </div>
              <p className="text-sm leading-6 text-zinc-400">
                中文解讀：目前影響力最高的歌手是 <span className="font-semibold text-white">{topArtist?.artist ?? 'N/A'}</span>，
                表示他在資料集中累積了最高的總流行度，具有最強的整體曝光與代表性。
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">2. 播放清單效果分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">哪個播放清單表現最好？</h3>
            <p className="mt-2 text-sm text-zinc-400">
              以平均流行度為主，搭配歌曲數量一起判斷 playlist 的整體品質與影響力。
            </p>
          </div>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/8 bg-white/5" />
                ))
              : analysis.playlistEffectiveness.slice(0, 5).map((playlist, index) => (
                  <div key={playlist.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:border-[#1DB954]/30 hover:bg-white/8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">#{index + 1}</p>
                      <p className="mt-2 text-base font-semibold text-white">{playlist.playlistName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#8ef0af]">平均 {playlist.avgPopularity}</p>
                      <p className="mt-1 text-xs text-zinc-500">{playlist.totalSongs} 首歌</p>
                    </div>
                  </div>
                ))}
            {!loading ? (
              <p className="text-sm leading-6 text-zinc-400">
                中文解讀：<span className="font-semibold text-white">{topPlaylist?.playlistName ?? 'N/A'}</span> 的平均流行度最高，
                代表這個播放清單收錄的歌曲整體更受歡迎，是最有說服力的 playlist 表現案例。
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">3. 熱門歌曲分布</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">歌曲流行度如何分布？</h3>
            <p className="mt-2 text-sm text-zinc-400">
              將歌曲分成高、中、低三種流行度區間，用來觀察資料集是否偏向熱門歌或長尾歌曲。
            </p>
          </div>
          {loading ? (
            <div className="h-[340px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-4">
              <div className="h-[340px] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
              <Doughnut
                data={popularityDistributionData}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#d4d4d8', padding: 18, usePointStyle: true } } } }}
              />
              </div>
              <p className="text-sm leading-6 text-zinc-400">
                中文解讀：目前資料主要集中在 <span className="font-semibold text-white">{strongestPopularityBucket?.popularityLevel ?? 'N/A'}</span> 區間，
                代表這個爵士資料集更偏向中低曝光、長尾型作品，而不是高度商業化的熱門歌曲。
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[#0d0d0d]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1DB954]">4. 多人合作分析</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">合作人數越多會越紅嗎？</h3>
            <p className="mt-2 text-sm text-zinc-400">
              觀察不同合作人數下的平均流行度，評估多人合作是否對歌曲表現有明顯幫助。
            </p>
          </div>
          {loading ? (
            <div className="h-[340px] animate-pulse rounded-3xl border border-white/8 bg-white/5" />
          ) : (
            <div className="space-y-4">
              <div className="h-[340px] rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(29,185,84,0.08),rgba(255,255,255,0.02))] p-4">
              <Line data={collaborationData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisStyle }} />
              </div>
              <p className="text-sm leading-6 text-zinc-400">
                中文解讀：最佳合作規模目前落在 <span className="font-semibold text-white">{bestCollab?.numArtists ?? 0}</span> 人附近。
                這表示適度合作可能帶來加分效果，但合作人數過多時，平均流行度不一定持續上升。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AnalysisDashboard
