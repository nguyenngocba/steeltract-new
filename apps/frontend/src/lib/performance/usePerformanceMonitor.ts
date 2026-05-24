import {
  useEffect,
  useRef,
  useState,
} from 'react'

export interface PerformanceSample {
  fps: number
  averageFrameMs: number
  longFrames: number
}

export function usePerformanceMonitor(
  enabled = true,
) {
  const frameRef = useRef(0)
  const [sample, setSample] =
    useState<PerformanceSample>({
      fps: 0,
      averageFrameMs: 0,
      longFrames: 0,
    })

  useEffect(() => {
    if (!enabled) {
      return
    }

    let rafId = 0
    let last = performance.now()
    let frames = 0
    let totalFrameMs = 0
    let longFrames = 0
    let windowStartedAt = last

    const tick = (now: number) => {
      const frameMs = now - last
      last = now
      frames += 1
      totalFrameMs += frameMs

      if (frameMs > 50) {
        longFrames += 1
      }

      if (now - windowStartedAt >= 1000) {
        setSample({
          fps: Math.round(
            (frames * 1000) /
              (now - windowStartedAt),
          ),
          averageFrameMs:
            totalFrameMs /
            Math.max(frames, 1),
          longFrames,
        })
        frames = 0
        totalFrameMs = 0
        longFrames = 0
        windowStartedAt = now
      }

      rafId = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    rafId = frameRef.current

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [enabled])

  return sample
}
