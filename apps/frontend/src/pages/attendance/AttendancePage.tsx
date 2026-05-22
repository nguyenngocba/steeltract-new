import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function AttendancePage() {
  const [records,
    setRecords] =
    useState<any[]>([])

  const [workerName,
    setWorkerName] =
    useState('')

  async function loadData() {
    const response =
      await api.get(
        '/attendance',
      )

    setRecords(
      response.data,
    )
  }

  async function checkIn() {
    if (!workerName) {
      return
    }

    await api.post(
      '/attendance/check-in',
      {
        workerName,
      },
    )

    setWorkerName('')

    loadData()
  }

  async function checkOut(
    id: string,
  ) {
    await api.patch(
      `/attendance/${id}/check-out`,
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Attendance
      </h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex gap-4">
          <input
            value={workerName}
            onChange={(e) =>
              setWorkerName(
                e.target.value,
              )
            }
            placeholder="Worker Name"
            className="
              flex-1
              bg-zinc-800
              border border-zinc-700
              rounded-xl
              px-4 py-3
            "
          />

          <button
            onClick={checkIn}
            className="
              bg-cyan-500
              hover:bg-cyan-600
              px-6
              rounded-xl
              font-semibold
            "
          >
            Check In
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {records.map((item) => (
          <div
            key={item.id}
            className="
              bg-zinc-900
              border border-zinc-800
              rounded-2xl
              p-6
              flex
              items-center
              justify-between
            "
          >
            <div>
              <p className="font-semibold">
                {item.workerName}
              </p>

              <p className="text-sm text-zinc-400 mt-1">
                Check In:
                {' '}
                {new Date(
                  item.checkIn,
                ).toLocaleString()}
              </p>

              {item.checkOut && (
                <p className="text-sm text-zinc-400 mt-1">
                  Check Out:
                  {' '}
                  {new Date(
                    item.checkOut,
                  ).toLocaleString()}
                </p>
              )}
            </div>

            {!item.checkOut && (
              <button
                onClick={() =>
                  checkOut(
                    item.id,
                  )
                }
                className="
                  bg-red-500
                  hover:bg-red-600
                  px-4 py-2
                  rounded-xl
                "
              >
                Check Out
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
