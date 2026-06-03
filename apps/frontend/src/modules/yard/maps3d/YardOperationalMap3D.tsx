import { Suspense, useEffect, useMemo, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'

import type { YardSlotRuntime } from '../services/api/yard.api'

function Asset({ src, position, scale = 1 }: { src: string; position: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF(src)
  const copy = useMemo(() => scene.clone(true), [scene])
  return <primitive object={copy} position={position} scale={scale} />
}

function CameraZoomRig({ zoom }: { zoom: number }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(13 / zoom, 12 / zoom, 17 / zoom)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, zoom])

  return null
}

export function YardOperationalMap3D({ slots, selectedSlotId }: { slots: YardSlotRuntime[]; selectedSlotId?: string }) {
  const [zoom, setZoom] = useState(1)
  const visibleSlots = slots.slice(0, 72)
  const columns = Math.max(1, Math.ceil(Math.sqrt(visibleSlots.length)))
  const slotWidth = 2.05
  const slotDepth = 2.35
  const gap = 0.28
  const gridWidth = columns * (slotWidth + gap)
  const rows = Math.max(1, Math.ceil(visibleSlots.length / columns))
  const gridDepth = rows * (slotDepth + gap)
  const slotPosition = (index: number): [number, number, number] => [
    -gridWidth / 2 + (index % columns) * (slotWidth + gap) + slotWidth / 2,
    0.03,
    -gridDepth / 2 + Math.floor(index / columns) * (slotDepth + gap) + slotDepth / 2,
  ]
  const activeSlots = visibleSlots.filter((slot) => slot.placements.length)
  const placements = activeSlots.flatMap((slot) => slot.placements.map((placement, placementIndex) => ({
    ...placement,
    slotId: slot.id,
    position: [
      slotPosition(visibleSlots.findIndex((item) => item.id === slot.id))[0],
      .24 + placementIndex * .58,
      slotPosition(visibleSlots.findIndex((item) => item.id === slot.id))[2],
    ] as [number, number, number],
  })))

  return <div className="relative h-[700px] overflow-hidden rounded border border-cyan-900 bg-[#030b14]">
    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded border border-slate-700 bg-[#06101b]/90 p-1 shadow-xl backdrop-blur">
      <button type="button" onClick={() => setZoom((value) => Math.min(2.2, Number((value + .2).toFixed(1))))} className="rounded bg-slate-800 p-2 text-cyan-200 hover:bg-cyan-900" title="Phóng to">
        <Plus size={15} />
      </button>
      <button type="button" onClick={() => setZoom((value) => Math.max(.65, Number((value - .2).toFixed(1))))} className="rounded bg-slate-800 p-2 text-cyan-200 hover:bg-cyan-900" title="Thu nhỏ">
        <Minus size={15} />
      </button>
      <button type="button" onClick={() => setZoom(1)} className="rounded bg-slate-800 p-2 text-slate-300 hover:bg-slate-700" title="Reset góc nhìn">
        <RotateCcw size={15} />
      </button>
      <span className="px-2 text-[10px] font-semibold text-cyan-300">{Math.round(zoom * 100)}%</span>
    </div>
    <div className="absolute bottom-3 left-3 z-10 rounded border border-slate-700 bg-[#06101b]/85 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
      Scale bãi: {columns} x {rows} slot · lăn chuột để zoom, kéo để xoay.
    </div>
    <Canvas camera={{ position: [13, 12, 17], fov: 40 }}>
      <CameraZoomRig zoom={zoom} />
      <color attach="background" args={['#030b14']} />
      <ambientLight intensity={2.1} />
      <directionalLight position={[8, 14, 8]} intensity={3.2} />
      <directionalLight position={[-10, 8, -4]} intensity={1.4} color="#22d3ee" />
      <gridHelper args={[Math.max(30, gridWidth + 6), Math.max(24, columns), '#0891b2', '#172033']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[Math.max(30, gridWidth + 6), Math.max(24, gridDepth + 6)]} />
        <meshStandardMaterial color="#071421" />
      </mesh>
      {visibleSlots.map((slot, index) => <mesh key={slot.id} position={slotPosition(index)} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[slotWidth, slotDepth]} />
        <meshStandardMaterial color={slot.id === selectedSlotId ? '#0891b2' : slot.placements.length ? '#064e3b' : '#111827'} emissive={slot.id === selectedSlotId ? '#0e7490' : '#000000'} emissiveIntensity={.75} />
      </mesh>)}
      <Suspense fallback={null}>
        <Asset src="/yard/crane.glb" position={[-6, 0, -7]} scale={0.46} />
        <Asset src="/yard/crane.glb" position={[4, 0, 2]} scale={0.42} />
        {placements.slice(0, 72).map((item) =>
          <Asset key={item.id} src="/yard/cau-kien-3d.glb" position={item.position} scale={0.32} />)}
      </Suspense>
      <OrbitControls makeDefault minDistance={6} maxDistance={32} maxPolarAngle={Math.PI / 2.08} />
    </Canvas>
  </div>
}

useGLTF.preload('/yard/crane.glb')
useGLTF.preload('/yard/cau-kien-3d.glb')
