import { autonomousEngine } from '@/autonomous/engine/autonomous.engine'

export function AutonomousDecisionPanel() {
  const decisions =
    autonomousEngine.history()

  return (
    <div
      className="
        rounded-2xl
        border
        border-orange-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-orange-400">
          Autonomous Decisions
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          AI-driven operational decisions
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {decision.runtime}
                </div>

                <div className="mt-2 text-sm text-zinc-500">
                  {decision.action}
                </div>
              </div>

              <div
                className="
                  rounded-full
                  bg-orange-500
                  px-3
                  py-1
                  text-xs
                  text-black
                "
              >
                {decision.confidence}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
