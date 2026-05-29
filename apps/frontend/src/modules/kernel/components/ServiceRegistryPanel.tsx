import { runtimeRegistry } from '@/kernel/registry/runtime.registry'

export function ServiceRegistryPanel() {
  const services =
    runtimeRegistry.list()

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Service Registry
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Registered industrial runtime services
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div>
              <div className="text-sm font-bold text-white">
                {service.name}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                {service.version}
              </div>
            </div>

            <div
              className="
                rounded-full
                bg-emerald-500
                px-3
                py-1
                text-xs
                text-white
              "
            >
              {service.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
