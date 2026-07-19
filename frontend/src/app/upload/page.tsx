'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisApi } from '@/lib/api'
import FileUploader from '@/components/ui/FileUploader'
import { Image as ImageIcon, Type, Loader2, Sparkles, Activity, FileText, Video, Layers, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'

export default function UploadPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth() as any
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'pdf' | 'video' | 'audio' | 'batch'>('image')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  if (authLoading || !isAuthenticated) return null

  const remaining = user?.plan === 'free_trial' ? Math.max(0, 50 - (user?.analyses_count || 0)) : 'Unlimited'

  const handleSubmitImage = async () => {
    if (!file) return
    setError('')
    setIsSubmitting(true)
    try {
      const res = await analysisApi.analyzeImage(file)
      router.push(`/result/${res.analysis_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit image for analysis')
      setIsSubmitting(false)
    }
  }

  const handleSubmitText = async () => {
    if (!text.trim()) return
    setError('')
    setIsSubmitting(true)
    try {
      const res = await analysisApi.analyzeText(text)
      router.push(`/result/${res.analysis_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit text for analysis')
      setIsSubmitting(false)
    }
  }

  const handleSubmitPdf = async () => {
    if (!file) return
    setError('')
    setIsSubmitting(true)
    try {
      const res = await analysisApi.analyzePdf(file)
      router.push(`/result/${res.analysis_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit PDF for analysis')
      setIsSubmitting(false)
    }
  }

  const handleSubmitVideo = async () => {
    if (!file) return
    setError('')
    setIsSubmitting(true)
    try {
      const res = await analysisApi.analyzeVideo(file)
      router.push(`/result/${res.analysis_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit video for analysis')
      setIsSubmitting(false)
    }
  }

  const handleSubmitAudio = async () => {
    if (!file) return
    setError('')
    setIsSubmitting(true)
    try {
      const res = await analysisApi.analyzeAudio(file)
      router.push(`/result/${res.analysis_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit audio for analysis')
      setIsSubmitting(false)
    }
  }

  const [batchFiles, setBatchFiles] = useState<File[]>([])
  
  const { getRootProps: getBatchRootProps, getInputProps: getBatchInputProps, isDragActive: isBatchDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setBatchFiles(prev => [...prev, ...acceptedFiles].slice(0, 10))
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true
  })

  const handleSubmitBatch = async () => {
    if (batchFiles.length === 0) return
    setError('')
    setIsSubmitting(true)
    try {
      await analysisApi.analyzeBatch(batchFiles)
      router.push(`/history`) // Go to history to see them all
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit batch for analysis')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-grow max-w-4xl mx-auto w-full px-4 py-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
          >
            Analyze Content
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[var(--text-muted)] flex items-center gap-2"
          >
            <Sparkles size={16} className="text-[var(--color-accent-real)]" />
            Upload media to check if it's AI-generated.
          </motion.p>
        </div>
        
        {/* Sticky Quota Badge */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="sticky top-20 z-40 glass px-4 py-2 rounded-full text-sm flex items-center gap-2 border-[var(--color-accent-real)]/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]"
        >
          <Activity size={14} className="text-[var(--color-accent-real)] animate-pulse" />
          <span className="font-medium text-white">{remaining}</span> 
          <span className="text-[var(--text-muted)]">analyses remaining</span>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 overflow-hidden"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-[24px] overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
      >
        {/* Animated Tabs */}
        <div className="flex flex-wrap relative bg-black/40 p-2 gap-1">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 min-w-[100px] py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 transition-colors relative z-10 text-sm ${activeTab === 'image' ? 'text-white font-medium' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <ImageIcon size={16} /> Image
            {activeTab === 'image' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-[16px] -z-10 border border-white/20"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 min-w-[100px] py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 transition-colors relative z-10 text-sm ${activeTab === 'text' ? 'text-white font-medium' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <Type size={16} /> Text
            {activeTab === 'text' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-[16px] -z-10 border border-white/20"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 min-w-[80px] py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 transition-colors relative z-10 text-sm ${activeTab === 'pdf' ? 'text-white font-medium' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <FileText size={16} /> PDF
            {activeTab === 'pdf' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-[16px] -z-10 border border-white/20"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 min-w-[90px] py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 transition-colors relative z-10 text-sm ${activeTab === 'video' ? 'text-white font-medium' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <Video size={16} /> Video
            {activeTab === 'video' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-[16px] -z-10 border border-white/20"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 min-w-[90px] py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 transition-colors relative z-10 text-sm ${activeTab === 'audio' ? 'text-white font-medium' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <Mic size={16} /> Audio
            {activeTab === 'audio' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-[16px] -z-10 border border-white/20"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          {user?.plan === 'vip' && (
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 min-w-[100px] py-3 px-3 rounded-[16px] flex items-center justify-center gap-2 transition-colors relative z-10 text-sm ${activeTab === 'batch' ? 'text-[var(--color-accent-real)] font-bold' : 'text-[var(--color-accent-real)]/70 hover:text-[var(--color-accent-real)]'}`}
            >
              <Layers size={16} /> Batch
              {activeTab === 'batch' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-[16px] -z-10 border border-white/20"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeTab === 'image' ? (
              <motion.div 
                key="image"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <FileUploader onFileSelect={setFile} />
                
                <motion.button
                  whileHover={{ scale: file && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: file && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleSubmitImage}
                  disabled={!file || isSubmitting}
                  className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin text-black" /> : 'Run Image Analysis'}
                </motion.button>
              </motion.div>
            ) : activeTab === 'text' ? (
              <motion.div 
                key="text"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="relative group">
                  <div className="absolute -inset-[2px] bg-gradient-to-r from-[var(--color-accent-real)] to-[var(--color-accent-ai)] rounded-[18px] blur-sm opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste or type text to analyze (e.g. an essay, article, or email)..."
                    className="relative w-full h-64 p-6 bg-black/40 border border-white/10 rounded-[16px] focus:outline-none focus:border-[var(--color-accent-real)] transition-colors resize-none text-white text-lg leading-relaxed shadow-inner"
                    maxLength={10000}
                  />
                  <div className="absolute bottom-4 right-6 text-xs text-[var(--text-muted)] bg-black/50 px-2 py-1 rounded-md">
                    {text.length} / 10000 chars
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: text.trim() && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: text.trim() && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleSubmitText}
                  disabled={!text.trim() || isSubmitting}
                  className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin text-black" /> : 'Run Text Analysis'}
                </motion.button>
              </motion.div>
            ) : activeTab === 'pdf' ? (
              <motion.div 
                key="pdf"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <FileUploader 
                  onFileSelect={setFile} 
                  accept={{ 'application/pdf': ['.pdf'] }} 
                  supportText="Supports PDF" 
                />
                
                <motion.button
                  whileHover={{ scale: file && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: file && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleSubmitPdf}
                  disabled={!file || isSubmitting}
                  className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin text-black" /> : 'Run PDF Analysis'}
                </motion.button>
              </motion.div>
            ) : activeTab === 'video' ? (
              <motion.div 
                key="video"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <FileUploader 
                  onFileSelect={setFile} 
                  accept={{ 'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'] }} 
                  supportText="Supports MP4, AVI, MOV, WEBM" 
                  maxSizeMB={50}
                />
                
                <motion.button
                  whileHover={{ scale: file && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: file && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleSubmitVideo}
                  disabled={!file || isSubmitting}
                  className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin text-black" /> : 'Run Video Analysis'}
                </motion.button>
              </motion.div>
            ) : activeTab === 'audio' ? (
              <motion.div 
                key="audio"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <FileUploader 
                  onFileSelect={setFile} 
                  accept={{ 'audio/*': ['.mp3', '.wav', '.m4a'] }} 
                  supportText="Supports MP3, WAV, M4A" 
                  maxSizeMB={20}
                />
                
                <motion.button
                  whileHover={{ scale: file && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: file && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleSubmitAudio}
                  disabled={!file || isSubmitting}
                  className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin text-black" /> : 'Run Audio Analysis'}
                </motion.button>
              </motion.div>
            ) : activeTab === 'batch' ? (
              <motion.div 
                key="batch"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <div 
                    {...getBatchRootProps()} 
                    className={`border-2 border-dashed rounded-[16px] p-10 text-center cursor-pointer transition-all duration-200
                      ${isBatchDragActive ? 'border-[var(--color-accent-real)] bg-[var(--color-accent-real)]/5' : 'border-[var(--color-accent-real)]/50 hover:border-[var(--color-accent-real)] bg-[var(--color-accent-real)]/5'}
                    `}
                  >
                    <input {...getBatchInputProps()} />
                    <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--color-accent-real)]" />
                    <p className="text-lg font-bold text-[var(--color-accent-real)] mb-1">
                      VIP Batch Mode (Max 10 files)
                    </p>
                    <p className="text-sm text-gray-400">
                      Drag & drop multiple images or PDFs
                    </p>
                  </div>
                  
                  {batchFiles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {batchFiles.map((f, i) => (
                        <div key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{f.name}</span>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setBatchFiles(batchFiles.filter((_, idx) => idx !== i))
                          }} className="text-red-400 hover:text-red-300">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: batchFiles.length > 0 && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: batchFiles.length > 0 && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleSubmitBatch}
                  disabled={batchFiles.length === 0 || isSubmitting}
                  className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin text-black" /> : `Analyze ${batchFiles.length} files in background`}
                </motion.button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
