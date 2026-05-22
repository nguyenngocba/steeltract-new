import {
  useEffect,
  useState,
} from 'react'
import { useForm } from 'react-hook-form' // Ví dụ sử dụng react-hook-form
import { toast } from 'react-hot-toast' // Để hiển thị thông báo

import { api } from '../../lib/api'

// Định nghĩa interface cho Worker (cần được định nghĩa rõ ràng hơn dựa trên API)
interface Worker {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string;
  team: string;
  phone: string;
  skill: string;
  status: string;
}

export function WorkersPage() {
  const [workers,
    setWorkers] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      employeeCode: '',
      fullName: '',
      position: '',
      team: '',
      phone: '',
      skill: '',
    })

  async function loadData() {
    const response =
      await api.get(
        '/workers',
      )

    setWorkers(
      response.data,
    )
  }

  async function createWorker() {
    await api.post(
      '/workers',
      form,
    )

    setForm({
      employeeCode: '',
      fullName: '',
      position: '',
      team: '',
      phone: '',
      skill: '',
    })

    loadData()
  }

  async function removeWorker(
    id: string,
  ) {
    await api.delete(
      `/workers/${id}`,
    )

    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Workforce Management
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Worker
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.employeeCode
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  employeeCode:
                    e.target.value,
                })
              }
              placeholder="Employee Code"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.fullName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  fullName:
                    e.target.value,
                })
              }
              placeholder="Full Name"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.position
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  position:
                    e.target.value,
                })
              }
              placeholder="Position"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.team
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  team:
                    e.target.value,
                })
              }
              placeholder="Team"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.phone
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  phone:
                    e.target.value,
                })
              }
              placeholder="Phone"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.skill
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  skill:
                    e.target.value,
                })
              }
              placeholder="Skill"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <button
              onClick={
                createWorker
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
              Save Worker
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {workers.map(
            (worker) => (
              <div
                key={
                  worker.id
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
                        worker.fullName
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        worker.employeeCode
                      }
                    </p>
                  </div>

                  <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl px-4 py-2">
                    {
                      worker.status
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-zinc-400 text-sm">
                      Position
                    </p>

                    <p className="font-semibold">
                      {
                        worker.position
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Team
                    </p>

                    <p className="font-semibold">
                      {
                        worker.team
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Skill
                    </p>

                    <p className="font-semibold">
                      {
                        worker.skill
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">
                      Phone
                    </p>

                    <p className="font-semibold">
                      {
                        worker.phone
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    removeWorker(
                      worker.id,
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