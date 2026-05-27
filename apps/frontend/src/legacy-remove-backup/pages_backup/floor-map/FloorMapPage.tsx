import {
  useEffect,
  useState,
} from 'react'

import Draggable from 'react-draggable'

import toast from 'react-hot-toast'

import {
  ComponentStatusBadge,
} from '../../components/ui'

import { api } from '../../lib/api'

export function FloorMapPage() {
  const [components,
    setComponents] =
    useState<any[]>([])

  const [selectedFloor,
    setSelectedFloor] =
    useState('ALL')

  async function loadData() {
    const response =
      await api.get('/components')

    setComponents(
      response.data,
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

  const floors = [
    'ALL',

    ...new Set(
      components.map(
        (component) =>
          component.floor,
      ),
    ),
  ]

  const filteredComponents =
    selectedFloor === 'ALL'
      ? components
      : components.filter(
          (component) =>
            component.floor ===
            selectedFloor,
        )

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Floor Map
      </h1>

      {/* Floor Selector */}
      <div className="flex items-center gap-4 mb-6">
        <p className="text-zinc-400">
          Select Floor
        </p>

        <select
          value={selectedFloor}
          onChange={(e) =>
            setSelectedFloor(
              e.target.value,
            )
          }
          className="
            bg-zinc-900
            border border-zinc-800
            rounded-xl
            px-4 py-2
          "
        >
          {floors.map((floor) => (
            <option
              key={floor}
              value={floor}
            >
              {floor}
            </option>
          ))}
        </select>
      </div>

      {/* Floor Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm">
            Total
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              filteredComponents.length
            }
          </p>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400 text-sm">
            Installed
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              filteredComponents.filter(
                (item) =>
                  item.status ===
                  'INSTALLED',
              ).length
            }
          </p>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-400 text-sm">
            Delivered
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              filteredComponents.filter(
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
              filteredComponents.filter(
                (item) =>
                  item.status ===
                  'STOCK',
              ).length
            }
          </p>
        </div>
      </div>

      {/* Floor Map */}
      <div
        className="
          relative
          w-full
          h-[600px] md:h-[800px]
          bg-zinc-900
          border border-zinc-800
          rounded-2xl
          overflow-hidden
        "
      >
        {filteredComponents.map(
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
                _e,
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
                  w-36 md:w-44
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
