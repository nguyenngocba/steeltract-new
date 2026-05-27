import { Html } from '@react-three/drei'

import {
  useDigitalTwinStore,
} from '../store/digitalTwin.store'

type Props = {
  machine: any
}

export function MachineObject({
  machine,
}: Props) {

  const setSelectedMachine =
    useDigitalTwinStore(
      (s) => s.setSelectedMachine
    )

  const color =
    machine.status === 'warning'
      ? '#ef4444'
      : '#22c55e'

  return (
    <group
      position={[
        machine.x,
        machine.y,
        machine.z,
      ]}
      onClick={() =>
        setSelectedMachine(machine)
      }
    >

      {/* MACHINE BODY */}
      <mesh castShadow>

        <boxGeometry args={[3,2,3]} />

        <meshStandardMaterial
          color={color}
        />

      </mesh>

      {/* MACHINE TOP */}
      <mesh
        position={[0,1.5,0]}
      >

        <cylinderGeometry
          args={[0.4,0.4,1]}
        />

        <meshStandardMaterial
          color="#38bdf8"
        />

      </mesh>

      {/* LABEL */}
      <Html position={[0,2.8,0]}>

        <div className="rounded-xl bg-zinc-950/90 px-3 py-2 text-xs text-white shadow-xl">

          <div className="font-bold">
            {machine.id}
          </div>

          <div className="mt-1 text-zinc-400">
            {machine.temperature}°C
          </div>

        </div>

      </Html>

    </group>
  )
}
