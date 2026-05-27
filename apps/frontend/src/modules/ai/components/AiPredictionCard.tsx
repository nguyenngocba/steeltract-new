type Props = {
  prediction: any
}

export function AiPredictionCard({
  prediction,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Prediction
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {prediction.predictionCode}
          </h2>

        </div>

        <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-400">
          {prediction.confidence}%
        </div>

      </div>

      <div className="mt-6 rounded-2xl bg-zinc-950 p-4">

        <p className="text-xs text-zinc-500">
          Prediction Type
        </p>

        <h3 className="mt-2 text-lg font-semibold text-cyan-400">
          {prediction.predictionType}
        </h3>

      </div>

      <div className="mt-4 rounded-2xl bg-zinc-950 p-4">

        <p className="text-xs text-zinc-500">
          Result
        </p>

        <pre className="mt-2 overflow-auto text-xs text-zinc-300">
{JSON.stringify(
  prediction.predictionResult,
  null,
  2
)}
        </pre>

      </div>

    </div>
  )
}
