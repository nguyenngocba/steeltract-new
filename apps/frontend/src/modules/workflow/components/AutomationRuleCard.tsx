type Props = {
  rule: any
}

export function AutomationRuleCard({
  rule,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Automation Rule
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {rule.ruleCode}
          </h2>

        </div>

        <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-400">
          {rule.status}
        </div>

      </div>

      <div className="mt-6 rounded-2xl bg-zinc-950 p-4">

        <p className="text-xs text-zinc-500">
          Rule Name
        </p>

        <h3 className="mt-2 text-lg font-semibold text-white">
          {rule.ruleName}
        </h3>

      </div>

      <div className="mt-4 rounded-2xl bg-zinc-950 p-4">

        <p className="text-xs text-zinc-500">
          Trigger Event
        </p>

        <h3 className="mt-2 text-sm text-cyan-400">
          {rule.triggerEvent}
        </h3>

      </div>

    </div>
  )
}
