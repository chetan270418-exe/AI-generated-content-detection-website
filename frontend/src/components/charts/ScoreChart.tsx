'use client'

import { motion } from 'framer-motion'

interface Props {
  fileType: string;
  detailedResults?: any;
}

export default function ScoreChart({ fileType, detailedResults }: Props) {
  if (!detailedResults || !Array.isArray(detailedResults.signals)) return null

  const signals = detailedResults.signals.map((signal: any) => ({
    name: signal.name,
    score: Math.round((signal.ai_probability ?? 0) * 100),
  }))

  return (
    <div className="w-full space-y-6">
      <h3 className="text-lg font-bold text-white mb-4">Signal Probability Breakdown</h3>
      
      {/* 3D-styled Bar Column Layout matching Stitch redesign */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {signals.map((s: any, i: number) => {
          const isHigh = s.score > 50
          const barColor = isHigh ? 'from-[#ff3dff] to-[#8b5cf6]' : 'from-[#00d4ff] to-[#3b82f6]'
          const textColor = isHigh ? 'text-[#ff3dff]' : 'text-[#00d4ff]'

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-between h-56 relative overflow-hidden group hover:border-white/25 transition-all"
            >
              {/* Score label on top */}
              <span className={`text-lg font-black ${textColor} drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]`}>
                {s.score}%
              </span>

              {/* Vertical 3D Cylinder Bar Container */}
              <div className="w-full flex-grow flex items-end justify-center py-2 px-3">
                <div className="w-12 h-36 bg-black/50 rounded-2xl p-1 relative border border-white/10 overflow-hidden flex items-end">
                  <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: `${s.score}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                    className={`w-full rounded-xl bg-gradient-to-t ${barColor} shadow-[0_0_15px_rgba(0,212,255,0.5)] relative overflow-hidden`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 rounded-full" />
                  </motion.div>
                </div>
              </div>

              {/* Signal Name Label */}
              <span className="text-xs font-semibold text-gray-400 text-center truncate w-full mt-2">
                {s.name}
              </span>
            </motion.div>
          )
        })}
      </div>

      {typeof detailedResults.agreement === 'number' && (
        <p className="text-xs text-gray-500 text-center mt-4">
          Signal agreement: <span className="text-gray-300 font-bold">{Math.round(detailedResults.agreement * 100)}%</span>
        </p>
      )}
    </div>
  )
}
