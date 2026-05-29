const recommendations = [
  {
    title:
      'Increase steel procurement by 14%',
  },

  {
    title:
      'Reallocate crane capacity to Yard Zone B',
  },

  {
    title:
      'Schedule maintenance for Machine MC-12',
  },

  {
    title:
      'Prioritize dispatch for Project PJ-001',
  },
]

export function AiRecommendations() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-400">
          AI Recommendations
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Predictive operational guidance
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {recommendations.map((item) => (
          <div
            key={item.title}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-white">
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
