import {
  OrbitControls,
  Grid,
  Environment,
} from '@react-three/drei'
import { useQuery } from '@tanstack/react-query'

import { productionApi } from '@/modules/production/api/production.api'
import { yardApi } from '@/modules/yard/services/api/yard.api'

import { MachineObject } from '../components/MachineObject'
import { YardZoneObject } from '../components/YardZoneObject'
import { FactoryFloor } from '../components/FactoryFloor'

function machinePosition(index: number) {
  return {
    x: -6 + index * 4,
    y: 0,
    z: index % 2 === 0 ? 2 : -2,
  }
}

function zonePosition(index: number) {
  return {
    x: -12 + (index % 3) * 12,
    z: -10 - Math.floor(index / 3) * 8,
  }
}

export function FactoryScene() {
  const { data: machines = [] } =
    useQuery({
      queryKey: ['digital-twin', 'machines'],
      queryFn: productionApi.machines,
      refetchInterval: 5000,
    })
  const { data: yardMetrics } =
    useQuery({
      queryKey: ['digital-twin', 'yard-metrics'],
      queryFn: yardApi.metrics,
      refetchInterval: 5000,
    })
  const factoryMachines =
    machines.map((machine, index) => ({
      id: machine.code,
      name: machine.name,
      status:
        machine.status === 'MAINTENANCE'
          ? 'warning'
          : 'running',
      temperature:
        Math.round(42 + machine.utilization / 2),
      ...machinePosition(index),
    }))
  const yardZones =
    yardMetrics?.zoneUtilization.map((zone, index) => ({
      id: zone.code,
      occupancy: zone.occupancyRate,
      ...zonePosition(index),
    })) ?? []

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
