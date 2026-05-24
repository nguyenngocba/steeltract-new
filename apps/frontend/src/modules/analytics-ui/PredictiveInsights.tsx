import {
  Brain,
} from 'lucide-react'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  AnalyticsPrediction,
} from './analytics.types'

interface PredictiveInsightsProps {
  predictions: AnalyticsPrediction[]
}

export function PredictiveInsights({
  predictions,
}: PredictiveInsightsProps) {
  return (
    <SectionCard title="Predictive insights">
      <div className="space-y-3">
        {predictions.map((prediction) => (
          <div
            key={prediction.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
          >
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 h-4 w-4 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">
                    {prediction.title}
                  </p>
                  <StatusBadge tone="info">
                    {prediction.domain}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {prediction.horizon ??
                    'forecasting foundation'}
                  {prediction.confidence
                    ? ` - ${Math.round(prediction.confidence * 100)}% confidence`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
