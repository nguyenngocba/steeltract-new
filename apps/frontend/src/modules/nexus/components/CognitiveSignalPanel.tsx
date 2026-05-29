import { neuralBrain } from '@/nexus/brain/neural.brain'

function getColor(priority: string) {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-500'

    case 'MEDIUM':
      return 'bg-orange-500'

    default:
      return 'bg-cyan-500'
  }
}

export function CognitiveSignalPanel() {
  const signals =
    neuralBrain.cognition()

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
          Cognitive Signals
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Unified industrial cognition feed
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {signal.domain}
                </div>

                <div className="mt-2 text-sm text-zinc-500">
                  {signal.signal}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(signal.priority)}
                `}
              >
                {signal.priority}
              </div>
            </div>

            <div className="mt-3 text-xs text-pink-300">
              Confidence: {signal.confidence}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
