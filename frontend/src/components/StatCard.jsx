function StatCard({ stat }) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.2)]">
      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">{stat.label}</p>
      <p className="mt-2.5 overflow-hidden text-ellipsis whitespace-nowrap text-lg font-semibold text-white">
        {stat.value}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-zinc-400">{stat.hint}</p>
    </div>
  )
}

export default StatCard