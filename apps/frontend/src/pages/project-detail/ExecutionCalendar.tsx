import Calendar from 'react-calendar'

interface Props {
  activities: any[]
}

export function ExecutionCalendar({
  activities,
}: Props) {
  function getCountByDate(
    date: Date,
  ) {
    const target =
      date
        .toISOString()
        .split('T')[0]

    return activities.filter(
      (item) =>
        item.action ===
          'INSTALLED' &&
        item.createdAt
          .split('T')[0] ===
          target,
    ).length
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-6">
        Execution Calendar
      </h2>

      <Calendar
        tileContent={({
          date,
        }) => {
          const count =
            getCountByDate(
              date,
            )

          if (!count) {
            return null
          }

          return (
            <div className="flex justify-center mt-1">
              <div
                className="
                  bg-cyan-500
                  text-white
                  text-xs
                  rounded-full
                  px-2
                "
              >
                {count}
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
