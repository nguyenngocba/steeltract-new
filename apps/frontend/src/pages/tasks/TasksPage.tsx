import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'

export function TasksPage() {
  const [tasks,
    setTasks] =
    useState<any[]>([])

  async function loadData() {
    const response =
      await api.get('/tasks')

    setTasks(
      response.data,
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  const grouped = {
    PENDING:
      tasks.filter(
        (t) =>
          t.status ===
          'PENDING',
      ),

    IN_PROGRESS:
      tasks.filter(
        (t) =>
          t.status ===
          'IN_PROGRESS',
      ),

    DONE:
      tasks.filter(
        (t) =>
          t.status ===
          'DONE',
      ),
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Task Board
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(
          grouped,
        ).map(
          ([status, items]) => (
            <div
              key={status}
              className="
                bg-zinc-900
                border border-zinc-800
                rounded-2xl
                p-6
              "
            >
              <h2 className="text-xl font-semibold mb-6">
                {status}
              </h2>

              <div className="space-y-4">
                {items.map(
                  (task) => (
                    <div
                      key={
                        task.id
                      }
                      className="
                        bg-zinc-800
                        rounded-xl
                        p-4
                      "
                    >
                      <p className="font-semibold">
                        {
                          task.title
                        }
                      </p>

                      <p className="text-sm text-zinc-400 mt-2">
                        {
                          task.description
                        }
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-cyan-400">
                          {
                            task.priority
                          }
                        </p>

                        <p className="text-xs text-zinc-500">
                          {
                            task.component
                              ?.code
                          }
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
