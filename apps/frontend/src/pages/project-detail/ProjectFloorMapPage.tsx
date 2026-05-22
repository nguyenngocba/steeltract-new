import {
  useEffect,
  useState,
} from 'react'

import {
  useParams,
} from 'react-router-dom'

import Draggable from 'react-draggable'

import toast from 'react-hot-toast'

import {
  ComponentStatusBadge,
} from '../../components/ui'

import { api } from '../../lib/api'

export function ProjectFloorMapPage() {
  const { id } = useParams()

  const [project,
    setProject] =
    useState<any>(null)

  const [components,
    setComponents] =
    useState<any[]>([])

  async function loadData() {
    const [
      projectResponse,
      componentsResponse,
    ] = await Promise.all([
      api.get(
        `/projects/${id}`,
      ),

      api.get(
        `/projects/${id}/components`,
      ),
    ])

    setProject(
      projectResponse.data,
    )

    setComponents(
      componentsResponse.data,
    )
  }

  async function updatePosition(
    componentId: string,
    x: number,
    y: number,
  ) {
    try {
      await api.patch(
        `/components/${componentId}`,
        {
          x,
          y,
        },
      )

      setComponents((prev) =>
        prev.map((item) =>
          item.id === componentId
            ? {
                ...item,
                x,
                y,
              }
            : item,
        ),
      )
    } catch {
      toast.error(
        'Failed to move component',
      )
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function getComponentColor(
    status: string,
  ) {
    switch (status) {
      case 'INSTALLED':
        return `
          bg-green-500/20
          border-green-500/40
        `

      case 'DELIVERED':
        return `
          bg-purple-500/20
          border-purple-500/40
        `

      default:
        return `
          bg-yellow-500/20
          border-yellow-500/40
        `
    }
  }

  if (!project) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            {project.name}
          </h1>

          <p className="text-zinc-400 mt-2">
            Visual Floor Map
          </p>
        </div>

        <div className="text-right">
          <p className="text-zinc-400 text-sm">
            Components
          </p>

          <p className="text-5xl font-bold text-cyan-400">
            {
              components.length
            }
          </p>
        </div>
      </div>

      <div
        className="
          relative
          w-full
          h-[800px]
          bg-zinc-900
          border border-zinc-800
          rounded-2xl
          overflow-hidden
        "
      >
        {components.map(
          (component) => (
            <Draggable
              key={component.id}
              defaultPosition={{
                x:
                  component.x ||
                  0,

                y:
                  component.y ||
                  0,
              }}
              onStop={(
                e,
                data,
              ) => {
                updatePosition(
                  component.id,
                  data.x,
                  data.y,
                )
              }}
            >
              <div
                className={`
                  absolute
                  border
                  rounded-xl
                  p-3
                  w-44
                  cursor-move
                  shadow-lg
                  ${getComponentColor(
                    component.status,
                  )}
                `}
              >
                <p className="font-semibold">
                  {
                    component.code
                  }
                </p>

                <p className="text-sm text-zinc-400">
                  {
                    component.name
                  }
                </p>

                <div className="mt-2">
                  <ComponentStatusBadge
                    status={
                      component.status
                    }
                  />
                </div>

                <p className="text-xs text-zinc-500 mt-2">
                  {
                    component.floor
                  }
                </p>
              </div>
            </Draggable>
          ),
        )}
      </div>
    </div>
  )
}
