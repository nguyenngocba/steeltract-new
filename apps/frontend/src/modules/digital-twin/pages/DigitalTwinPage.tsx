import { Canvas } from '@react-three/fiber'

import { FactoryScene } from '../scene/FactoryScene'

import { LiveTelemetryPanel } from '../components/LiveTelemetryPanel'

export function DigitalTwinPage() {
  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">

      {/* LEFT */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* HEADER */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-5">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-white">
                Digital Twin Runtime
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Smart Factory 3D Operational Visualization
              </p>

            </div>

            <div className="flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2">

              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />

              <span className="text-xs font-medium text-cyan-400">
                LIVE DIGITAL TWIN
              </span>

            </div>

          </div>

        </div>

        {/* 3D */}
        <div className="flex-1">

          <Canvas
            shadows
            camera={{
              position: [18,16,18],
              fov: 50,
            }}
          >

            <FactoryScene />

          </Canvas>

        </div>

      </div>

      {/* RIGHT */}
      <div className="w-[420px] border-l border-zinc-800 bg-zinc-950 p-5">

        <LiveTelemetryPanel />

      </div>

    </div>
  )
}
