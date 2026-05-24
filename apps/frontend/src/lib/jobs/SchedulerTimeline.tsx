import {
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react'

import type {
  BackgroundJob,
} from './job.types'

interface SchedulerTimelineProps {
  job: BackgroundJob
}

export function SchedulerTimeline({
  job,
}: SchedulerTimelineProps) {
  return (
    <ol className="space-y-3">
      {job.executions.map((execution) => {
        const Icon =
          execution.status === 'COMPLETED'
            ? CheckCircle2
            : execution.status === 'FAILED'
              ? XCircle
              : Clock3

        return (
          <li
            key={execution.id}
            className="flex gap-3 border-b border-zinc-800 pb-3 last:border-b-0"
          >
            <Icon className="mt-0.5 h-4 w-4 text-zinc-400" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {execution.status}
                </p>

                <span className="text-xs text-zinc-500">
                  {new Date(
                    execution.startedAt,
                  ).toLocaleString()}
                </span>

                {execution.durationMs ? (
                  <span className="text-xs text-zinc-500">
                    {execution.durationMs}ms
                  </span>
                ) : null}
              </div>

              {execution.workerId ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {execution.workerId}
                </p>
              ) : null}

              {execution.error ? (
                <p className="mt-2 text-sm text-red-300">
                  {execution.error}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
