'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisApi } from '@/lib/api'
import { Analysis } from '@/lib/types'
import VerdictCard from '@/components/ui/VerdictCard'
import ConfidenceGauge from '@/components/ui/ConfidenceGauge'
import ScoreChart from '@/components/charts/ScoreChart'
import { ArrowLeft, Loader2, RefreshCw, Download, AlertTriangle, X, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { cyberReportApi } from '@/lib/api'

const container: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
}

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth() as any
  const id = params.id as string

  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState('')
  const [isPolling, setIsPolling] = useState(true)

  // Cyber Report Modal State
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportPlatform, setReportPlatform] = useState('')
  const [reportCategory, setReportCategory] = useState('Deepfake')
  const [reportDescription, setReportDescription] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [reportId, setReportId] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!id || !isAuthenticated) return

    let timeoutId: NodeJS.Timeout

    const fetchResult = async () => {
      try {
        const data = await analysisApi.getResult(id)
        setResult(data)
        
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false)
        } else {
          // Poll every 2 seconds if still processing
          timeoutId = setTimeout(fetchResult, 2000)
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch result')
        setIsPolling(false)
      }
    }

    fetchResult()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [id, isAuthenticated])

  if (authLoading || !isAuthenticated) return null

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-[24px] max-w-md text-center border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <p className="text-red-500 mb-6 font-medium">{error}</p>
          <Link href="/upload" className="text-white hover:text-[var(--color-accent-real)] transition-colors flex items-center justify-center gap-2 font-medium">
            <ArrowLeft size={16} /> Back to Upload
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!result || isPolling) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-32 h-32 mb-8"
        >
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[var(--color-accent-real)] animate-spin" />
          <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-[var(--color-accent-ai)] animate-[spin_1.5s_linear_reverse]" />
          <div className="absolute inset-8 rounded-full border-t-2 border-b-2 border-[var(--color-accent-neutral)] animate-[spin_2s_linear]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-white opacity-50" size={24} />
          </div>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent-real)] to-[var(--color-accent-ai)] tracking-tight"
        >
          Analyzing Content
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[var(--text-muted)] mt-3 font-medium animate-pulse"
        >
          Running deep forensic analysis...
        </motion.p>
      </div>
    )
  }

  if (result.status === 'failed') {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-[24px] max-w-md text-center border-red-500/50 bg-red-500/5 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
          <h2 className="text-3xl font-bold text-red-500 mb-3 tracking-tight">Analysis Failed</h2>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">{result.explanation || 'An unknown error occurred.'}</p>
          <Link href="/upload" className="px-8 py-4 bg-red-500/20 text-red-500 font-bold rounded-[16px] hover:bg-red-500 text-white hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] inline-flex items-center gap-2 hover:scale-105 active:scale-95">
            <RefreshCw size={18} /> Try Again
          </Link>
        </motion.div>
      </div>
    )
  }

  const getGlowColor = () => {
    if (result.verdict === 'ai_generated') return 'rgba(255, 0, 110, 0.08)'
    if (result.verdict === 'human_made') return 'rgba(0, 212, 255, 0.08)'
    return 'rgba(255, 190, 11, 0.08)'
  }

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/result/${id}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dictator_report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  }

  const handleFileReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportPlatform || !reportDescription) return
    setReportLoading(true)
    try {
      const res = await cyberReportApi.fileReport({
        analysis_id: id,
        platform: reportPlatform,
        category: reportCategory,
        description: reportDescription
      })
      setReportId(res.report_id)
      setReportSuccess(true)
    } catch (err) {
      console.error(err)
      alert("Failed to file report")
    } finally {
      setReportLoading(false)
    }
  }

  const handleDownloadEvidence = async () => {
    try {
      const blob = await cyberReportApi.downloadPdf(reportId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cyber_evidence_${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-8 relative">
      <div 
        className="fixed inset-0 pointer-events-none -z-10 transition-colors duration-1000 ease-in-out"
        style={{ background: `radial-gradient(circle at 50% 30%, ${getGlowColor()} 0%, transparent 70%)` }}
      />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item} className="flex items-center justify-between mb-2">
          <Link href="/upload" className="text-[var(--text-muted)] hover:text-white flex items-center gap-2 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="font-medium">Analyze Another</span>
          </Link>
          <div className="flex items-center gap-4">
            {result.verdict === 'ai_generated' && (
              <button 
                onClick={() => setShowReportModal(true)}
                className="text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-4 py-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <ShieldAlert size={14} /> Report Cyber Crime
              </button>
            )}
            <button 
              onClick={handleDownloadReport}
              className="text-sm font-medium text-[var(--color-accent-real)] bg-[var(--color-accent-real)]/10 px-4 py-1.5 rounded-full hover:bg-[var(--color-accent-real)]/20 transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Download PDF
            </button>
            <div className="text-sm font-mono text-[var(--text-muted)] bg-white/5 px-3 py-1 rounded-full border border-white/10 hidden md:block">
              {new Date(result.created_at).toLocaleString()}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={item} className="md:col-span-2">
            <VerdictCard verdict={result.verdict!} />
          </motion.div>
          <motion.div variants={item} className="glass rounded-[24px] p-6 flex flex-col justify-center border border-white/10 shadow-xl shadow-black/50 hover:border-white/20 transition-colors">
            <ConfidenceGauge score={result.confidence_score!} verdict={result.verdict!} />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="glass rounded-[24px] p-6 border border-white/10 shadow-xl shadow-black/50 hover:border-white/20 transition-colors">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-white/30 rounded-full inline-block"></span>
              Detailed Breakdown
            </h3>
            <ScoreChart fileType={result.file_type} detailedResults={result.detailed_results} />
          </motion.div>
          
          <motion.div variants={item} className="glass rounded-[24px] p-6 flex flex-col border border-white/10 shadow-xl shadow-black/50 hover:border-white/20 transition-colors">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-white/30 rounded-full inline-block"></span>
              Explanation
            </h3>
            <div className="bg-black/40 p-6 rounded-[16px] flex-grow border border-white/5 shadow-inner">
              <p className="text-gray-300 leading-relaxed text-lg mb-6">
                {result.explanation}
              </p>
              
              {result.detailed_results?.heatmap && (
                <div className="mt-4 border-t border-white/10 pt-6">
                  <h4 className="text-sm font-bold text-[var(--color-accent-ai)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-ai)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-ai)]"></span>
                    </span>
                    AI Anomaly Heatmap
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mb-3">Red areas indicate regions that strongly triggered the AI detection model.</p>
                  <div className="rounded-[16px] overflow-hidden border border-white/10 bg-black/50 shadow-lg">
                    <img src={result.detailed_results.heatmap} alt="AI Anomaly Heatmap" className="w-full h-auto object-contain max-h-[300px]" />
                  </div>
                </div>
              )}

              {result.detailed_results?.sentence_heatmap && (
                <div className="mt-4 border-t border-white/10 pt-6">
                  <h4 className="text-sm font-bold text-[var(--color-accent-ai)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-ai)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-ai)]"></span>
                    </span>
                    Sentence-by-Sentence AI Heatmap (XAI)
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    Red indicates high AI probability, Green indicates high human probability, Yellow indicates mixed signals.
                  </p>
                  <div className="rounded-[16px] overflow-hidden border border-white/10 bg-black/50 shadow-lg p-4 leading-relaxed text-lg">
                    {result.detailed_results.sentence_heatmap.map((s: { text: string; ai_probability: number }, i: number) => {
                      let bgColor = 'transparent';
                      if (s.ai_probability > 0.7) bgColor = 'rgba(239, 68, 68, 0.2)'; // Red
                      else if (s.ai_probability < 0.3) bgColor = 'rgba(34, 197, 94, 0.2)'; // Green
                      else bgColor = 'rgba(234, 179, 8, 0.2)'; // Yellow
                      
                      return (
                        <span key={i} style={{ backgroundColor: bgColor }} className="rounded px-1 mx-0.5 transition-colors hover:bg-opacity-40" title={`AI Probability: ${(s.ai_probability * 100).toFixed(1)}%`}>
                          {s.text}{' '}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {result.detailed_results?.spectrogram_url && (
                <div className="mt-4 border-t border-white/10 pt-6">
                  <h4 className="text-sm font-bold text-[var(--color-accent-ai)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-ai)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-ai)]"></span>
                    </span>
                    Audio Forensic Spectrogram
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mb-3">Visualizing frequency distribution. Synthetic voices often lack high-frequency noise and show overly smooth MFCC variance.</p>
                  <div className="rounded-[16px] overflow-hidden border border-white/10 bg-black/50 shadow-lg">
                    <img src={result.detailed_results.spectrogram_url} alt="Audio Spectrogram" className="w-full h-auto object-contain max-h-[300px]" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div variants={item} className="mt-8 p-4 rounded-[16px] border border-[var(--border-color)] bg-black/20 text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
            * This system provides a probabilistic assessment based on learned patterns and forensic analysis — not a guaranteed determination.
          </p>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass border border-red-500/30 rounded-[32px] w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)] relative"
            >
              <div className="p-8">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-500">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Document Incident</h2>
                    <p className="text-sm text-[var(--text-muted)]">Document this incident to support your official complaint.</p>
                  </div>
                </div>

                {reportSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">Incident Logged</h3>
                    <p className="text-gray-300 mb-8 text-sm">Your report has been logged. Download this analysis summary to include when filing your report at cybercrime.gov.in.</p>
                    <button 
                      onClick={handleDownloadEvidence}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                      <Download size={18} /> Download Analysis Summary
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFileReport} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Platform Found On</label>
                        <input 
                          type="text" 
                          placeholder="e.g. WhatsApp, Twitter" 
                          value={reportPlatform}
                          onChange={e => setReportPlatform(e.target.value)}
                          className="w-full bg-black/40 border border-[var(--border-color)] rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <select 
                          value={reportCategory}
                          onChange={e => setReportCategory(e.target.value)}
                          className="w-full bg-black/40 border border-[var(--border-color)] rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors appearance-none"
                        >
                          <option>Deepfake</option>
                          <option>Misinformation</option>
                          <option>Fraud / Scam</option>
                          <option>Defamation</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Incident Description</label>
                      <textarea 
                        rows={4}
                        placeholder="Describe how this AI-generated content is being misused..."
                        value={reportDescription}
                        onChange={e => setReportDescription(e.target.value)}
                        className="w-full bg-black/40 border border-[var(--border-color)] rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                        required
                      />
                    </div>

                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[12px] flex gap-3 text-red-400">
                      <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                      <p className="text-xs">
                        Submitting this form will log the incident and generate an analysis summary to support your complaint. This is not an official legal filing by itself.
                      </p>
                    </div>

                    <button 
                      type="submit" 
                      disabled={reportLoading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-[12px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {reportLoading ? <Loader2 className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
                      {reportLoading ? 'Generating Summary...' : 'Submit & Generate Summary'}
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
