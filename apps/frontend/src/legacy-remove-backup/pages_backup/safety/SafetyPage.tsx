import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function SafetyPage() {
  const [inspections,
    setInspections] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      title: '',
      location: '',
      inspector: '',
      note: '',
      score: 0,
    })

  async function loadData() {
    const response =
      await api.get(
        '/safety',
      )

    setInspections(
      response.data,
    )
  }

  async function createInspection() {
    await api.post(
      '/safety',
      form,
    )

    setForm({
      title: '',
      location: '',
      inspector: '',
      note: '',
      score: 0,
    })

    loadData()
  }

  async function removeInspection(
    id: string,
  ) {
    await api.delete(
      `/safety/${id}`,
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Safety Inspection
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Inspection
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.title
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  title:
                    e.target.value,
                })
              }
              placeholder="Inspection Title"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.location
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  location:
                    e.target.value,
                })
              }
              placeholder="Location"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.inspector
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  inspector:
                    e.target.value,
                })
              }
              placeholder="Inspector"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <textarea
              value={
                form.note
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  note:
                    e.target.value,
                })
              }
              rows={5}
              placeholder="Safety Notes"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              type="number"
              value={
                form.score
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  score:
                    Number(
                      e.target.value,
                    ),
                })
              }
              placeholder="Score"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <button
              onClick={
                createInspection
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
              Save Inspection
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {inspections.map(
            (inspection) => (
              <div
                key={
                  inspection.id
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
                        inspection.title
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        inspection.location
                      }
                    </p>
                  </div>

                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-2">
                    {
                      inspection.score
                    }
                    %
                  </div>
                </div>

                <p className="mt-6 text-zinc-300 whitespace-pre-wrap">
                  {
                    inspection.note
                  }
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-zinc-500 text-sm">
                    Inspector:
                    {' '}
                    {
                      inspection.inspector
                    }
                  </p>

                  <button
                    onClick={() =>
                      removeInspection(
                        inspection.id,
                      )
                    }
                    className="
                      bg-red-500
                      hover:bg-red-600
                      px-4 py-2
                      rounded-xl
                    "
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
