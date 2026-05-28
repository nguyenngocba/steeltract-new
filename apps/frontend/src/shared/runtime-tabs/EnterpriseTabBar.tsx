import {
  NavLink,
} from 'react-router-dom'

type Tab = {

  key: string

  label: string

  vi: string

  path: string
}

type Props = {

  tabs: Tab[]
}

export function EnterpriseTabBar({
  tabs,
}: Props) {

  return (

    <div className="mb-8 overflow-auto">

      <div className="flex min-w-max gap-3">

        {tabs.map((tab) => (

          <NavLink

            key={tab.key}

            to={tab.path}

            className={({ isActive }) => `rounded-2xl border px-5 py-3 transition ${
              isActive

                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'

                : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-white'
            }`}
          >

            <div className="text-sm font-bold">
              {tab.vi}
            </div>

            <div className="mt-1 text-[10px] uppercase tracking-[0.25em]">
              {tab.label}
            </div>

          </NavLink>

        ))}

      </div>

    </div>
  )
}
