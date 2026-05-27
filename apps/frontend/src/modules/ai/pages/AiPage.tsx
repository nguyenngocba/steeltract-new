import { useQuery } from '@tanstack/react-query'

import {
  getAgents,
  getPredictions,
} from '../api/ai.api'

import { AiAgentCard } from '../components/AiAgentCard'
import { AiPredictionCard } from '../components/AiPredictionCard'

export function AiPage() {

  const {
    data: agents,
  } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: getAgents,
  })

  const {
    data: predictions,
  } = useQuery({
    queryKey: ['ai-predictions'],
    queryFn: getPredictions,
  })

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            AI Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Prediction + Optimization + AI Agents
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2">

          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />

          <span className="text-xs font-medium text-cyan-400">
            AI ONLINE
          </span>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            AI Agents
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            {agents?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Predictions
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {predictions?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Optimization Gain
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            +12%
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            AI Accuracy
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            91%
          </h2>

        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-2 gap-6">

        {/* AGENTS */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            AI Agents
          </h2>

          {agents?.map((agent: any) => (
            <AiAgentCard
              key={agent.id}
              agent={agent}
            />
          ))}

        </div>

        {/* PREDICTIONS */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Predictions
          </h2>

          {predictions?.map((prediction: any) => (
            <AiPredictionCard
              key={prediction.id}
              prediction={prediction}
            />
          ))}

        </div>

      </div>

    </div>
  )
}
