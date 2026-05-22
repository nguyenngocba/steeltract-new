import {
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import { PageHeader } from '../../components/layout/PageHeader'

import { api } from '../../lib/api'

import {
  Card,
  Modal,
  Drawer,
  Input,
  Table,
} from '../../components/ui'

interface Project {
  id: string
  code: string
  name: string
  description?: string
}

export function ProjectsPage() {
  const [search, setSearch] =
    useState('')

  const [openModal, setOpenModal] =
    useState(false)

  const [openDrawer, setOpenDrawer] =
    useState(false)

  const [selectedProject,
    setSelectedProject] =
    useState<any>(null)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [projects, setProjects] =
    useState<Project[]>([])

  const [loading, setLoading] =
    useState(false)

  const [name, setName] =
    useState('')

  const [code, setCode] =
    useState('')

  const [description,
    setDescription] =
    useState('')

  async function loadProjects() {
    try {
      setLoading(true)

      const response =
        await api.get('/projects')

      setProjects(response.data)
    } catch {
      toast.error(
        'Failed to load projects',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const filteredProjects =
    projects.filter((project) =>
      project.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  async function saveProject() {
    try {
      if (editingId) {
        await api.patch(
          `/projects/${editingId}`,
          {
            name,
            code,
            description,
          },
        )

        toast.success(
          'Project updated',
        )
      } else {
        await api.post('/projects', {
          name,
          code,
          description,
        })

        toast.success(
          'Project created',
        )
      }

      setName('')
      setCode('')
      setDescription('')

      setEditingId(null)

      setOpenModal(false)

      loadProjects()
    } catch {
      toast.error(
        'Failed to save project',
      )
    }
  }

  async function deleteProject(
    id: string,
  ) {
    const confirmed =
      window.confirm(
        'Delete this project?',
      )

    if (!confirmed) return

    try {
      await api.delete(
        `/projects/${id}`,
      )

      toast.success(
        'Project deleted',
      )

      loadProjects()
    } catch {
      toast.error(
        'Failed to delete project',
      )
    }
  }

  const columns: any[] = [
    {
      key: 'code',
      title: 'Code',
    },

    {
      key: 'name',
      title: 'Project Name',
    },

    {
      key: 'description',
      title: 'Description',
    },

    {
      key: 'actions',
      title: '',

      render: (_: any, row: any) => (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedProject(row)
              setOpenDrawer(true)
            }}
            className="text-cyan-400 hover:text-cyan-300"
          >
            View
          </button>

          <button
            onClick={() => {
              setEditingId(row.id)

              setName(row.name)
              setCode(row.code)

              setDescription(
                row.description || '',
              )

              setOpenModal(true)
            }}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Edit
          </button>

          <button
            onClick={() =>
              deleteProject(row.id)
            }
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Projects"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                bg-zinc-900
                border border-zinc-800
                rounded-xl
                px-4 py-2
                text-white
                outline-none
              "
            />

            <button
              onClick={() => {
                setEditingId(null)

                setName('')
                setCode('')
                setDescription('')

                setOpenModal(true)
              }}
              className="
                bg-cyan-500
                hover:bg-cyan-600
                px-4 py-2
                rounded-xl
              "
            >
              Add Project
            </button>
          </div>
        }
      />

      <Card>
        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            No projects found
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredProjects}
          />
        )}
      </Card>

      <Modal
        open={openModal}
        title={
          editingId
            ? 'Edit Project'
            : 'Create Project'
        }
        onClose={() =>
          setOpenModal(false)
        }
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="Factory A"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <Input
            label="Code"
            placeholder="PRJ-001"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
          />

          <Input
            label="Description"
            placeholder="Project description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value,
              )
            }
          />

          <button
            onClick={saveProject}
            className="
              w-full
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-3
            "
          >
            {editingId
              ? 'Update Project'
              : 'Save Project'}
          </button>
        </div>
      </Modal>

      <Drawer
        open={openDrawer}
        title="Project Details"
        onClose={() =>
          setOpenDrawer(false)
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-zinc-400 text-sm">
              Project Name
            </p>

            <h3 className="text-xl font-semibold">
              {selectedProject?.name}
            </h3>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Code
            </p>

            <h3 className="text-lg">
              {selectedProject?.code}
            </h3>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Description
            </p>

            <h3 className="text-lg">
              {selectedProject?.description}
            </h3>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
