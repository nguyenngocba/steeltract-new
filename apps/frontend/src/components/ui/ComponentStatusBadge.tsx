interface Props {
  status: string
}

export function ComponentStatusBadge({
  status,
}: Props) {
  function getColor() {
    switch (status) {
      case 'INSTALLED':
        return `
          bg-green-500/20
          text-green-400
          border-green-500/30
        `

      case 'DELIVERED':
        return `
          bg-purple-500/20
          text-purple-400
          border-purple-500/30
        `

      default:
        return `
          bg-yellow-500/20
          text-yellow-400
          border-yellow-500/30
        `
    }
  }

  return (
    <div
      className={`
        inline-flex
        items-center
        px-3 py-1
        rounded-full
        border
        text-sm
        font-semibold
        ${getColor()}
      `}
    >
      {status}
    </div>
  )
}