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

  const active =
    location.pathname === path

  return (
    <Link
      to={path}
      className={`
        flex
        items-center
        justify-between
        rounded-xl
        px-4
        py-3
        text-sm
        transition-all

        ${
          active
            ? 'bg-cyan-500 text-black'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
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
            bg-black
          "
        />
      )}
    </Link>
  )
}
