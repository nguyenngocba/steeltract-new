import {
  useEffect,
  useState,
} from 'react'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import {
  useParams,
} from 'react-router-dom'

import {
  ComponentStatusBadge,
} from '../../components/ui'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ExecutionCalendar } from './ExecutionCalendar'
import toast from 'react-hot-toast'

export function ProjectDetailPage() {
  const { id } = useParams()

  const [project,
    setProject] =
    useState<any>(null)

  const [components,
    setComponents] =
    useState<any[]>([])

  const [activities,
    setActivities] =
    useState<any[]>([])

  const [chartData,
    setChartData] =
    useState<any[]>([])

  const [kpis,
    setKpis] =
    useState<any>(null)

  async function loadData() {
    const [
      projectResponse,
      componentsResponse,
      activitiesResponse,
      chartResponse,
      kpisResponse,
    ] = await Promise.all([
      api.get(
        `/projects/${id}`,
      ),

      api.get(
        `/projects/${id}/components`,
      ),

      api.get(
        `/projects/${id}/activity`,
      ),

      api.get(
       `/projects/${id}/progress-chart`,
      ),

      api.get(
        `/projects/${id}/kpis`,
      ),
    ])

    setProject(
      projectResponse.data,
    )

    setComponents(
      componentsResponse.data,
    )

    setActivities(
      activitiesResponse.data,
    )

    setChartData(
      chartResponse.data,
    )
    setKpis(
      kpisResponse.data,
    )
  }

  async function installComponent(
    componentId: string,
  ) {
    try {
      await api.patch(
        `/components/${componentId}`,
        {
          status: 'INSTALLED',
        },
      )

      toast.success(
        'Component installed',
      )

      await loadData()
    } catch {
      toast.error(
        'Install failed',
      )
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (!project) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  const installed =
    components.filter(
      (item) =>
        item.status ===
        'INSTALLED',
    ).length

  const progress =
    components.length > 0
      ? Math.round(
          (installed /
            components.length) *
            100,
        )
      : 0

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            {project.name}
          </h1>

          <p className="text-zinc-400 mt-2">
            {project.code}
          </p>
        </div>

        <div className="text-right">
          <p className="text-zinc-400 text-sm">
            Progress
          </p>

          <p className="text-5xl font-bold text-cyan-400">
            {progress}%
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden mb-8">
        <div
          className="
            h-full
            bg-cyan-500
          "
          style={{
            width:
              `${progress}%`,
          }}
        />
      </div>
        <Link
          to={`/projects/${id}/floor-map`}
          className="
            inline-flex
            items-center
            gap-2
            bg-cyan-500
            hover:bg-cyan-600
            px-5 py-3
            rounded-xl
            font-semibold
            mb-8
          "
        >
          Open Visual Floor Map
        </Link>
        {kpis && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400 text-sm">
                Total
              </p>

              <p className="text-2xl font-bold mt-1">
                {kpis.total}
              </p>
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm">
                Installed
              </p>

              <p className="text-2xl font-bold mt-1">
                {kpis.installed}
              </p>
            </div>

            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-purple-400 text-sm">
                Delivered
              </p>

              <p className="text-2xl font-bold mt-1">
                {kpis.delivered}
              </p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-400 text-sm">
                Stock
              </p>

              <p className="text-2xl font-bold mt-1">
                {kpis.stock}
              </p>
            </div>

            <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-cyan-400 text-sm">
                Installed Today
              </p>

              <p className="text-2xl font-bold mt-1">
                {
                  kpis.installedToday
                }
              </p>
            </div>
          </div>
        )}
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">
            Total
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              components.length
            }
          </p>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400 text-sm">
            Installed
          </p>

          <p className="text-2xl font-bold mt-1">
            {installed}
          </p>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-400 text-sm">
            Delivered
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              components.filter(
                (item) =>
                  item.status ===
                  'DELIVERED',
              ).length
            }
          </p>
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            Stock
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              components.filter(
                (item) =>
                  item.status ===
                  'STOCK',
              ).length
            }
          </p>
        </div>
      </div>

        {/* Installation Timeline */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            Installation Timeline
          </h2>
            <ExecutionCalendar
              activities={activities}
            />
          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="installed"
                  stroke="#06b6d4"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            Live Activity Feed
          </h2>

          <div className="space-y-4">
            {activities.map((item) => (
              <div
                key={item.id}
                className="
                  flex
                  items-center
                  justify-between
                  border-b border-zinc-800
                  pb-4
                "
              >
                <div>
                  <p className="font-semibold text-cyan-400">
                    {
                      item.component
                        ?.code
                    }
                  </p>

                  <p className="text-sm text-zinc-400 mt-1">
                    {item.action}
                  </p>
                </div>

                <p className="text-xs text-zinc-500">
                  {new Date(
                    item.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      {/* Component List */}
      <div
        className="
          bg-zinc-900
          border border-zinc-800
          rounded-2xl
          overflow-x-auto
        "
      >
        <table className="min-w-[900px] w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left p-4">
                Code
              </th>

              <th className="text-left p-4">
                Name
              </th>

              <th className="text-left p-4">
                Floor
              </th>

              <th className="text-left p-4">
                Zone
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-left p-4">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {components.map(
              (component) => (
                <tr
                  key={
                    component.id
                  }
                  className="border-b border-zinc-800"
                >
                  <td className="p-4">
                    {
                      component.code
                    }
                  </td>

                  <td className="p-4">
                    {
                      component.name
                    }
                  </td>

                  <td className="p-4">
                    {
                      component.floor
                    }
                  </td>

                  <td className="p-4">
                    {
                      component.zone
                    }
                  </td>

                  <td className="p-4">
                    <ComponentStatusBadge
                      status={
                        component.status
                      }
                    />
                  </td>

                  <td className="p-4">
                    {component.status !==
                    'INSTALLED' ? (
                      <button
                        onClick={() =>
                          installComponent(
                            component.id,
                          )
                        }
                        className="
                          bg-green-500
                          hover:bg-green-600
                          px-4 py-2
                          rounded-lg
                          text-sm
                          font-semibold
                        "
                      >
                        Install
                      </button>
                    ) : (
                      <div
                        className="
                          text-green-400
                          text-sm
                          font-semibold
                        "
                      >
                        Completed
                      </div>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
