import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  XCircle,
} from 'lucide-react'

import type {
  WorkflowInstance,
  WorkflowStep,
} from './workflow.types'

interface WorkflowTimelineProps {
  instance: WorkflowInstance
}

function stepState(
  instance: WorkflowInstance,
  step: WorkflowStep,
) {
  if (instance.currentStepId === step.id) {
    return 'current'
  }

  const approved = instance.actions.some(
    (action) =>
      action.stepId === step.id &&
      ['APPROVE', 'MOVE_NEXT', 'COMPLETE'].includes(
        action.type,
      ),
  )

  if (approved) {
    return 'done'
  }

  return 'pending'
}

export function WorkflowTimeline({
  instance,
}: WorkflowTimelineProps) {
  return (
    <ol className="space-y-3">
      {instance.definition.steps.map((step) => {
        const state = stepState(instance, step)
        const Icon =
          state === 'done'
            ? CheckCircle2
            : state === 'current'
              ? Clock3
              : Circle

        return (
          <li
            key={step.id}
            className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <Icon
              className={
                state === 'done'
                  ? 'mt-0.5 h-5 w-5 text-emerald-400'
                  : state === 'current'
                    ? 'mt-0.5 h-5 w-5 text-cyan-400'
                    : 'mt-0.5 h-5 w-5 text-zinc-500'
              }
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {step.name}
                </p>

                {step.slaHours ? (
                  <span className="text-xs text-zinc-400">
                    SLA {step.slaHours}h
                  </span>
                ) : null}

                {step.escalationAfterHours ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    Escalates in{' '}
                    {step.escalationAfterHours}h
                  </span>
                ) : null}
              </div>

              {step.description ? (
                <p className="mt-1 text-sm text-zinc-400">
                  {step.description}
                </p>
              ) : null}

              {step.requiredPermission ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {step.requiredPermission}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function WorkflowActivityTimeline({
  instance,
}: WorkflowTimelineProps) {
  return (
    <ol className="space-y-3">
      {instance.actions.map((action) => {
        const Icon =
          action.type === 'REJECT'
            ? XCircle
            : action.type === 'ESCALATE'
              ? AlertTriangle
              : CheckCircle2

        return (
          <li
            key={action.id}
            className="flex gap-3 border-b border-zinc-800 pb-3 last:border-b-0"
          >
            <Icon className="mt-0.5 h-4 w-4 text-zinc-400" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {action.type.replaceAll('_', ' ')}
                </p>

                <span className="text-xs text-zinc-500">
                  {new Date(
                    action.createdAt,
                  ).toLocaleString()}
                </span>
              </div>

              {action.step?.name ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {action.step.name}
                </p>
              ) : null}

              {action.comment ? (
                <p className="mt-2 text-sm text-zinc-300">
                  {action.comment}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
