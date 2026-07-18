'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import ParticleField from './ParticleField'

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]} // Cap DPR for performance
        gl={{ antialias: false, alpha: true }}
      >
        <Suspense fallback={null}>
          <ParticleField />
          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
