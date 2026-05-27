import { Box } from '@react-three/drei'

type Props = {
  position: [number, number, number]
  level: number
  occupancy: number
}

export function StackRenderer3D({
  position,
  level,
  occupancy,
}: Props) {
  const color =
    occupancy > 80
      ? '#ef4444'
      : occupancy > 50
      ? '#f97316'
      : '#06b6d4'

  return (
    <group position={position}>

      {[...Array(level)].map((_, index) => (
        <Box
          key={index}
          args={[1.8, 0.5, 1.8]}
          position={[0, index * 0.6, 0]}
        >

          <meshStandardMaterial color={color} />

        </Box>
      ))}

    </group>
  )
}
