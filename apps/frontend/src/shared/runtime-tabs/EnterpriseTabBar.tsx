import { NavLink } from 'react-router-dom'

type Tab = {
  key: string
  label: string
  vi: string
  path: string
}

type Props = {
  tabs: Tab[]
  variant?: 'default' | 'embedded'
}

export function EnterpriseTabBar({ tabs, variant = 'default' }: Props) {
  return (
    <div className={variant === 'embedded' ? 'overflow-auto' : 'mb-4 overflow-auto rounded-xl border border-white/10 bg-white/[0.055] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl'}>
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={({ isActive }) => `rounded-lg px-4 py-2.5 transition ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="text-sm font-semibold leading-none">{tab.vi}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] opacity-70">{tab.label}</div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
