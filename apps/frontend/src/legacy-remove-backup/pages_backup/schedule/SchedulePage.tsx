import {
  useEffect,
  useRef,
} from 'react'

import Gantt from 'frappe-gantt'

export function SchedulePage() {
  const ganttRef =
    useRef<HTMLDivElement>(
      null,
    )

  useEffect(() => {
    if (!ganttRef.current) {
      return
    }

    ganttRef.current.innerHTML =
      ''

    new Gantt(
      ganttRef.current,
      [
        {
          id: '1',

          name:
            'Foundation',

          start:
            '2026-05-01',

          end:
            '2026-05-10',

          progress: 100,
        },

        {
          id: '2',

          name:
            'Steel Structure',

          start:
            '2026-05-11',

          end:
            '2026-05-25',

          progress: 60,
        },

        {
          id: '3',

          name:
            'Roof Installation',

          start:
            '2026-05-26',

          end:
            '2026-06-05',

          progress: 20,
        },
      ],
      {
        view_mode:
          'Day',
      },
    )
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Construction Schedule
      </h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-auto">
        <div ref={ganttRef} />
      </div>
    </div>
  )
}