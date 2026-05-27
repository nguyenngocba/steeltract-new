import { Html } from '@react-three/drei'

type Props = {
  zone: any
}

export function YardZoneObject({
  zone,
}: Props) {

  const color =
    zone.occupancy > 80
      ? '#ef4444'
      : zone.occupancy > 50
      ? '#f97316'
      : '#22c55e'

  return (
    <group
      position={[
        zone.x,
        0,
        zone.z,
      ]}
    >

      <mesh rotation={[-1.57,0,0]}>

        <planeGeometry
          args={[8,8]}
        />

        <meshStandardMaterial
          color={color}
        />

      </mesh>

      <Html position={[0,0.2,0]}>

        <div className="rounded-xl bg-zinc-950/90 px-3 py-2 text-xs text-white shadow-xl">

          <div className="font-bold">
            {zone.id}
          </div>

          <div className="mt-1 text-zinc-400">
            {zone.occupancy}%
          </div>

        </div>

      </Html>

    </group>
  )
}
