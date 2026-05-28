import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  MouseEvent,
  PointerEvent,
  WheelEvent,
} from 'react'

import {
  hitTestSlot,
  panViewport,
  zoomViewportAtPoint,
} from '../renderer/interaction-controller'
import {
  createInitialViewport,
  getVisibleSlots,
  screenToWorld,
} from '../renderer/viewport-manager'

import type {
  YardSelectionState,
  YardViewportState,
  YardWorldModel,
  YardWorldSlot,
} from '../renderer/yard-visualization.types'

export function useYardPixiViewport(
  world: YardWorldModel,
) {
  const containerRef =
    useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const [selection, setSelection] =
    useState<YardSelectionState>({})
  const [viewport, setViewport] =
    useState<YardViewportState>(() =>
      createInitialViewport(900, 520, world),
    )

  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    const observer = new ResizeObserver(
      ([entry]) => {
        const width =
          entry.contentRect.width || 900
        const height =
          entry.contentRect.height || 520

        setViewport(
          createInitialViewport(
            width,
            height,
            world,
          ),
        )
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [world])

  const visibleSlots = useMemo(
    () =>
      getVisibleSlots(
        world.slots,
        viewport,
      ),
    [viewport, world.slots],
  )

  const setSelectedSlot =
    useCallback((slot?: YardWorldSlot) => {
      setSelection((current) => ({
        ...current,
        selectedSlotId: slot?.id,
      }))
    }, [])

  const updateHoveredSlot =
    useCallback((slot?: YardWorldSlot) => {
      setSelection((current) => ({
        ...current,
        hoveredSlotId: slot?.id,
      }))
    }, [])

  const getLocalPoint = useCallback(
    (
      event:
        | PointerEvent
        | WheelEvent
        | MouseEvent,
    ) => {
      const bounds =
        containerRef.current?.getBoundingClientRect()

      return {
        x: event.clientX - (bounds?.left ?? 0),
        y: event.clientY - (bounds?.top ?? 0),
      }
    },
    [],
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault()
      const point = getLocalPoint(event)

      setViewport((current) =>
        zoomViewportAtPoint(
          current,
          point.x,
          point.y,
          event.deltaY,
        ),
      )
    },
    [getLocalPoint],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      draggingRef.current = true
      event.currentTarget.setPointerCapture(
        event.pointerId,
      )
    },
    [],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const point = getLocalPoint(event)
      const worldPoint = screenToWorld(
        point.x,
        point.y,
        viewport,
      )

      updateHoveredSlot(
        hitTestSlot(
          visibleSlots,
          worldPoint.x,
          worldPoint.y,
        ),
      )

      if (!draggingRef.current) {
        return
      }

      setViewport((current) =>
        panViewport(
          current,
          event.movementX,
          event.movementY,
        ),
      )
    },
    [
      getLocalPoint,
      updateHoveredSlot,
      viewport,
      visibleSlots,
    ],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      draggingRef.current = false
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      )
    },
    [],
  )

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const point = getLocalPoint(event)
      const worldPoint = screenToWorld(
        point.x,
        point.y,
        viewport,
      )

      setSelectedSlot(
        hitTestSlot(
          visibleSlots,
          worldPoint.x,
          worldPoint.y,
        ),
      )
    },
    [
      getLocalPoint,
      setSelectedSlot,
      viewport,
      visibleSlots,
    ],
  )

  return {
    containerRef,
    viewport,
    selection,
    visibleSlots,
    setSelection,
    setSelectedSlot,
    updateHoveredSlot,
    handlers: {
      onWheel: handleWheel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
      onClick: handleClick,
    },
  }
}
