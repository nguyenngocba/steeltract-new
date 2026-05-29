const insights = [
  {
    title:
      'Inventory anomaly detected in Yard Zone B',
  },

  {
    title:
      'Supplier delay risk increased by 12%',
  },

  {
    title:
      'Production throughput expected to rise tomorrow',
  },

  {
    title:
      'QC failure pattern detected in Welding Stage',
  },
]

export function AiInsightsPanel() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-pink-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-pink-400">
          AI Insights
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Industrial anomaly detection runtime
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-white">
              {insight.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
