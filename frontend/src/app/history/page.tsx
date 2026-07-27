'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisApi } from '@/lib/api'
import { HistoryResponse, Analysis } from '@/lib/types'
import { Loader2, Clock, ChevronLeft, ChevronRight, Image, FileText, File, Video, Mic, Eye, Download, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

function MiniGauge({ score, verdict }: { score: number; verdict: string }) {
  const color = verdict === 'ai_generated' ? '#ff3dff' : verdict === 'human_made' ? '#00d4ff' : '#f59e0b'
  const pct = Math.round((score ?? 0) * 100)
  const radius = 28
  const stroke = 5
  const circ = 2 * Math.PI * radius
  // Semicircle: we show 75% of the circle
  const arcLen = circ * 0.75
  const dash = (pct / 100) * arcLen

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <svg width="70" height="50" viewBox="0 0 70 55">
        {/* Background arc */}
        <circle
          cx="35" cy="40" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeDasharray={`${arcLen} ${circ}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <circle
          cx="35" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span className="text-xs font-black -mt-3" style={{ color }}>{pct}%</span>
    </div>
  )
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'ai_generated') return (
    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ff3dff]/15 text-[#ff3dff] border border-[#ff3dff]/30">
      AI DETECTED
    </span>
  )
  if (verdict === 'human_made') return (
    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30">
      HUMAN
    </span>
  )
  return (
    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
      MIXED
    </span>
  )
}

function FileTypeIcon({ type }: { type: string }) {
  const map: Record<string, { Icon: any; color: string; bg: string }> = {
    image: { Icon: Image, color: '#00d4ff', bg: '#00d4ff15' },
    text: { Icon: FileText, color: '#ff3dff', bg: '#ff3dff15' },
    pdf: { Icon: File, color: '#8b5cf6', bg: '#8b5cf615' },
    video: { Icon: Video, color: '#ec4899', bg: '#ec489915' },
    audio: { Icon: Mic, color: '#f59e0b', bg: '#f59e0b15' },
  }
  const entry = map[type] || map.image
  const { Icon, color, bg } = entry
  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
      <Icon size={22} style={{ color }} />
    </div>
  )
}

function HistoryCard({ analysis, index }: { analysis: Analysis; index: number }) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
    return `${Math.floor(hrs / 24)} days ago`
  }

  const borderColor = analysis.verdict === 'ai_generated' ? 'rgba(255,61,255,0.15)' : analysis.verdict === 'human_made' ? 'rgba(0,212,255,0.15)' : 'rgba(245,158,11,0.15)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="glass rounded-[24px] p-5 flex items-center gap-5 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] group"
      style={{ borderColor }}
    >
      {/* File type icon */}
      <FileTypeIcon type={analysis.file_type} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate max-w-[200px] sm:max-w-[350px]">
          {analysis.original_filename || analysis.file_type === 'text' ? (analysis.original_filename || 'Text Analysis') : 'Unknown File'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{timeAgo(analysis.created_at)}</p>
        {analysis.verdict && (
          <div className="mt-2">
            <VerdictBadge verdict={analysis.verdict} />
          </div>
        )}
      </div>

      {/* Mini gauge */}
      {analysis.confidence_score !== null && analysis.confidence_score !== undefined && analysis.verdict && (
        <MiniGauge score={analysis.confidence_score} verdict={analysis.verdict} />
      )}

      {/* Status / Actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        {analysis.status === 'processing' ? (
          <div className="flex items-center gap-1.5 text-xs text-[#f59e0b]">
            <Loader2 size={12} className="animate-spin" /> Processing
          </div>
        ) : analysis.status === 'failed' ? (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle size={12} /> Failed
          </div>
        ) : (
          <Link
            href={`/result/${analysis.id}`}
            className="flex items-center gap-1.5 text-xs font-bold text-[#00d4ff] bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <Eye size={12} /> View Report
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await analysisApi.getHistory(page, 10)
        setData(res)
      } catch {
        setError('Failed to fetch history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [page, isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <div className="relative min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Background — 3D DNA helix style (glow orbs to suggest depth) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[800px] bg-gradient-to-bl from-[#00d4ff]/6 via-[#8b5cf6]/6 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[500px] bg-gradient-to-tr from-[#ff3dff]/6 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00d4ff]/15 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
              <Clock size={24} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Scan <span className="text-[#00d4ff]">History</span>
              </h1>
              <p className="text-gray-400 text-sm">Your previous content authenticity analyses</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-t-2 border-[#00d4ff] animate-spin" />
              <div className="absolute inset-3 rounded-full border-b-2 border-[#ff3dff] animate-[spin_1.5s_linear_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-white opacity-30" size={20} />
              </div>
            </div>
          </div>
        ) : data?.analyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 glass rounded-[32px] border border-white/10"
          >
            <Clock size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No analyses yet</h3>
            <p className="text-gray-500 text-sm mb-6">Upload a file to run your first forensic analysis</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00d4ff] text-black font-bold text-sm hover:scale-[1.03] transition-transform"
            >
              Analyze Content
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {data?.analyses.map((a, i) => (
              <HistoryCard key={a.id} analysis={a} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-10 flex justify-center items-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-10 h-10 rounded-xl glass border border-white/10 hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/10 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-gray-400 font-mono bg-black/40 px-5 py-2.5 rounded-full border border-white/10">
              Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{data.pages}</span>
            </span>
            <button
              disabled={page === data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="w-10 h-10 rounded-xl glass border border-white/10 hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/10 disabled:opacity-30 flex items-center justify-center transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}