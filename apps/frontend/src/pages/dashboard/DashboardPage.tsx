import {
  useEffect,
  useState,
} from 'react'

import {
  Boxes,
  FolderKanban,
  Layers3,
  ArrowLeftRight,
  AlertTriangle,
} from 'lucide-react'

import toast from 'react-hot-toast'

import { api } from '../../lib/api'

import { socket } from '../../lib/socket'

import { KpiCard } from '../../components/ui'

import { useNotificationStore } from '../../store/notification.store'

interface DashboardStats {
  inventoryCount: number
  projectCount: number
  componentCount: number
  transactionCount: number
  lowStockCount: number
}

export function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>({
      inventoryCount: 0,
      projectCount: 0,
      componentCount: 0,
      transactionCount: 0,
      lowStockCount: 0,
    })

  const [
    recentTransactions,
    setRecentTransactions,
  ] = useState<any[]>([])

  const [
    lowStockItems,
    setLowStockItems,
  ] = useState<any[]>([])

  const [
    activities,
    setActivities,
  ] = useState<any[]>([])

  const [construction,
    setConstruction] =
    useState<any>(null)

  const addNotification =
    useNotificationStore(
      (state) =>
        state.addNotification,
    )

  async function loadStats() {
    try {
      const [
        statsResponse,
        transactionsResponse,
        lowStockResponse,
      ] = await Promise.all([
        api.get('/dashboard/stats'),

        api.get(
          '/dashboard/recent-transactions',
        ),

        api.get(
          '/dashboard/low-stock',
        ),
      ])

      setStats(
        statsResponse.data,
      )

      setRecentTransactions(
        transactionsResponse.data,
      )

      setLowStockItems(
        lowStockResponse.data,
      )

      // Optional APIs
      try {
        const activitiesResponse =
          await api.get(
            '/dashboard/activities',
          )

        setActivities(
          activitiesResponse.data,
        )
      } catch {}

      try {
        const constructionResponse =
          await api.get(
            '/dashboard/construction-progress',
          )

        setConstruction(
          constructionResponse.data,
        )
      } catch {}

    } catch {
      toast.error(
        'Failed to load dashboard',
      )
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    function handleUpdate() {
      loadStats()

      toast.success(
        'Realtime update',
      )

      addNotification(
        'Component updated',
      )
    }

    socket.on(
      'component.updated',
      handleUpdate,
    )

    return () => {
      socket.off(
        'component.updated',
        handleUpdate,
      )
    }
  }, [addNotification])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        ERP Dashboard
      </h1>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <KpiCard
          title="Inventory"
          value={String(
            stats.inventoryCount,
          )}
          icon={<Boxes size={22} />}
        />

        <KpiCard
          title="Projects"
          value={String(
            stats.projectCount,
          )}
          icon={
            <FolderKanban
              size={22}
            />
          }
        />

        <KpiCard
          title="Components"
          value={String(
            stats.componentCount,
          )}
          icon={<Layers3 size={22} />}
        />

        <KpiCard
          title="Transactions"
          value={String(
            stats.transactionCount,
          )}
          icon={
            <ArrowLeftRight
              size={22}
            />
          }
        />

        <KpiCard
          title="Low Stock"
          value={String(
            stats.lowStockCount,
          )}
          icon={
            <AlertTriangle
              size={22}
            />
          }
        />
      </div>

      {/* Construction */}
      {construction && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Construction Progress
              </h2>

              <p className="text-zinc-400 mt-1">
                Installed components progress
              </p>
            </div>

            <div className="text-5xl font-bold text-cyan-400">
              {construction.progress}%
            </div>
          </div>

          <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="
                h-full
                bg-cyan-500
                transition-all
              "
              style={{
                width:
                  `${construction.progress}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400 text-sm">
                Total
              </p>

              <p className="text-2xl font-bold mt-1">
                {construction.total}
              </p>
            </div>

            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm">
                Installed
              </p>

              <p className="text-2xl font-bold mt-1">
                {
                  construction.installed
                }
              </p>
            </div>

            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-purple-400 text-sm">
                Delivered
              </p>

              <p className="text-2xl font-bold mt-1">
                {
                  construction.delivered
                }
              </p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-400 text-sm">
                Stock
              </p>

              <p className="text-2xl font-bold mt-1">
                {construction.stock}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Recent Transactions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Recent Transactions
          </h2>

          <div className="space-y-4">
            {recentTransactions.map(
              (transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-zinc-800 pb-3"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.code}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {
                        transaction.items?.[0]
                          ?.inventoryItem
                          ?.name
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-cyan-400 font-medium">
                      {transaction.type}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {
                        transaction.items?.[0]
                          ?.quantity
                      }
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Low Stock Items
          </h2>

          <div className="space-y-4">
            {lowStockItems.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-zinc-800 pb-3"
                >
                  <div>
                    <p className="font-medium">
                      {item.name}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {item.code}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-red-400 font-medium">
                      {item.quantity}
                    </p>

                    <p className="text-sm text-zinc-400">
                      Min:{' '}
                      {
                        item.minimumStock
                      }
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">
          Recent Activity
        </h2>

        <div className="space-y-4">
          {activities?.map(
            (activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-zinc-800 pb-3"
              >
                <div>
                  <p className="font-medium">
                    {activity.action}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {activity.entity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-500">
                    {new Date(
                      activity.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}