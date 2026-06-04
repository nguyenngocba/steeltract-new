import { Link, useLocation } from 'react-router-dom'

type Props = {
  label: string
  path: string
}

export function SidebarItem({
  label,
  path,
}: Props) {
  const location =
    useLocation()

  const currentPath =
    `${location.pathname}${location.hash}`

  const active =
    currentPath === path || (!path.includes('#') && location.pathname === path)

  return (
    <Link
      to={path}
      onMouseDown={(event) => {
        event.currentTarget.blur()
      }}
      onFocus={(event) => {
        event.currentTarget.blur()
      }}
      className={`
        flex
        items-center
        justify-between
        rounded-lg
        px-3
        py-2.5
        text-sm
        font-medium
        transition-all
        ring-1

        ${
          active
            ? 'bg-blue-600/95 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] ring-blue-300/30'
            : 'text-slate-400 ring-transparent hover:bg-white/[0.07] hover:text-white'
        }
      `}
    >
      <span>{label}</span>

      {active && (
        <div
          className="
            h-2
            w-2
            rounded-full
            bg-cyan-200
            shadow-[0_0_12px_rgba(103,232,249,0.8)]
          "
        />
      )}
    </Link>
  )
}
