import {
  Activity,
  Database,
  Edit3,
  Gauge,
  Plus,
  Power,
  Search,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import type {
  ReactNode,
} from 'react'
import toast from 'react-hot-toast'

import {
  DataTable,
  PageLayout,
  StatusBadge,
} from '../../../../components/ui-system'
import {
  UomFormDrawer,
} from '../components/UomFormDrawer'
import {
  useCreateUomMutation,
  useDeactivateUomMutation,
  useUomQuery,
  useUpdateUomMutation,
} from '../hooks/useUomQueries'

import type {
  MasterUnit,
  SaveUomPayload,
  UomCategory,
} from '../types/uom.types'

const categoryFilters: Array<UomCategory | 'all'> = [
  'all',
  'weight',
  'length',
  'quantity',
  'area',
  'volume',
]

function formatDate(value?: string) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function UomWorkspace() {
  const [search, setSearch] = useState('')
  const [category, setCategory] =
    useState<UomCategory | 'all'>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingUnit, setEditingUnit] =
    useState<MasterUnit | null>(null)

  const query = useUomQuery({
    search,
    category: category === 'all' ? undefined : category,
    active: showInactive ? undefined : true,
  })
  const createMutation = useCreateUomMutation()
  const updateMutation = useUpdateUomMutation()
  const deactivateMutation = useDeactivateUomMutation()
  const units = query.data ?? []

  const metrics = useMemo(() => {
    const active = units.filter((unit) => unit.active).length
    const conversionReady = units.filter(
      (unit) => unit.baseUnitId && unit.conversionFactor,
    ).length
    const categories = new Set(
      units.map((unit) => unit.category),
    ).size

    return {
      active,
      conversionReady,
      categories,
      inactive: units.length - active,
    }
  }, [units])

  async function saveUnit(payload: SaveUomPayload) {
    try {
      if (editingUnit) {
        await updateMutation.mutateAsync({
          id: editingUnit.id,
          payload,
        })
        toast.success('UOM updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('UOM created')
      }

      setDrawerOpen(false)
      setEditingUnit(null)
    } catch {
      toast.error('Failed to save UOM')
    }
  }

  async function deactivate(unit: MasterUnit) {
    try {
      await deactivateMutation.mutateAsync(unit.id)
      toast.success(`${unit.code} deactivated`)
    } catch {
      toast.error('Failed to deactivate UOM')
    }
  }

  function edit(unit: MasterUnit) {
    setEditingUnit(unit)
    setDrawerOpen(true)
  }

  return (
    <PageLayout
      title="UOM Operating Workspace"
      description="Central unit master data for receiving, issuing, transfers, returns, QC, production consumption, reporting normalization and warehouse analytics."
      actions={
        <button
          type="button"
          onClick={() => {
            setEditingUnit(null)
            setDrawerOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New UOM
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            <MetricTile
              icon={<Database className="h-4 w-4" />}
              label="Active units"
              value={metrics.active}
            />
            <MetricTile
              icon={<Gauge className="h-4 w-4" />}
              label="Conversion-ready"
              value={metrics.conversionReady}
            />
            <MetricTile
              icon={<Activity className="h-4 w-4" />}
              label="Categories"
              value={metrics.categories}
            />
            <MetricTile
              icon={<Power className="h-4 w-4" />}
              label="Inactive"
              value={metrics.inactive}
            />
          </section>

          <section className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search code, name or symbol"
                  className="w-full rounded-lg border border-cyan-500/10 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCategory(filter)}
                    className={
                      filter === category
                        ? 'rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-zinc-950'
                        : 'rounded-lg border border-cyan-500/10 px-3 py-2 text-xs text-zinc-300 hover:border-cyan-400/50'
                    }
                  >
                    {filter}
                  </button>
                ))}
                <label className="flex items-center gap-2 rounded-lg border border-cyan-500/10 px-3 py-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(event) =>
                      setShowInactive(event.target.checked)
                    }
                  />
                  inactive
                </label>
              </div>
            </div>
          </section>

          <DataTable
            data={units}
            loading={query.isLoading}
            rowKey={(unit) => unit.id}
            density="compact"
            empty="No unit master data found"
            statusTone={(unit) =>
              unit.active ? 'success' : 'neutral'
            }
            rowActions={(unit) => (
              <>
                <button
                  type="button"
                  onClick={() => edit(unit)}
                  className="rounded-md border border-cyan-500/10 p-1.5 text-zinc-300 hover:border-cyan-400/50 hover:text-white"
                  aria-label={`Edit ${unit.code}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                {unit.active ? (
                  <button
                    type="button"
                    onClick={() => deactivate(unit)}
                    className="rounded-md border border-red-500/20 p-1.5 text-red-300 hover:border-red-400/60 hover:text-red-100"
                    aria-label={`Deactivate ${unit.code}`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                ) : null}
              </>
            )}
            columns={[
              {
                key: 'code',
                header: 'Unit',
                width: '180px',
                render: (unit) => (
                  <div>
                    <p className="font-semibold text-white">
                      {unit.code}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {unit.name}
                    </p>
                  </div>
                ),
              },
              {
                key: 'symbol',
                header: 'Symbol',
                render: (unit) => unit.symbol,
              },
              {
                key: 'category',
                header: 'Category',
                render: (unit) => (
                  <span className="rounded-md bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                    {unit.category}
                  </span>
                ),
              },
              {
                key: 'precision',
                header: 'Precision',
                align: 'right',
                render: (unit) => unit.precision,
              },
              {
                key: 'conversion',
                header: 'Conversion',
                render: (unit) =>
                  unit.baseUnit ? (
                    <span className="text-zinc-300">
                      1 {unit.code} ={' '}
                      {unit.conversionFactor ?? '-'}{' '}
                      {unit.baseUnit.code}
                    </span>
                  ) : (
                    <span className="text-zinc-500">
                      base unit
                    </span>
                  ),
              },
              {
                key: 'usage',
                header: 'Inventory links',
                align: 'right',
                render: (unit) =>
                  unit._count?.inventoryItems ?? 0,
              },
              {
                key: 'active',
                header: 'State',
                render: (unit) => (
                  <StatusBadge
                    tone={unit.active ? 'success' : 'neutral'}
                  >
                    {unit.active ? 'active' : 'inactive'}
                  </StatusBadge>
                ),
              },
              {
                key: 'audit',
                header: 'Audit',
                render: (unit) => (
                  <div className="text-xs text-zinc-400">
                    <p>{formatDate(unit.updatedAt)}</p>
                    <p className="text-zinc-600">
                      {unit.updatedBy ?? unit.createdBy ?? 'system'}
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </main>

        <aside className="space-y-4">
          <section className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              warehouse intelligence
            </p>
            <h2 className="mt-2 text-base font-semibold text-white">
              Unit normalization readiness
            </h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <InsightLine
                label="Weight chain"
                value="TON -> KG"
              />
              <InsightLine
                label="Length chain"
                value="MM -> M"
              />
              <InsightLine
                label="Inventory consumers"
                value={`${units.reduce(
                  (total, unit) =>
                    total +
                    (unit._count?.inventoryItems ?? 0),
                  0,
                )} linked items`}
              />
              <InsightLine
                label="Future workflows"
                value="returns, reservation, QC, production"
              />
            </div>
          </section>

          <section className="rounded-xl border border-cyan-500/10 bg-zinc-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              audit surface
            </p>
            <div className="mt-3 space-y-3">
              {units.slice(0, 5).map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">
                      {unit.code}
                    </p>
                    <span className="text-xs text-zinc-500">
                      {formatDate(unit.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {unit.active
                      ? 'available to operations'
                      : 'blocked from operational entry'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <UomFormDrawer
        open={drawerOpen}
        units={units}
        editingUnit={editingUnit}
        saving={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onClose={() => {
          setDrawerOpen(false)
          setEditingUnit(null)
        }}
        onSubmit={saveUnit}
      />
    </PageLayout>
  )
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs uppercase tracking-[0.16em]">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

function InsightLine({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-cyan-500/10 pb-2">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-100">{value}</span>
    </div>
  )
}
