import { useQuery } from '@tanstack/react-query'

import {
  getWorkflows,
  getApprovals,
  getRules,
} from '../api/workflow.api'

import { WorkflowCard } from '../components/WorkflowCard'
import { ApprovalCard } from '../components/ApprovalCard'
import { AutomationRuleCard } from '../components/AutomationRuleCard'

export function WorkflowPage() {

  const {
    data: workflows,
  } = useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
  })

  const {
    data: approvals,
  } = useQuery({
    queryKey: ['approvals'],
    queryFn: getApprovals,
  })

  const {
    data: rules,
  } = useQuery({
    queryKey: ['rules'],
    queryFn: getRules,
  })

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Workflow Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Approval + Automation + Workflow Engine
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
            New Workflow
          </button>

          <button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white">
            Automation Rules
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Workflows
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            {workflows?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Approvals
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {approvals?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Automation Rules
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            {rules?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Running Executions
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            4
          </h2>

        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-3 gap-6">

        {/* WORKFLOWS */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Workflows
          </h2>

          {workflows?.map((workflow: any) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
            />
          ))}

        </div>

        {/* APPROVALS */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Approvals
          </h2>

          {approvals?.map((approval: any) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
            />
          ))}

        </div>

        {/* RULES */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Automation Rules
          </h2>

          {rules?.map((rule: any) => (
            <AutomationRuleCard
              key={rule.id}
              rule={rule}
            />
          ))}

        </div>

      </div>

    </div>
  )
}
