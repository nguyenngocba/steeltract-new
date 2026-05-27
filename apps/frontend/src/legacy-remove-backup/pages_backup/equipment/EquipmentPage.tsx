import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function EquipmentPage() {
  const [bookings,
    setBookings] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      equipmentName: '',
      projectName: '',
      assignedTo: '',
      startDate: '',
      endDate: '',
    })

  async function loadData() {
    const response =
      await api.get(
        '/equipment',
      )

    setBookings(
      response.data,
    )
  }

  async function createBooking() {
    await api.post(
      '/equipment',
      form,
    )

    setForm({
      equipmentName: '',
      projectName: '',
      assignedTo: '',
      startDate: '',
      endDate: '',
    })

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Equipment Booking
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Booking
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.equipmentName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  equipmentName:
                    e.target.value,
                })
              }
              placeholder="Equipment"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.projectName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  projectName:
                    e.target.value,
                })
              }
              placeholder="Project"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.assignedTo
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  assignedTo:
                    e.target.value,
                })
              }
              placeholder="Assigned To"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              type="date"
              value={
                form.startDate
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  startDate:
                    e.target.value,
                })
              }
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              type="date"
              value={
                form.endDate
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  endDate:
                    e.target.value,
                })
              }
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <button
              onClick={
                createBooking
              }
              className="
                w-full
                bg-cyan-500
                hover:bg-cyan-600
                rounded-xl
                py-3
                font-semibold
              "
            >
              Save Booking
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {bookings.map(
            (booking) => (
              <div
                key={
                  booking.id
                }
                className="
                  bg-zinc-900
                  border border-zinc-800
                  rounded-2xl
                  p-6
                "
              >
                <p className="text-xl font-bold">
                  {
                    booking.equipmentName
                  }
                </p>

                <p className="text-zinc-400 mt-2">
                  {
                    booking.projectName
                  }
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-zinc-400 text-sm">
                      Assigned
                    </p>

                    <p className="font-semibold">
                      {
                        booking.assignedTo
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Schedule
                    </p>

                    <p className="font-semibold">
                      {new Date(
                        booking.startDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
