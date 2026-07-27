'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number; // 0 to 1 (AI score)
  verdict: string;
}

export default function ConfidenceGauge({ score, verdict }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timeout)
  }, [score])

  const aiPercentage = Math.round(animatedScore * 100)
  const humanPercentage = 100 - aiPercentage

  // Needle angle calculation (-90 deg to 90 deg)
  const needleAngle = -90 + (aiPercentage / 100) * 180

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="relative w-[320px] h-[170px] flex items-center justify-center overflow-hidden">
        {/* SVG Arc Gauge */}
        <svg width="300" height="150" viewBox="0 0 300 150" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ff3dff" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Track Background */}
          <path
            d="M 25 140 A 125 125 0 0 1 275 140"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="24"
            strokeLinecap="round"
          />

          {/* Segmented Grid Lines */}
          <path
            d="M 25 140 A 125 125 0 0 1 275 140"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="20"
            strokeDasharray="6 4"
            strokeLinecap="round"
            filter="url(#glow)"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="text-5xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,212,255,0.6)]">
            {aiPercentage}%
          </span>
        </div>

        {/* Dynamic Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-1 h-32 origin-bottom transition-transform duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }}
        >
          <div className="w-1 h-24 bg-gradient-to-t from-[#00d4ff] to-white rounded-full shadow-[0_0_15px_#00d4ff]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#00d4ff] border-2 border-white shadow-[0_0_15px_#00d4ff]" />
        </div>
      </div>

      {/* Sub Labels matching Stitch 3D Scan Results screen */}
      <div className="w-full flex justify-between items-center px-6 mt-4 font-bold text-sm">
        <span className="text-[#00d4ff] drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
          HUMAN ({humanPercentage}%)
        </span>
        <span className="text-[#ff3dff] drop-shadow-[0_0_10px_rgba(255,61,255,0.4)]">
          AI ({aiPercentage}%)
        </span>
      </div>
    </div>
  )
}
