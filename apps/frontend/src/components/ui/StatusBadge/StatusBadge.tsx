interface Props {
  status: string
}

export function StatusBadge({
  status,
}: Props) {
  return (
    <div
      className={`
        inline-flex px-3 py-1 rounded-full text-xs font-medium
        ${
          status === 'ACTIVE'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }
      `}
    >
      {status}
    </div>
  )
}
