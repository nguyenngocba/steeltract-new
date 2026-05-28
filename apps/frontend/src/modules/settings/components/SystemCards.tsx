const systems = [

  'Users',
  'Permissions',
  'Notifications',
  'Logs',
  'Backups',
  'System Config',
  'Mail Runtime',
  'Audit Runtime',
]

export function SystemCards() {

  return (

    <div className="grid grid-cols-4 gap-5">

      {systems.map((item) => (

        <div
          key={item}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-cyan-500/30"
        >

          <div className="text-lg font-bold text-white">
            {item}
          </div>

          <div className="mt-3 text-sm text-zinc-500">
            Enterprise Runtime Configuration
          </div>

        </div>

      ))}

    </div>
  )
}
