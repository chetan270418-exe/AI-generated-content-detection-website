'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisApi } from '@/lib/api'
import { Analysis } from '@/lib/types'
import { ArrowLeft, Loader2, RefreshCw, Download, AlertTriangle, X, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cyberReportApi } from '@/lib/api'
import dynamic from 'next/dynamic'

const ScanningCore = dynamic(() => import('@/components/three/ScanningCore'), { ssr: false })

/* ═══════════════════════════════════════════════════
   CONFIDENCE GAUGE — pixel-perfect Stitch replica
   Full spectrum arc always visible. Needle = score.
═══════════════════════════════════════════════════ */
function ConfidenceGauge({ score }: { score: number }) {
  const [animNeedle, setAnimNeedle] = useState(-90)
  const aiPct  = Math.round(score * 100)
  const humPct = 100 - aiPct

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimNeedle(-90 + (aiPct / 100) * 180)
    }, 400)
    return () => clearTimeout(t)
  }, [aiPct])

  // SVG geometry
  const W = 400, H = 230
  const cx = W / 2, cy = H - 10, r = 155
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcPt  = (angleDeg: number) => ({
    x: cx + r * Math.cos(toRad(angleDeg - 180)),
    y: cy + r * Math.sin(toRad(angleDeg - 180)),
  })
  const s = arcPt(0), e = arcPt(180)
  const trackD = `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`

  // Needle tip point
  const needlLen = r - 25
  const nx = cx + needlLen * Math.cos(toRad(animNeedle - 90))
  const ny = cy + needlLen * Math.sin(toRad(animNeedle - 90))

  return (
    <div className="flex flex-col items-center w-full">
      <svg
        width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible', maxWidth: W }}
      >
        <defs>
          {/* Full spectrum gradient: cyan → purple → pink (left to right) */}
          <linearGradient id="rg-spectrum" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#00d4ff" />
            <stop offset="45%"  stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ff3dff" />
          </linearGradient>

          {/* Outer glow for the arc */}
          <filter id="rg-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Needle glow */}
          <filter id="rg-ndl" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Dark background track ── */}
        <path
          d={trackD} fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="32" strokeLinecap="round"
        />

        {/* ── LED-segment full spectrum arc (always lit) ── */}
        <path
          d={trackD} fill="none"
          stroke="url(#rg-spectrum)"
          strokeWidth="26"
          strokeDasharray="10 5"
          strokeLinecap="round"
          filter="url(#rg-glow)"
          opacity="0.95"
        />

        {/* ── Outer rim highlight for 3D depth ── */}
        <path
          d={trackD} fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* ── Needle ── */}
        <g style={{ transition: 'all 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <line
            x1={cx} y1={cy}
            x2={nx}  y2={ny}
            stroke="white" strokeWidth="3.5" strokeLinecap="round"
            filter="url(#rg-ndl)"
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(0deg)`, transition: 'all 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </g>
        {/* Render needle via transform on a group */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${animNeedle + 90}deg)`,
            transition: 'transform 1.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <line
            x1={cx} y1={cy}
            x2={cx} y2={cy - needlLen}
            stroke="white" strokeWidth="3.5" strokeLinecap="round"
            opacity="0"  // hidden — we use the calculated nx/ny version above via CSS
          />
        </g>

        {/* ── Pivot circle ── */}
        <circle
          cx={cx} cy={cy} r="13"
          fill="#111827"
          stroke="white" strokeWidth="2.5"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}
        />
        <circle cx={cx} cy={cy} r="6" fill="white" opacity="0.9" />

        {/* ── Center big % text ── */}
        <text
          x={cx} y={cy - 34}
          textAnchor="middle"
          fill="white"
          fontSize="52"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          style={{ filter: 'drop-shadow(0 0 22px rgba(0,212,255,0.7))' }}
        >
          {aiPct}%
        </text>
      </svg>

      {/* Needle via CSS — separate element positioned absolutely */}
      <style>{`
        @keyframes needleSpin {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(${animNeedle}deg); }
        }
      `}</style>

      {/* HUMAN / AI labels */}
      <div className="w-full flex justify-between px-3 -mt-3">
        <span className="text-sm font-black text-[#00d4ff]" style={{ textShadow: '0 0 14px #00d4ff88' }}>
          HUMAN ({humPct}%)
        </span>
        <span className="text-sm font-black text-[#ff3dff]" style={{ textShadow: '0 0 14px #ff3dff88' }}>
          AI ({aiPct}%)
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   3D GLASS CYLINDER BAR — pixel-perfect Stitch replica
═══════════════════════════════════════════════════ */
function CylinderBar({ label, pct, delay }: { label: string; pct: number; delay: number }) {
  const isAI     = pct > 50
  const topColor = isAI ? '#ff3dff' : '#00d4ff'
  const botColor = isAI ? '#8b5cf6' : '#2563eb'
  const glow     = isAI ? '#ff3dff' : '#00d4ff'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-2.5"
    >
      {/* % label on top */}
      <span
        className="text-lg font-black tracking-tight"
        style={{ color: topColor, textShadow: `0 0 14px ${glow}` }}
      >
        {pct}%
      </span>

      {/* Glass cylinder container */}
      <div className="relative" style={{ width: 64, height: 180 }}>
        {/* Dark glass background */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/10"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        />

        {/* Left edge 3D highlight */}
        <div
          className="absolute inset-y-0 left-0 w-[5px] rounded-l-2xl"
          style={{ background: `linear-gradient(to bottom, ${topColor}60, transparent 70%)` }}
        />

        {/* Right edge shadow for depth */}
        <div
          className="absolute inset-y-0 right-0 w-[4px] rounded-r-2xl"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        />

        {/* Animated fill — from bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-2xl overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.34, 1.05, 0.64, 1], delay: delay + 0.25 }}
          style={{
            background: `linear-gradient(to top, ${botColor}, ${topColor}90)`,
            boxShadow: `0 0 28px ${glow}70, inset 0 0 16px ${topColor}20`,
          }}
        >
          {/* Top gloss cap */}
          <div
            className="absolute top-0 left-1 right-1 rounded-t-2xl"
            style={{
              height: 18,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.55), transparent)',
            }}
          />
          {/* Vertical light stripe */}
          <div
            className="absolute top-2 bottom-2 left-[10px] rounded-full"
            style={{
              width: 6,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent 60%)',
            }}
          />
        </motion.div>

        {/* Top ellipse cap for 3D effect */}
        <div
          className="absolute left-0 right-0 rounded-full border border-white/10"
          style={{
            top: `calc(${100 - pct}% - 8px)`,
            height: 14,
            background: `radial-gradient(ellipse at 40% 40%, ${topColor}60, ${botColor}30)`,
            transition: 'top 1.4s ease',
            boxShadow: `0 0 12px ${glow}60`,
          }}
        />
      </div>

      {/* Signal name label */}
      <span className="text-[10px] font-semibold text-gray-400 text-center leading-tight" style={{ maxWidth: 72 }}>
        {label}
      </span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════
   SENTENCE HEATMAP with floating AI Signal tooltip
═══════════════════════════════════════════════════ */
function SentenceHeatmap({ sentences }: { sentences: { text: string; ai_probability: number }[] }) {
  const [tip, setTip] = useState<{ text: string; prob: number; top: number; left: number } | null>(null)

  return (
    <div className="relative leading-[1.85] text-gray-200 text-[15px]">
      {sentences.map((s, i) => {
        const isAI    = s.ai_probability > 0.65
        const isMixed = !isAI && s.ai_probability >= 0.35
        return (
          <span
            key={i}
            className="cursor-pointer rounded-sm mx-[1px] px-[2px] transition-all duration-150"
            style={{
              backgroundColor: isAI ? 'rgba(255,61,255,0.18)' : isMixed ? 'rgba(245,158,11,0.15)' : 'transparent',
              outline: isAI ? '1px solid rgba(255,61,255,0.5)' : isMixed ? '1px solid rgba(245,158,11,0.35)' : 'none',
              outlineOffset: '1px',
            }}
            onMouseEnter={(e) => {
              if (!isAI && !isMixed) return
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setTip({ text: s.text, prob: s.ai_probability, top: rect.top - 10, left: rect.left })
            }}
            onMouseLeave={() => setTip(null)}
          >
            {s.text}{' '}
          </span>
        )
      })}

      {/* ── Floating tooltip — exactly like Stitch ── */}
      <AnimatePresence>
        {tip && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, scale: 0.93, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top:  Math.max(tip.top - 150, 70),
              left: Math.min(tip.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 310),
              width: 290,
            }}
          >
            <div
              className="rounded-2xl border border-white/20 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
              style={{ background: 'rgba(10,14,30,0.92)', backdropFilter: 'blur(16px)' }}
            >
              <p className="text-[13px] font-black text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff3dff] animate-ping flex-shrink-0" />
                AI Signal Detected
              </p>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                <strong className="text-white">Reasoning:</strong>{' '}
                High repetition of common phrasing patterns and a lack of sentence structure variation are strongly
                indicative of AI generation. The language model probability score for this segment is{' '}
                <strong className="text-[#ff3dff]">{Math.round(tip.prob * 100)}%</strong>.{' '}
                Suggests a &apos;copy-paste&apos; behavior from an AI output.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN RESULT PAGE
═══════════════════════════════════════════════════ */
export default function ResultPage() {
  const params  = useParams()
  const router  = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth() as any
  const id      = params.id as string

  const [result,    setResult]    = useState<Analysis | null>(null)
  const [error,     setError]     = useState('')
  const [isPolling, setIsPolling] = useState(true)

  const [showModal,   setShowModal]   = useState(false)
  const [platform,    setPlatform]    = useState('')
  const [category,    setCategory]    = useState('Deepfake')
  const [desc,        setDesc]        = useState('')
  const [repLoading,  setRepLoading]  = useState(false)
  const [repSuccess,  setRepSuccess]  = useState(false)
  const [repId,       setRepId]       = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!id || !isAuthenticated) return
    let timer: NodeJS.Timeout
    const poll = async () => {
      try {
        const d = await analysisApi.getResult(id)
        setResult(d)
        if (d.status === 'completed' || d.status === 'failed') setIsPolling(false)
        else timer = setTimeout(poll, 2000)
      } catch (e: any) {
        setError(e.response?.data?.detail || 'Failed to fetch result')
        setIsPolling(false)
      }
    }
    poll()
    return () => clearTimeout(timer)
  }, [id, isAuthenticated])

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const base  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res   = await fetch(`${base}/api/result/${id}/report`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = Object.assign(document.createElement('a'), { href: url, download: `dictator_${id}.pdf` })
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove()
    } catch { /* silent */ }
  }

  const fileReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setRepLoading(true)
    try {
      const r = await cyberReportApi.fileReport({ analysis_id: id, platform, category, description: desc })
      setRepId(r.report_id); setRepSuccess(true)
    } catch { alert('Failed') } finally { setRepLoading(false) }
  }

  const dlEvidence = async () => {
    const blob = await cyberReportApi.downloadPdf(repId)
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `evidence_${repId}.pdf` })
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove()
  }

  if (authLoading || !isAuthenticated) return null

  if (error) return (
    <div className="flex-grow flex items-center justify-center p-4 pt-24">
      <div className="glass p-8 rounded-3xl max-w-md text-center border border-red-500/30">
        <p className="text-red-400 mb-6">{error}</p>
        <Link href="/upload" className="flex items-center justify-center gap-2 text-white hover:text-[#00d4ff] transition-colors"><ArrowLeft size={16}/> Back</Link>
      </div>
    </div>
  )

  if (!result || isPolling) return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 pt-24 gap-8">
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#00d4ff] animate-spin"/>
        <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-[#ff3dff] animate-[spin_1.6s_linear_reverse]"/>
        <div className="absolute inset-8 rounded-full border-t-2 border-b-2 border-[#8b5cf6] animate-[spin_2.2s_linear]"/>
        <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-white/30" size={22}/></div>
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] to-[#ff3dff] mb-2">Analyzing Content</h2>
        <p className="text-gray-500 text-sm animate-pulse">Running deep forensic analysis…</p>
      </div>
    </div>
  )

  if (result.status === 'failed') return (
    <div className="flex-grow flex items-center justify-center p-4 pt-24">
      <div className="glass p-8 rounded-3xl max-w-md text-center border border-red-500/40">
        <h2 className="text-2xl font-bold text-red-400 mb-3">Analysis Failed</h2>
        <p className="text-gray-400 mb-6 text-sm">{result.explanation || 'Unknown error.'}</p>
        <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all"><RefreshCw size={16}/> Try Again</Link>
      </div>
    </div>
  )

  /* ── Build signals array ── */
  const signals: { label: string; pct: number }[] = (() => {
    const dr = result.detailed_results
    if (!dr) return []
    if (Array.isArray(dr.signals)) return dr.signals.map((s: any) => ({ label: s.name, pct: Math.round((s.ai_probability ?? 0) * 100) }))
    const out: { label: string; pct: number }[] = []
    if (dr.model_score      !== undefined) out.push({ label: 'Classifier',    pct: Math.round(dr.model_score * 100) })
    if (dr.ela_score        !== undefined) out.push({ label: 'ELA Score',     pct: Math.round(dr.ela_score * 100) })
    if (dr.perplexity_score !== undefined) out.push({ label: 'Perplexity',    pct: Math.round(dr.perplexity_score * 100) })
    if (dr.burstiness_score !== undefined) out.push({ label: 'Burstiness',    pct: Math.round(dr.burstiness_score * 100) })
    if (dr.frequency_score  !== undefined) out.push({ label: 'Frequency',     pct: Math.round(dr.frequency_score * 100) })
    if (dr.spectral_score   !== undefined) out.push({ label: 'Spectral',      pct: Math.round(dr.spectral_score * 100) })
    return out
  })()

  const verdictColor = result.verdict === 'ai_generated' ? '#ff3dff' : result.verdict === 'human_made' ? '#00d4ff' : '#f59e0b'
  const verdictLabel = result.verdict === 'ai_generated' ? 'AI GENERATED' : result.verdict === 'human_made' ? 'HUMAN MADE' : 'INCONCLUSIVE'

  const containerV: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.09 } } }
  const itemV: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient bg glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ background: result.verdict === 'ai_generated' ? 'radial-gradient(ellipse at 40% 20%, rgba(255,61,255,0.07) 0%, transparent 65%)' : 'radial-gradient(ellipse at 40% 20%, rgba(0,212,255,0.06) 0%, transparent 65%)' }}/>

      {/* New 3D Component */}
      <ScanningCore isAI={result.verdict === 'ai_generated'} />

      <motion.div variants={containerV} initial="hidden" animate="show" className="max-w-6xl mx-auto relative z-10">

        {/* ── Top bar ── */}
        <motion.div variants={itemV} className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link href="/upload" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group text-sm font-medium">
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform"/> Analyze Another
          </Link>
          <div className="flex items-center gap-3">
            {result.verdict === 'ai_generated' && (
              <button onClick={() => setShowModal(true)} className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5">
                <ShieldAlert size={13}/> Report Cyber Crime
              </button>
            )}
            <button onClick={downloadReport} className="text-xs font-medium text-[#00d4ff] bg-[#00d4ff]/10 px-4 py-2 rounded-full hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1.5">
              <Download size={13}/> Download PDF
            </button>
            <div className="text-[11px] font-mono text-gray-500 bg-white/5 px-3 py-2 rounded-full border border-white/10 hidden sm:block">
              {new Date(result.created_at).toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* ── Page title ── */}
        <motion.div variants={itemV} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Detailed Scan Result:{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] to-[#ff3dff]">
              Analytical Scan Results
            </span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="font-black px-5 py-1.5 rounded-full border text-sm" style={{ color: verdictColor, borderColor: `${verdictColor}50`, background: `${verdictColor}18`, textShadow: `0 0 10px ${verdictColor}` }}>
              {verdictLabel}
            </span>
            <span className="text-sm text-gray-500 capitalize">{result.file_type} analysis</span>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            MAIN TWO-COLUMN LAYOUT
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: gauge + bar chart + heatmap */}
          <motion.div variants={itemV} className="lg:col-span-5 flex flex-col gap-6">

            {/* ── Confidence Gauge card ── */}
            <div className="glass rounded-[28px] border border-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h2 className="text-sm font-black text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full" style={{ background: verdictColor }}/>
                Confidence Gauge
              </h2>
              <ConfidenceGauge score={result.confidence_score ?? 0} />
            </div>

            {/* ── Sectional Probability Chart ── */}
            {signals.length > 0 && (
              <div className="glass rounded-[28px] border border-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <h2 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1 h-5 rounded-full bg-[#8b5cf6]"/>
                  Sectional Probability Chart
                </h2>
                <div className="flex justify-around items-end gap-2 px-2">
                  {signals.slice(0, 4).map((s, i) => (
                    <CylinderBar key={i} label={s.label} pct={s.pct} delay={i * 0.1}/>
                  ))}
                </div>
                {signals.length > 4 && (
                  <div className="flex justify-around items-end gap-2 px-2 mt-6 pt-6 border-t border-white/8">
                    {signals.slice(4).map((s, i) => (
                      <CylinderBar key={i} label={s.label} pct={s.pct} delay={(i + 4) * 0.1}/>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* RIGHT COLUMN: content analysis */}
          <motion.div variants={itemV} className="lg:col-span-7 flex flex-col gap-6">
            <div className="glass rounded-[28px] border border-white/10 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col gap-6">
              <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full bg-[#00d4ff]"/>
                Content Analysis
              </h2>

              {/* Explanation */}
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(0,0,0,0.35)' }}>
                <p className="text-gray-300 leading-relaxed text-sm">{result.explanation}</p>
              </div>

              {/* Sentence heatmap for text analysis */}
              {result.detailed_results?.sentence_heatmap && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3dff] opacity-75"/>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3dff]"/>
                    </span>
                    <h3 className="text-[11px] font-black text-[#ff3dff] uppercase tracking-widest">Sentence-by-Sentence AI Heatmap (XAI)</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">
                    <span className="inline-block w-3 h-3 rounded-sm mr-1.5 align-middle" style={{ background: 'rgba(255,61,255,0.3)', outline: '1px solid rgba(255,61,255,0.5)' }}/>
                    Hover pink sentences to see AI signal reasoning
                  </p>
                  <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <SentenceHeatmap sentences={result.detailed_results.sentence_heatmap}/>
                  </div>
                </div>
              )}

              {/* AI Anomaly Heatmap (images) */}
              {result.detailed_results?.heatmap && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3dff] opacity-75"/>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3dff]"/>
                    </span>
                    <h3 className="text-[11px] font-black text-[#ff3dff] uppercase tracking-widest">AI Anomaly Heatmap</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">Red areas indicate regions that strongly triggered the AI detection model.</p>
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <img src={result.detailed_results.heatmap} alt="Heatmap" className="w-full h-auto object-contain max-h-[320px]"/>
                  </div>
                </div>
              )}

              {/* Audio spectrogram */}
              {result.detailed_results?.spectrogram_url && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f59e0b] opacity-75"/>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f59e0b]"/>
                    </span>
                    <h3 className="text-[11px] font-black text-[#f59e0b] uppercase tracking-widest">Audio Forensic Spectrogram</h3>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <img src={result.detailed_results.spectrogram_url} alt="Spectrogram" className="w-full h-auto object-contain max-h-[280px]"/>
                  </div>
                </div>
              )}

              {/* Signal bars */}
              {signals.length > 0 && (
                <div className="pt-2 border-t border-white/8">
                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Detection Signal Details</h3>
                  <div className="space-y-3">
                    {signals.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 w-32 shrink-0">{s.label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.pct}%` }}
                            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 + i * 0.07 }}
                            className="h-full rounded-full"
                            style={{ background: s.pct > 50 ? 'linear-gradient(to right, #7c3aed, #ff3dff)' : 'linear-gradient(to right, #2563eb, #00d4ff)', boxShadow: s.pct > 50 ? '0 0 8px #ff3dff50' : '0 0 8px #00d4ff50' }}
                          />
                        </div>
                        <span className="text-[11px] font-black w-9 text-right" style={{ color: s.pct > 50 ? '#ff3dff' : '#00d4ff' }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.div variants={itemV} className="mt-8 p-4 rounded-2xl border border-white/5 bg-black/15 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">
            * Probabilistic assessment — not a guaranteed determination.
          </p>
        </motion.div>
      </motion.div>

      {/* ── Cyber Report Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass border border-red-500/30 rounded-[32px] w-full max-w-xl shadow-[0_0_60px_rgba(239,68,68,0.2)] relative">
              <div className="p-8">
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={18}/></button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-400"><ShieldAlert size={22}/></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Document Incident</h2>
                    <p className="text-xs text-gray-400">File an official record to support your complaint.</p>
                  </div>
                </div>
                {repSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert className="w-7 h-7 text-green-400"/></div>
                    <h3 className="text-lg font-bold text-green-400 mb-2">Incident Logged</h3>
                    <p className="text-gray-300 mb-6 text-sm">Download this summary to include when filing at cybercrime.gov.in.</p>
                    <button onClick={dlEvidence} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full flex items-center justify-center gap-2 mx-auto hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"><Download size={16}/> Download Summary</button>
                  </div>
                ) : (
                  <form onSubmit={fileReport} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Platform Found On</label>
                        <input type="text" placeholder="WhatsApp, Twitter…" value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors" required/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors">
                          <option>Deepfake</option><option>Misinformation</option><option>Fraud / Scam</option><option>Defamation</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Incident Description</label>
                      <textarea rows={4} placeholder="Describe how this content is being misused…" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none" required/>
                    </div>
                    <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5"/>
                      <p className="text-xs">Logs the incident and generates an analysis summary. Not a legal filing by itself.</p>
                    </div>
                    <button type="submit" disabled={repLoading} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {repLoading ? <Loader2 className="animate-spin" size={18}/> : <ShieldAlert size={18}/>}
                      {repLoading ? 'Generating…' : 'Submit & Generate Summary'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
