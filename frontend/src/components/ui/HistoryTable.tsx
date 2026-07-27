'use client'

import { Analysis } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Type, FileText, Video, Mic, Eye, Download } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  analyses: Analysis[];
}

export default function HistoryTable({ analyses }: Props) {
  const router = useRouter()

  if (!analyses || analyses.length === 0) {
    return (
      <div className="glass rounded-[32px] p-16 text-center border-dashed border-white/10">
        <p className="text-gray-400 text-xl mb-4">No scan history recorded yet.</p>
        <button 
          onClick={() => router.push('/upload')}
          className="px-8 py-3.5 rounded-full bg-[#00d4ff] text-black font-bold hover:scale-105 transition-transform"
        >
          Start Your First Scan
        </button>
      </div>
    )
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={32} className="text-[#00d4ff]" />
      case 'text': return <Type size={32} className="text-[#ff3dff]" />
      case 'pdf': return <FileText size={32} className="text-[#8b5cf6]" />
      case 'video': return <Video size={32} className="text-[#ec4899]" />
      case 'audio': return <Mic size={32} className="text-[#f59e0b]" />
      default: return <FileText size={32} className="text-[#00d4ff]" />
    }
  }

  const getVerdictDisplay = (verdict?: string, score?: number) => {
    const percentage = score ? Math.round(score * 100) : 0
    if (verdict === 'ai_generated') {
      return (
        <div>
          <div className="text-[#ff3dff] font-extrabold text-lg tracking-wider">
            AI DETECTED {percentage}%
          </div>
          <div className="text-xs text-red-400">High artificial probability</div>
        </div>
      )
    } else if (verdict === 'human_made') {
      return (
        <div>
          <div className="text-[#00d4ff] font-extrabold text-lg tracking-wider">
            HUMAN {100 - percentage}%
          </div>
          <div className="text-xs text-[#00d4ff]/70">0 AI Detected</div>
        </div>
      )
    } else {
      return (
        <div>
          <div className="text-yellow-400 font-extrabold text-lg tracking-wider">
            MIXED {percentage}%
          </div>
          <div className="text-xs text-yellow-500/70">Inconclusive analysis</div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      {analyses.map((a, i) => (
        <motion.div 
          key={a.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => router.push(`/result/${a.id}`)}
          className="glass p-6 rounded-[28px] border border-white/10 hover:border-[#00d4ff]/40 transition-all duration-300 hover:scale-[1.01] cursor-pointer flex flex-col md:flex-row items-center justify-between gap-6 group"
        >
          {/* Left info badge */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              {getMediaIcon(a.file_type)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00d4ff] transition-colors line-clamp-1">
                {a.original_filename || (a.input_text ? `Text Scan: ${a.input_text.slice(0, 30)}...` : 'Scan Document')}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Center verdict score */}
          <div className="w-full md:w-auto text-left md:text-center">
            {getVerdictDisplay(a.verdict, a.confidence_score)}
          </div>

          {/* Right action buttons matching Stitch mockup */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={(e) => { e.stopPropagation(); router.push(`/result/${a.id}`); }}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-medium text-xs hover:bg-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all flex items-center gap-2"
            >
              <Eye size={14} /> View Report
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); router.push(`/result/${a.id}`); }}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-medium text-xs hover:bg-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
