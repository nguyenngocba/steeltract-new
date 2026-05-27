import {
  OrbitControls,
  Grid,
  Environment,
} from '@react-three/drei'

import {
  factoryMachines,
  yardZones,
} from '../mock-data/factory-layout.data'

import { MachineObject } from '../components/MachineObject'
import { YardZoneObject } from '../components/YardZoneObject'
import { FactoryFloor } from '../components/FactoryFloor'

export function FactoryScene() {
  return (
    <>

      {/* LIGHT */}
      <ambientLight intensity={0.4} />

      <directionalLight
        position={[10,20,10]}
        intensity={1.4}
        castShadow
      />

      {/* ENV */}
      <Environment preset="city" />

      {/* GRID */}
      <Grid
        args={[80,80]}
        sectionColor="#27272a"
        cellColor="#18181b"
      />

      {/* FLOOR */}
      <FactoryFloor />

      {/* MACHINES */}
      {factoryMachines.map((machine) => (
        <MachineObject
          key={machine.id}
          machine={machine}
        />
      ))}

      {/* YARD */}
      {yardZones.map((zone) => (
        <YardZoneObject
          key={zone.id}
          zone={zone}
        />
      ))}

      {/* CAMERA */}
      <OrbitControls />

    </>
  )
}
