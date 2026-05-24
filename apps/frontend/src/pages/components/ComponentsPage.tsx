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
  Card,
  Modal,
  Input,
  Select,
  Table,
  ComponentStatusBadge,
} from '../../components/ui'

export function ComponentsPage() {
  const [openModal,
    setOpenModal] =
    useState(false)

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

  const columns = [
    {
      key: 'code',
      title: 'Code',
    },

    {
      key: 'name',
      title: 'Name',
    },

    {
      key: 'project',
      title: 'Project',

      render: (
        _: unknown,
        row: ComponentItem,
      ) =>
        row.project?.name,
    },

    {
      key: 'floor',
      title: 'Floor',
    },

    {
      key: 'zone',
      title: 'Zone',
    },

    {
      key: 'position',
      title: 'Position',
    },

    {
      key: 'qr',
      title: 'QR',

      render: (
        _: unknown,
        row: ComponentItem,
      ) => (
        <div className="bg-white p-2 rounded-lg w-fit">
          <QRCode
            size={60}
            value={
              window.location.origin +
              '/components/' +
              row.id
            }
          />
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',

      render: (value: unknown) => (
        <ComponentStatusBadge
          status={String(value)}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Components
        </h1>

        <button
          onClick={() =>
            setOpenModal(true)
          }
          className="
            bg-cyan-500
            hover:bg-cyan-600
            px-4 py-2
            rounded-xl
          "
        >
          Add Component
        </button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={components}
        />
      </Card>

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
    </div>
  )
}
