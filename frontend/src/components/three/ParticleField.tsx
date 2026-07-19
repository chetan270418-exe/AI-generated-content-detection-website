'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const { size, viewport } = useThree()
  
  const particleCount = size.width > 768 ? 2000 : 800
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const cols = new Float32Array(particleCount * 3)
    
    const colorReal = new THREE.Color('#00d4ff')
    const colorAI = new THREE.Color('#ff006e')
    
    for (let i = 0; i < particleCount; i++) {
      // Sphere distribution (fibonacci)
      const phi = Math.acos(-1 + (2 * i) / particleCount)
      const theta = Math.sqrt(particleCount * Math.PI) * phi
      
      const r = 2.0 // radius
      pos[i * 3] = r * Math.cos(theta) * Math.sin(phi)
      pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      pos[i * 3 + 2] = r * Math.cos(phi)
      
      // Color half real, half AI based on X position to create a split effect
      const isReal = pos[i * 3] < 0
      const c = isReal ? colorReal : colorAI
      
      cols[i * 3] = c.r
      cols[i * 3 + 1] = c.g
      cols[i * 3 + 2] = c.b
    }
    
    return [pos, cols]
  }, [particleCount])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    // Auto rotation
    pointsRef.current.rotation.y += 0.001
    pointsRef.current.rotation.x += 0.0005
    
    // Mouse parallax
    const mouseX = (state.pointer.x * viewport.width) / 50
    const mouseY = (state.pointer.y * viewport.height) / 50
    
    pointsRef.current.position.x += (mouseX - pointsRef.current.position.x) * 0.05
    pointsRef.current.position.y += (mouseY - pointsRef.current.position.y) * 0.05
  })

  return (
    <points ref={pointsRef}>
     <bufferGeometry>
  <primitive
    attach="attributes-position"
    object={new THREE.BufferAttribute(positions, 3)}
  />
  <primitive
    attach="attributes-color"
    object={new THREE.BufferAttribute(colors, 3)}
  />
</bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
