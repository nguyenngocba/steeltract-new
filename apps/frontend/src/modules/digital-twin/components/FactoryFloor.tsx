export function FactoryFloor() {
  return (
    <mesh
      rotation={[-1.57,0,0]}
      receiveShadow
    >

      <planeGeometry
        args={[80,80]}
      />

      <meshStandardMaterial
        color="#18181b"
      />

    </mesh>
  )
}
