import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function SiteLogsPage() {
  const [logs,
    setLogs] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      title: '',
      description: '',
      weather: '',
      createdBy: '',
    })

  async function loadData() {
    const response =
      await api.get(
        '/site-logs',
      )

    setLogs(
      response.data,
    )
  }

  async function createLog() {
    await api.post(
      '/site-logs',
      form,
    )

    setForm({
      title: '',
      description: '',
      weather: '',
      createdBy: '',
    })

    loadData()
  }

  async function removeLog(
    id: string,
  ) {
    await api.delete(
      `/site-logs/${id}`,
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Daily Site Logs
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Site Log
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
              placeholder="Title"
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
              rows={6}
              placeholder="Description"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.weather
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  weather:
                    e.target.value,
                })
              }
              placeholder="Weather"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.createdBy
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  createdBy:
                    e.target.value,
                })
              }
              placeholder="Created By"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <button
              onClick={
                createLog
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
              Save Site Log
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {logs.map(
            (log) => (
              <div
                key={
                  log.id
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
                        log.title
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        log.weather
                      }
                    </p>
                  </div>

                  <div className="text-sm text-zinc-500">
                    {new Date(
                      log.createdAt,
                    ).toLocaleDateString()}
                  </div>
                </div>

                <p className="mt-6 text-zinc-300 whitespace-pre-wrap">
                  {
                    log.description
                  }
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-zinc-500 text-sm">
                    By:
                    {' '}
                    {
                      log.createdBy
                    }
                  </p>

                  <button
                    onClick={() =>
                      removeLog(
                        log.id,
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
