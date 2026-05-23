import {
  useEffect,
  useState,
} from 'react'

import {
  UserPlus,
  Trash2,
  ShieldCheck,
  Phone,
  Hammer,
  Users,
  Loader2,
} from 'lucide-react'

import { api } from '../../lib/api'

interface Worker {
  id: string
  employeeCode: string
  fullName: string
  position: string
  team: string
  phone: string
  skill: string
  status?: string
}

export function WorkersPage() {
  const [workers,
    setWorkers] =
    useState<Worker[]>([])

  const [isLoading,
    setIsLoading] =
    useState(true)

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
    try {
      setIsLoading(true)

      const response =
        await api.get(
          '/workers',
        )

      setWorkers(
        response.data,
      )
    } catch (error) {
      console.error(
        'Failed to load workers:',
        error,
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function createWorker() {
    try {
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

      await loadData()
    } catch (error) {
      console.error(
        'Failed to create worker:',
        error,
      )
    }
  }

  async function removeWorker(
    id: string,
  ) {
    if (
      !confirm(
        'Are you sure you want to remove this worker?',
      )
    ) {
      return
    }

    try {
      await api.delete(
        `/workers/${id}`,
      )

      await loadData()
    } catch (error) {
      console.error(
        'Failed to remove worker:',
        error,
      )
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
          <Users className="w-8 h-8 text-cyan-500" />

          Workforce Management
        </h1>

        <div className="text-zinc-400 font-mono text-sm">
          TOTAL: {workers.length} PERSONNEL
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-500" />

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
              className="
                w-full
                bg-zinc-800
                rounded-xl
                px-4
                py-3
                outline-none
              "
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
              className="
                w-full
                bg-zinc-800
                rounded-xl
                px-4
                py-3
                outline-none
              "
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
              className="
                w-full
                bg-zinc-800
                rounded-xl
                px-4
                py-3
                outline-none
              "
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
              className="
                w-full
                bg-zinc-800
                rounded-xl
                px-4
                py-3
                outline-none
              "
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
              className="
                w-full
                bg-zinc-800
                rounded-xl
                px-4
                py-3
                outline-none
              "
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
              className="
                w-full
                bg-zinc-800
                rounded-xl
                px-4
                py-3
                outline-none
              "
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
                transition-colors
              "
            >
              Save Worker
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            workers.map(
              (worker) => (
                <div
                  key={
                    worker.id
                  }
                  className="
                    bg-zinc-900
                    border
                    border-zinc-800
                    rounded-2xl
                    p-6
                    hover:border-zinc-700
                    transition-all
                  "
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xl font-bold">
                        {
                          worker.fullName
                        }
                      </p>

                      <p className="text-zinc-400 mt-1 font-mono text-sm">
                        {
                          worker.employeeCode
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />

                      {
                        worker.status ||
                        'Active'
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-1">
                      <p className="text-zinc-500 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />

                        Position
                      </p>

                      <p className="font-semibold">
                        {
                          worker.position
                        }
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-zinc-500 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />

                        Team
                      </p>

                      <p className="font-semibold">
                        {
                          worker.team
                        }
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-zinc-500 text-xs flex items-center gap-1">
                        <Hammer className="w-3 h-3" />

                        Skill
                      </p>

                      <p className="font-semibold">
                        {
                          worker.skill
                        }
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-zinc-500 text-xs flex items-center gap-1">
                        <Phone className="w-3 h-3" />

                        Phone
                      </p>

                      <p className="font-semibold">
                        {
                          worker.phone
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
                    <button
                      onClick={() =>
                        removeWorker(
                          worker.id,
                        )
                      }
                      className="
                        text-red-400
                        hover:text-red-300
                        flex
                        items-center
                        gap-2
                        text-sm
                        font-medium
                        transition-colors
                      "
                    >
                      <Trash2 className="w-4 h-4" />

                      Delete Record
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  )
}