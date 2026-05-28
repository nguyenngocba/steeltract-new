import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Environment,
} from '@react-three/drei'

import { yardSlots } from '../../mock-data/yard-slots'
import { StackRenderer3D } from '../../digital-renderers/3d/StackRenderer3D'

export function Yard3DMap() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">

      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">

        <h2 className="text-xl font-bold text-white">
          Yard 3D Digital Twin
        </h2>

      </div>

      <div className="h-[700px]">

        <Canvas
          camera={{
            position: [20, 20, 20],
            fov: 50,
          }}
        >

          <ambientLight intensity={0.7} />

          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
          />

          <Grid
            args={[120, 120]}
            cellSize={1}
            cellThickness={0.6}
          />

          {yardSlots.map((slot) => (
            <StackRenderer3D
              key={slot.id}
              position={[
                slot.x * 2,
                0,
                slot.y * 2,
              ]}
              level={slot.level}
              occupancy={slot.occupancy}
            />
          ))}

          <OrbitControls />

          <Environment preset="night" />

        </Canvas>

      </div>

    </div>
  )
}
