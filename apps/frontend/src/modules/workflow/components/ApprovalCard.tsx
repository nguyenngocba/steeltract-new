type Props = {
  approval: any
}

export function ApprovalCard({
  approval,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Approval Request
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {approval.requestCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            approval.status === 'approved'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {approval.status}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Module
          </p>

          <h3 className="mt-2 text-lg font-semibold text-cyan-400">
            {approval.module}
          </h3>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Requester
            </p>

            <h3 className="mt-2 text-sm text-white">
              {approval.requester}
            </h3>

          </div>

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Approver
            </p>

            <h3 className="mt-2 text-sm text-orange-400">
              {approval.approver}
            </h3>

          </div>

        </div>

      </div>

    </div>
  )
}
