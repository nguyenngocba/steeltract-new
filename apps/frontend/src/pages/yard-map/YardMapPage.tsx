import {
  useEffect,
  useState,
} from 'react'

import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd'

import toast from 'react-hot-toast'

import { api } from '../../lib/api'

import { ComponentStatusBadge } from '../../components/ui'

export function YardMapPage() {
  const [components,
    setComponents] =
    useState<any[]>([])

  async function loadData() {
    const response =
      await api.get('/components')

    setComponents(response.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  const zones = [
    'Zone A',
    'Zone B',
    'Zone C',
    'Zone D',
  ]

  async function onDragEnd(
    result: any,
  ) {
    if (!result.destination) return

    const componentId =
      result.draggableId

    const newZone =
      result.destination.droppableId

    try {
      await api.patch(
        `/components/${componentId}`,
        {
          zone: newZone,
        },
      )

      toast.success(
        'Component moved',
      )

      loadData()
    } catch {
      toast.error(
        'Failed to move component',
      )
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Yard Map
      </h1>

      <DragDropContext
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-2 gap-6">
          {zones.map((zone) => {
            const zoneComponents =
              components.filter(
                (component) =>
                  component.zone ===
                  zone,
              )

            return (
              <Droppable
                droppableId={zone}
                key={zone}
              >
                {(provided) => (
                  <div
                    ref={
                      provided.innerRef
                    }
                    {...provided.droppableProps}
                    className="
                      bg-zinc-900
                      border border-zinc-800
                      rounded-2xl
                      p-6
                      min-h-[300px]
                    "
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        {zone}
                      </h2>

                      <span className="text-zinc-400 text-sm">
                        {
                          zoneComponents.length
                        }{' '}
                        components
                      </span>
                    </div>

                    <div className="space-y-3">
                      {zoneComponents.map(
                        (
                          component,
                          index,
                        ) => (
                          <Draggable
                            key={
                              component.id
                            }
                            draggableId={
                              component.id
                            }
                            index={index}
                          >
                            {(
                              provided,
                            ) => (
                              <div
                                ref={
                                  provided.innerRef
                                }
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="
                                  bg-zinc-800
                                  rounded-xl
                                  p-4
                                  border border-zinc-700
                                "
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {
                                        component.code
                                      }
                                    </p>

                                    <p className="text-sm text-zinc-400">
                                      {
                                        component.name
                                      }
                                    </p>

                                    {component.imageUrl && (
                                      <img
                                        src={
                                          'http://172.168.53.116:3000' +
                                          component.imageUrl
                                        }
                                        alt=""
                                        className="
                                          w-full
                                          h-32
                                          object-cover
                                          rounded-lg
                                          mt-3
                                        "
                                      />
                                    )}
                                  </div>

                                  <div className="text-right">
                                    <p className="text-cyan-400 text-sm">
                                      {
                                        component.floor
                                      }
                                    </p>

                                    <p className="text-zinc-500 text-xs">
                                      {
                                        component.position
                                      }
                                    </p>

                                    <div className="mt-2">
                                      <ComponentStatusBadge
                                        status={component.status}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ),
                      )}

                      {
                        provided.placeholder
                      }
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}