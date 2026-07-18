'use client'

import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react'

interface Props {
  verdict: string;
}

export default function VerdictCard({ verdict }: Props) {
  let Icon = HelpCircle
  let title = 'Inconclusive'
  let bgClass = 'bg-amber-500/10'
  let borderClass = 'border-amber-500/30'
  let textClass = 'text-[var(--color-accent-neutral)]'
  let glowClass = 'shadow-[0_0_30px_rgba(255,190,11,0.2)]'
  let animation = ''

  if (verdict === 'human_made') {
    Icon = ShieldCheck
    title = 'Human Made'
    bgClass = 'bg-[var(--color-accent-real)]/10'
    borderClass = 'border-[var(--color-accent-real)]/30'
    textClass = 'text-[var(--color-accent-real)]'
    glowClass = 'shadow-[0_0_30px_rgba(0,212,255,0.2)]'
    animation = 'animate-pulse'
  } else if (verdict === 'ai_generated') {
    Icon = AlertTriangle
    title = 'AI Generated'
    bgClass = 'bg-[var(--color-accent-ai)]/10'
    borderClass = 'border-[var(--color-accent-ai)]/30'
    textClass = 'text-[var(--color-accent-ai)]'
    glowClass = 'shadow-[0_0_30px_rgba(255,0,110,0.2)]'
    animation = 'animate-pulse'
  }

  return (
    <div className={`p-8 rounded-[16px] border ${borderClass} ${bgClass} ${glowClass} flex flex-col items-center justify-center text-center transition-all duration-500`}>
      <div className={`mb-4 p-4 rounded-full bg-black/20 ${textClass}`}>
        <Icon size={48} className={animation} />
      </div>
      <h2 className={`text-4xl font-bold ${textClass} tracking-tight`}>
        {title}
      </h2>
    </div>
  )
}
