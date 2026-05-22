import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function VehiclesPage() {
  const [vehicles,
    setVehicles] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      plateNumber: '',
      name: '',
      type: '',
      driverName: '',
      fuelType: '',
    })

  async function loadData() {
    const response =
      await api.get(
        '/vehicles',
      )

    setVehicles(
      response.data,
    )
  }

  async function createVehicle() {
    await api.post(
      '/vehicles',
      form,
    )

    setForm({
      plateNumber: '',
      name: '',
      type: '',
      driverName: '',
      fuelType: '',
    })

    loadData()
  }

  async function removeVehicle(
    id: string,
  ) {
    await api.delete(
      `/vehicles/${id}`,
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Vehicle Management
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Vehicle
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.plateNumber
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  plateNumber:
                    e.target.value,
                })
              }
              placeholder="Plate Number"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.name
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
              placeholder="Vehicle Name"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.type
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  type:
                    e.target.value,
                })
              }
              placeholder="Type"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.driverName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  driverName:
                    e.target.value,
                })
              }
              placeholder="Driver Name"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.fuelType
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  fuelType:
                    e.target.value,
                })
              }
              placeholder="Fuel Type"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <button
              onClick={
                createVehicle
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
              Save Vehicle
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {vehicles.map(
            (vehicle) => (
              <div
                key={
                  vehicle.id
                }
                className="
                  bg-zinc-900
                  border border-zinc-800
                  rounded-2xl
                  p-6
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-bold">
                      {
                        vehicle.name
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        vehicle.plateNumber
                      }
                    </p>
                  </div>

                  <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl px-4 py-2">
                    {
                      vehicle.status
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-zinc-400 text-sm">
                      Driver
                    </p>

                    <p className="font-semibold">
                      {
                        vehicle.driverName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Fuel
                    </p>

                    <p className="font-semibold">
                      {
                        vehicle.fuelType
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    removeVehicle(
                      vehicle.id,
                    )
                  }
                  className="
                    mt-6
                    bg-red-500
                    hover:bg-red-600
                    px-4 py-2
                    rounded-xl
                  "
                >
                  Delete
                </button>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
