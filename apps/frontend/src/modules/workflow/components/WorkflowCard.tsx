type Props = {
  workflow: any
}

export function WorkflowCard({
  workflow,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Workflow
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {workflow.workflowCode}
          </h2>

        </div>

        <div className="rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400">
          {workflow.module}
        </div>

      </div>

      <div className="mt-6 rounded-2xl bg-zinc-950 p-4">

        <p className="text-xs text-zinc-500">
          Workflow Name
        </p>

        <h3 className="mt-2 text-lg font-semibold text-white">
          {workflow.workflowName}
        </h3>

      </div>

      <div className="mt-4 rounded-2xl bg-zinc-950 p-4">

        <p className="mb-3 text-xs text-zinc-500">
          Steps
        </p>

        <div className="space-y-2">

          {workflow.steps?.map(
            (
              step: string,
              index: number
            ) => (
              <div
                key={index}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
              >
                {index + 1}. {step}
              </div>
            )
          )}

        </div>

      </div>

    </div>
  )
}
