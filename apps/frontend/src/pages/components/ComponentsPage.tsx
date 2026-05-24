import {
  GitBranch,
  QrCode,
  Route,
  ShieldCheck,
} from 'lucide-react'
import {
  useState,
} from 'react'

import toast from 'react-hot-toast'
import QRCode from 'react-qr-code'

import {
  useComponentsQuery,
  useCreateComponentMutation,
  useUploadComponentImageMutation,
} from '../../hooks/query/useComponentQueries'
import {
  useProjectsQuery,
} from '../../hooks/query/useProjectQueries'
import type {
  ComponentItem,
} from '../../services/api/types'

import {
  Modal,
  Input,
  Select,
  ComponentStatusBadge,
} from '../../components/ui'
import {
  DataTable,
  PageLayout,
  SectionCard,
  StatCard,
  StatusBadge,
  Timeline,
} from '../../components/ui-system'
import {
  ContextualOperationDrawer,
} from '../../modules/operator-actions'
import {
  OperationalWorkspaceHero,
} from '../operations/operations-utils'

export function ComponentsPage() {
  const [openModal,
    setOpenModal] =
    useState(false)
  const [drawerOpen,
    setDrawerOpen] =
    useState(false)
  const [selectedComponent,
    setSelectedComponent] =
    useState<ComponentItem | null>(null)

  const [code, setCode] =
    useState('')

  const [name, setName] =
    useState('')

  const [floor, setFloor] =
    useState('')

  const [zone, setZone] =
    useState('')

  const [position,
    setPosition] =
    useState('')

  const [status,
    setStatus] =
    useState('STOCK')

  const [imageUrl,
    setImageUrl] =
    useState('')

  const [projectId,
    setProjectId] =
    useState('')

  const {
    data: components = [],
  } = useComponentsQuery()

  const {
    data: projects = [],
  } = useProjectsQuery()

  const createComponentMutation =
    useCreateComponentMutation()

  const uploadComponentImageMutation =
    useUploadComponentImageMutation()

  async function uploadImage(
    file: File,
  ) {
    const response =
      await uploadComponentImageMutation.mutateAsync(
        file,
      )

    setImageUrl(
      response.imageUrl,
    )

    toast.success(
      'Image uploaded',
    )
  }

  async function createComponent() {
    try {
      await createComponentMutation.mutateAsync(
        {
          code,
          name,

          floor,

          zone,

          position,

          status,

          projectId,

          imageUrl,
        },
      )

      toast.success(
        'Component created',
      )

      setCode('')
      setName('')
      setFloor('')
      setZone('')
      setPosition('')
      setStatus('STOCK')
      setProjectId('')
      setImageUrl('')

      setOpenModal(false)
    } catch {
      toast.error(
        'Failed to create component',
      )
    }
  }

  const stockComponents = components.filter(
    (component) => component.status === 'STOCK',
  )
  const installedComponents = components.filter(
    (component) => component.status === 'INSTALLED',
  )
  const deliveredComponents = components.filter(
    (component) => component.status === 'DELIVERED',
  )

  return (
    <PageLayout
      title="Component Traceability"
      description="QR identity, project linkage, fabrication stage visibility and genealogy foundation for steel components."
      actions={
        <button
          type="button"
          onClick={() =>
            setOpenModal(true)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600"
        >
          <QrCode className="h-4 w-4" />
          Add Component
        </button>
      }
    >
      <OperationalWorkspaceHero
        eyebrow="fabrication ops / traceability"
        title="Components Traceability Center"
        description="QR identity, project linkage, fabrication state, QC evidence readiness and genealogy visibility for steel components."
        metrics={[
          {
            label: 'Components',
            value: components.length,
            tone: 'info',
          },
          {
            label: 'Stock',
            value: stockComponents.length,
            tone: 'info',
          },
          {
            label: 'Delivered',
            value: deliveredComponents.length,
            tone: 'warning',
          },
          {
            label: 'Installed',
            value: installedComponents.length,
            tone: 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              QR identity
            </StatusBadge>
            <StatusBadge tone="success">
              production linkage
            </StatusBadge>
            <StatusBadge tone="neutral">
              QC evidence
            </StatusBadge>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Components"
          value={components.length}
          icon={<GitBranch className="h-5 w-5" />}
        />
        <StatCard
          label="In stock"
          value={stockComponents.length}
          icon={<Route className="h-5 w-5" />}
        />
        <StatCard
          label="Delivered"
          value={deliveredComponents.length}
          icon={<QrCode className="h-5 w-5" />}
        />
        <StatCard
          label="Installed"
          value={installedComponents.length}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      <SectionCard
        title="Fabrication stage strip"
        description="Component status by fabrication, logistics and installation traceability stages."
      >
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['Stock', stockComponents.length, 'info'],
            ['Fabrication link', components.filter((item) => item.projectId).length, 'success'],
            ['Delivered', deliveredComponents.length, 'warning'],
            ['Installed', installedComponents.length, 'success'],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {label}
                </span>
                <StatusBadge
                  tone={tone as 'info' | 'success' | 'warning'}
                >
                  {value}
                </StatusBadge>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{
                    width: `${Math.min(Number(value) * 10, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard
          title="Component identity table"
          description="QR identity, project link, yard position and traceability status."
        >
          <DataTable
            data={components}
            rowKey={(row) => row.id}
            empty="No components"
            density="compact"
            selectable
            savedViewName="Traceability control"
            statusTone={(row) =>
              row.status === 'INSTALLED'
                ? 'success'
                : row.status === 'DELIVERED'
                  ? 'warning'
                  : 'info'
            }
            rowActions={(row) => (
              <button
                type="button"
                onClick={() => {
                  setSelectedComponent(row)
                  setDrawerOpen(true)
                }}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-cyan-500/40 hover:text-white"
              >
                Trace
              </button>
            )}
            contextMenu={() => (
              <div className="grid gap-1 text-left text-xs text-zinc-300">
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Open QR identity
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Production linkage
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  QC evidence
                </button>
                <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
                  Yard movement history
                </button>
              </div>
            )}
            columns={[
              {
                key: 'component',
                header: 'Component',
                pinned: 'left',
                render: (row) => (
                  <div>
                    <p className="font-medium text-white">{row.code}</p>
                    <p className="text-xs text-zinc-500">{row.name}</p>
                  </div>
                ),
              },
              {
                key: 'project',
                header: 'Project',
                render: (row) => row.project?.name ?? '-',
              },
              {
                key: 'location',
                header: 'Location',
                render: (row) =>
                  [row.floor, row.zone, row.position]
                    .filter(Boolean)
                    .join(' / ') || '-',
              },
              {
                key: 'qr',
                header: 'QR',
                render: (row) => (
                  <div className="w-fit rounded bg-white p-1">
                    <QRCode
                      size={42}
                      value={`${window.location.origin}/components/${row.id}`}
                    />
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <ComponentStatusBadge status={row.status} />
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Genealogy foundation"
          description="Production/QC/yard links are prepared for component-level traceability."
        >
          <Timeline
            items={(selectedComponent ? [selectedComponent] : components.slice(0, 4)).map((component) => ({
              id: component.id,
              title: component.code,
              description: `${component.project?.name ?? 'No project'} / ${component.status}`,
              tone:
                component.status === 'INSTALLED'
                  ? 'success'
                  : component.status === 'DELIVERED'
                    ? 'warning'
                    : 'info',
            }))}
          />
        </SectionCard>
      </div>

      <Modal
        open={openModal}
        title="Create Component"
        onClose={() =>
          setOpenModal(false)
        }
      >
        <div className="space-y-4">
          <Input
            label="Code"
            placeholder="C-001"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
          />

          <Input
            label="Name"
            placeholder="Steel Column"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <Select
            label="Project"
            value={projectId}
            onChange={(e) =>
              setProjectId(
                e.target.value,
              )
            }
            options={projects.map(
              (project) => ({
                label: project.name,
                value: project.id,
              }),
            )}
          />

          <Input
            label="Floor"
            placeholder="Floor 3"
            value={floor}
            onChange={(e) =>
              setFloor(e.target.value)
            }
          />

          <Input
            label="Zone"
            placeholder="Zone A"
            value={zone}
            onChange={(e) =>
              setZone(e.target.value)
            }
          />

          <Input
            label="Position"
            placeholder="A3-C5"
            value={position}
            onChange={(e) =>
              setPosition(
                e.target.value,
              )
            }
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value,
              )
            }
            options={[
              {
                label: 'STOCK',
                value: 'STOCK',
              },

              {
                label: 'INSTALLED',
                value: 'INSTALLED',
              },

              {
                label: 'DELIVERED',
                value: 'DELIVERED',
              },
            ]}
          />

          <input
            type="file"
            onChange={(e) => {
              const file =
                e.target.files?.[0]

              if (file) {
                uploadImage(file)
              }
            }}
            className="
              w-full
              bg-zinc-800
              rounded-xl
              px-4
              py-3
            "
          />

          <button
            onClick={
              createComponent
            }
            className="
              w-full
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-3
            "
          >
            Save Component
          </button>
        </div>
      </Modal>
      <ContextualOperationDrawer
        open={drawerOpen}
        title={
          selectedComponent
            ? `Component ${selectedComponent.code}`
            : 'Component traceability'
        }
        subtitle={
          selectedComponent
            ? `${selectedComponent.name} / ${selectedComponent.status}`
            : 'Select a component to inspect traceability context.'
        }
        domains={['production', 'qc', 'yard']}
        onClose={() => setDrawerOpen(false)}
      />
    </PageLayout>
  )
}
