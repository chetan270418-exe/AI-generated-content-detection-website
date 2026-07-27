'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Wireframe, Float, Center } from '@react-three/drei'
import * as THREE from 'three'

function Core({ isAI }: { isAI: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)
  
  // Colors based on result
  const mainColor = isAI ? '#ff3dff' : '#00d4ff'
  const secondaryColor = isAI ? '#8b5cf6' : '#2563eb'

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.8
    }
    if (outerRef.current) {
      outerRef.current.rotation.x -= delta * 0.2
      outerRef.current.rotation.y -= delta * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <Center>
        {/* Inner pulsing core */}
        <Sphere ref={meshRef} args={[1.2, 64, 64]}>
          <MeshDistortMaterial 
            color={mainColor} 
            envMapIntensity={1} 
            clearcoat={1} 
            clearcoatRoughness={0} 
            metalness={0.8}
            roughness={0.2}
            distort={0.4} 
            speed={3} 
          />
        </Sphere>

        {/* Outer Wireframe Shield */}
        <Sphere ref={outerRef} args={[1.8, 16, 16]}>
          <meshBasicMaterial color={secondaryColor} wireframe transparent opacity={0.3} />
        </Sphere>
        
        {/* Glow light */}
        <pointLight color={mainColor} intensity={2} distance={10} />
      </Center>
    </Float>
  )
}

export default function ScanningCore({ isAI = false }: { isAI?: boolean }) {
  return (
    <div className="absolute -top-16 -right-16 w-[350px] h-[350px] opacity-60 pointer-events-none mix-blend-screen z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: false, alpha: true }}>
        <ambientLight intensity={0.5} />
        <Core isAI={isAI} />
      </Canvas>
    </div>
  )
}
