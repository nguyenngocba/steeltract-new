import { OperationalShell }
  from '@/shared/layouts/OperationalShell'

const slots = [
  {
    id: 'A1',

    occupied: true,

    components: [
      {
        code: 'COL-001',

        weight: '12.4T',

        project:
          'PRJ-001',
      },

      {
        code: 'BEAM-H400',

        weight: '8.2T',

        project:
          'PRJ-001',
      },
    ],
  },

  {
    id: 'A2',

    occupied: true,

    components: [
      {
        code: 'TRUSS-220',

        weight: '16.8T',

        project:
          'PRJ-003',
      },
    ],
  },

  {
    id: 'A3',

    occupied: false,

    components: [],
  },

  {
    id: 'B1',

    occupied: true,

    components: [
      {
        code: 'PLATE-12',

        weight: '3.2T',

        project:
          'PRJ-002',
      },

      {
        code: 'BEAM-I500',

        weight: '9.7T',

        project:
          'PRJ-002',
      },
    ],
  },

  {
    id: 'B2',

    occupied: false,

    components: [],
  },

  {
    id: 'B3',

    occupied: true,

    components: [
      {
        code: 'COL-900',

        weight: '22T',

        project:
          'PRJ-003',
      },
    ],
  },

  {
    id: 'C1',

    occupied: true,

    components: [
      {
        code: 'TRUSS-880',

        weight: '18.4T',

        project:
          'PRJ-001',
      },
    ],
  },

  {
    id: 'C2',

    occupied: true,

    components: [
      {
        code: 'BEAM-H800',

        weight: '14.6T',

        project:
          'PRJ-003',
      },
    ],
  },

  {
    id: 'C3',

    occupied: false,

    components: [],
  },
]

export function YardPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            Yard Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Steel Yard Visual Runtime
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Spatial component allocation & realtime yard operations
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`
                rounded-3xl
                border
                p-6
                transition-all

                ${
                  slot.occupied
                    ? 'border-cyan-500/30 bg-cyan-500/10'
                    : 'border-zinc-800 bg-zinc-900'
                }
              `}
            >
              <div className="flex items-start justify-between">

                <div>

                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Yard Slot
                  </div>

                  <div className="mt-2 text-4xl font-black text-white">
                    {slot.id}
                  </div>

                </div>

                <div
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-medium

                    ${
                      slot.occupied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-700 text-zinc-400'
                    }
                  `}
                >
                  {slot.occupied
                    ? 'OCCUPIED'
                    : 'EMPTY'}
                </div>

              </div>

              <div className="mt-6">

                <div className="text-xs text-zinc-500">
                  Components
                </div>

                <div className="mt-2 text-5xl font-black text-white">
                  {slot.components.length}
                </div>

              </div>

              <div className="mt-6 space-y-3">

                {slot.components.map(
                  (component) => (
                    <div
                      key={component.code}
                      className="
                        rounded-2xl
                        border
                        border-zinc-800
                        bg-black/40
                        p-3
                      "
                    >
                      <div className="flex items-center justify-between">

                        <div className="text-sm font-medium text-white">
                          {component.code}
                        </div>

                        <div className="text-xs text-cyan-400">
                          {component.project}
                        </div>

                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        Weight: {component.weight}
                      </div>

                    </div>
                  ),
                )}

              </div>

            </div>
          ))}

        </div>

      </div>
    </OperationalShell>
  )
}