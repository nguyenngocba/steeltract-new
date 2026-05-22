import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function ZonesPage() {
  const [zones,
    setZones] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      code: '',
      name: '',
      description: '',
      color: '#06b6d4',
    })

  async function loadData() {
    const response =
      await api.get('/zones')

    setZones(
      response.data,
    )
  }

  async function createZone() {
    await api.post(
      '/zones',
      form,
    )

    setForm({
      code: '',
      name: '',
      description: '',
      color: '#06b6d4',
    })

    loadData()
  }

  async function removeZone(
    id: string,
  ) {
    await api.delete(
      `/zones/${id}`,
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Warehouse Zones
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Zone
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.code
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  code:
                    e.target.value,
                })
              }
              placeholder="Zone Code"
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
              placeholder="Zone Name"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <textarea
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              placeholder="Description"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              type="color"
              value={
                form.color
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  color:
                    e.target.value,
                })
              }
              className="w-full h-14 bg-zinc-800 rounded-xl"
            />

            <button
              onClick={
                createZone
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
              Create Zone
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {zones.map(
            (zone) => (
              <div
                key={
                  zone.id
                }
                className="
                  bg-zinc-900
                  border border-zinc-800
                  rounded-2xl
                  p-6
                "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold">
                      {
                        zone.code
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        zone.name
                      }
                    </p>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl"
                    style={{
                      background:
                        zone.color,
                    }}
                  />
                </div>

                <p className="text-zinc-500 mt-4">
                  {
                    zone.description
                  }
                </p>

                <button
                  onClick={() =>
                    removeZone(
                      zone.id,
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
