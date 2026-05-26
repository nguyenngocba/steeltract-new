import {
  Database,
  Edit3,
  Plus,
  Power,
  Search,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import {
  Link,
} from 'react-router-dom'

import {
  DataTable,
  PageLayout,
  StatusBadge,
} from '../../../components/ui-system'
import {
  MasterDataRecordDrawer,
} from '../components/MasterDataRecordDrawer'
import {
  useCreateMasterDataMutation,
  useDeactivateMasterDataMutation,
  useMasterDataRecordsQuery,
  useUpdateMasterDataMutation,
} from '../hooks/useMasterDataQueries'
import {
  masterDataDomains,
} from '../services/master-data-domains'

import type {
  MasterDataDomainId,
  MasterDataPayload,
  MasterDataRecord,
} from '../types/master-data.types'

export function MasterDataCenter() {
  const [activeDomain, setActiveDomain] =
    useState<MasterDataDomainId>(
      'material-categories',
    )
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<MasterDataRecord | null>(null)
  const config = masterDataDomains.find(
    (domain) => domain.id === activeDomain,
  )!
  const recordsQuery = useMasterDataRecordsQuery(activeDomain, {
    search,
    active: showInactive ? undefined : true,
  })
  const relationQuery = useMasterDataRecordsQuery(
    config.relation?.domain ?? 'material-categories',
    {
      active: true,
    },
  )
  const createMutation = useCreateMasterDataMutation()
  const updateMutation = useUpdateMasterDataMutation()
  const deactivateMutation =
    useDeactivateMasterDataMutation()
  const records = recordsQuery.data ?? []
  const activeCount = records.filter(
    (record) => record.active,
  ).length
  const relationRecords = config.relation
    ? relationQuery.data ?? []
    : []
  const visibleColumns = useMemo(
    () => [
      {
        key: 'record',
        header: 'Record',
        width: '240px',
        render: (record: MasterDataRecord) => (
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor:
                  record.color ?? '#06b6d4',
              }}
            />
            <div>
              <p className="font-semibold text-white">
                {record.name}
              </p>
              <p className="text-xs text-zinc-500">
                {record.code}
              </p>
            </div>
          </div>
        ),
      },
      ...(config.relation
        ? [
            {
              key: 'relation',
              header: config.relation.label,
              render: (record: MasterDataRecord) =>
                record.category?.name ??
                record.warehouse?.name ??
                '-',
            },
          ]
        : []),
      ...(config.transactionType
        ? [
            {
              key: 'direction',
              header: 'Direction',
              render: (record: MasterDataRecord) =>
                record.direction ?? '-',
            },
            {
              key: 'stock',
              header: 'Stock',
              render: (record: MasterDataRecord) =>
                record.affectsStock
                  ? 'affects stock'
                  : 'non-stock',
            },
            {
              key: 'approval',
              header: 'Approval',
              render: (record: MasterDataRecord) =>
                record.requiresApproval
                  ? 'required'
                  : 'not required',
            },
          ]
        : []),
      ...(config.sortable
        ? [
            {
              key: 'sort',
              header: 'Order',
              align: 'right' as const,
              render: (record: MasterDataRecord) =>
                record.sortOrder ?? 0,
            },
          ]
        : []),
      {
        key: 'usage',
        header: 'Links',
        align: 'right' as const,
        render: (record: MasterDataRecord) =>
          Object.values(record._count ?? {}).reduce(
            (total, value) => total + value,
            0,
          ),
      },
      {
        key: 'state',
        header: 'State',
        render: (record: MasterDataRecord) => (
          <StatusBadge
            tone={record.active ? 'success' : 'neutral'}
          >
            {record.active ? 'active' : 'inactive'}
          </StatusBadge>
        ),
      },
      {
        key: 'audit',
        header: 'Audit',
        render: (record: MasterDataRecord) => (
          <div className="text-xs text-zinc-400">
            <p>
              {new Date(
                record.updatedAt,
              ).toLocaleDateString()}
            </p>
            <p className="text-zinc-600">
              {record.updatedBy ??
                record.createdBy ??
                'system'}
            </p>
          </div>
        ),
      },
    ],
    [config],
  )

  async function saveRecord(payload: MasterDataPayload) {
    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({
          domain: activeDomain,
          id: editingRecord.id,
          payload,
        })
        toast.success('Master data updated')
      } else {
        await createMutation.mutateAsync({
          domain: activeDomain,
          payload,
        })
        toast.success('Master data created')
      }

      setDrawerOpen(false)
      setEditingRecord(null)
    } catch {
      toast.error('Failed to save master data')
    }
  }

  async function deactivate(record: MasterDataRecord) {
    try {
      await deactivateMutation.mutateAsync({
        domain: activeDomain,
        id: record.id,
      })
      toast.success(`${record.code} deactivated`)
    } catch {
      toast.error('Failed to deactivate master data')
    }
  }

  return (
    <PageLayout
      title="Master Data Center"
      description="ERP operational business dictionary for inventory, warehouse, production, QC, procurement, yard, projects, analytics and realtime workspaces."
      actions={
        <button
          type="button"
          onClick={() => {
            setEditingRecord(null)
            setDrawerOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Record
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-2">
          <Link
            to="/master-data/uom"
            className="mb-2 block rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-3 text-left text-sm text-cyan-100 hover:border-cyan-400/60"
          >
            <span className="block font-medium">
              Units of Measure
            </span>
            <span className="mt-1 block text-xs text-zinc-500">
              uom
            </span>
          </Link>
          {masterDataDomains.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => {
                setActiveDomain(domain.id)
                setSearch('')
                setEditingRecord(null)
              }}
              className={
                domain.id === activeDomain
                  ? 'mb-1 w-full rounded-lg bg-cyan-500/15 px-3 py-3 text-left text-sm text-cyan-100'
                  : 'mb-1 w-full rounded-lg px-3 py-3 text-left text-sm text-zinc-400 hover:bg-cyan-500/10 hover:text-zinc-100'
              }
            >
              <span className="block font-medium">
                {domain.label}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {domain.id}
              </span>
            </button>
          ))}
        </aside>

        <main className="space-y-4">
          <section className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  active domain
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {config.label}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                  {config.description}
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-cyan-500/10 px-3 py-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) =>
                    setShowInactive(event.target.checked)
                  }
                />
                include inactive
              </label>
            </div>
          </section>

          <section className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search code, name or description"
              className="w-full rounded-lg border border-cyan-500/10 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-400"
            />
          </section>

          <DataTable
            data={records}
            loading={recordsQuery.isLoading}
            rowKey={(record) => record.id}
            density="compact"
            empty="No master data records found"
            statusTone={(record) =>
              record.active ? 'success' : 'neutral'
            }
            rowActions={(record) => (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(record)
                    setDrawerOpen(true)
                  }}
                  className="rounded-md border border-cyan-500/10 p-1.5 text-zinc-300 hover:border-cyan-400/50 hover:text-white"
                  aria-label={`Edit ${record.code}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                {record.active ? (
                  <button
                    type="button"
                    onClick={() => deactivate(record)}
                    className="rounded-md border border-red-500/20 p-1.5 text-red-300 hover:border-red-400/60 hover:text-red-100"
                    aria-label={`Deactivate ${record.code}`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                ) : null}
              </>
            )}
            columns={visibleColumns}
          />
        </main>

        <aside className="space-y-4">
          <section className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs uppercase tracking-[0.18em]">
                dictionary telemetry
              </span>
              <Database className="h-4 w-4" />
            </div>
            <div className="mt-4 grid gap-3">
              <Insight
                label="Active records"
                value={activeCount}
              />
              <Insight
                label="Inactive records"
                value={records.length - activeCount}
              />
              <Insight
                label="Domains online"
                value={masterDataDomains.length + 1}
              />
            </div>
          </section>
          <section className="rounded-xl border border-cyan-500/10 bg-zinc-950/50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              downstream consumers
            </p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>Inventory item setup</p>
              <p>Warehouse transaction engine</p>
              <p>QC workflow status mapping</p>
              <p>Procurement and supplier analytics</p>
              <p>Realtime operational filters</p>
            </div>
          </section>
        </aside>
      </div>

      <MasterDataRecordDrawer
        open={drawerOpen}
        config={config}
        editingRecord={editingRecord}
        relationRecords={relationRecords}
        saving={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onClose={() => {
          setDrawerOpen(false)
          setEditingRecord(null)
        }}
        onSubmit={saveRecord}
      />
    </PageLayout>
  )
}

function Insight({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
      <span className="text-zinc-500">{label}</span>
      <span className="text-lg font-semibold text-white">
        {value}
      </span>
    </div>
  )
}
