import { simulationUniverse } from '@/simulation/engine/simulation.engine'

export function PredictiveScenarioPanel() {
  const scenarios =
    simulationUniverse.list()

  return (
    <div
      className="
        rounded-2xl
        border
        border-cyan-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
          Predictive Scenarios
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          AI-generated industrial simulations
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {scenario.title}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {scenario.prediction}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-cyan-300">
                {scenario.runtime}
              </div>

              <div
                className="
                  rounded-full
                  bg-cyan-400
                  px-3
                  py-1
                  text-xs
                  text-black
                "
              >
                {scenario.confidence}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
