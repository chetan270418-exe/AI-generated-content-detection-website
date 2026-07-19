'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number; // 0 to 1
  verdict: string;
}

export default function ConfidenceGauge({ score, verdict }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    // Animate score from 0 to target on mount
    const timeout = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timeout)
  }, [score])

  const percentage = Math.round(animatedScore * 100)
  
  let colorClass = 'text-[var(--color-accent-neutral)]'
  let strokeColor = 'var(--color-accent-neutral)'
  
  if (verdict === 'ai_generated') {
    colorClass = 'text-[var(--color-accent-ai)]'
    strokeColor = 'var(--color-accent-ai)'
  } else if (verdict === 'human_made') {
    colorClass = 'text-[var(--color-accent-real)]'
    strokeColor = 'var(--color-accent-real)'
  }

  // SVG parameters
  const size = 200
  const strokeWidth = 15
  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center h-48">
      <svg width={size} height={size / 2 + strokeWidth} className="overflow-visible">
        {/* Background Arc */}
        <path
          d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          className={verdict === 'ai_generated' ? 'drop-shadow-[0_0_8px_rgba(255,0,110,0.5)]' : 'drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]'}
        />
      </svg>
      
      <div className="absolute bottom-2 flex flex-col items-center">
        <span className={`text-4xl font-bold font-mono ${colorClass}`}>
          {percentage}%
        </span>
        <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider mt-1">AI Probability</span>
      </div>
    </div>
  )
}
