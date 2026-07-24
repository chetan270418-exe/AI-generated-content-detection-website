'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisApi, translateApi } from '@/lib/api'
import FileUploader from '@/components/ui/FileUploader'
import HowToUse from '@/components/ui/HowToUse'
import FAQ from '@/components/ui/FAQ'
import { Image as ImageIcon, Type, Loader2, Sparkles, Activity, FileText, Video, Layers, Mic, Wand2, Languages, X, Copy, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'

export default function UploadPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth() as any
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'image' | 'text' | 'pdf' | 'video' | 'audio' | 'batch'>('image')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  // Translator Modal State
  const [showTranslateModal, setShowTranslateModal] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [translatedText, setTranslatedText] = useState('')
  const [translateLoading, setTranslateLoading] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const [copied, setCopied] = useState(false)

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' }
  ]

  const handleTranslate = async () => {
    if (!text.trim()) return
    setTranslateError('')
    setTranslateLoading(true)
    try {
      const res = await translateApi.translate({
        text,
        target_language: targetLanguage
      })
      setTranslatedText(res.translated_text)
    } catch (err: any) {
      setTranslateError(err.response?.data?.detail || 'Translation failed')
    } finally {
      setTranslateLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) return prev;
          // Slower progress as it gets closer to 95%
          const increment = Math.max(1, Math.floor((95 - prev) * 0.1));
          return prev + increment;
        });
      }, 300);
    } else {
      setUploadProgress(0);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const onUploadProgress = (e: any) => {
    // We ignore the real upload progress since local uploads are instant.
    // The simulated progress above handles the visual effect perfectly.
  }

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
      const res = await analysisApi.analyzeImage(file, onUploadProgress)
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
      const res = await analysisApi.analyzePdf(file, onUploadProgress)
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
      const res = await analysisApi.analyzeVideo(file, onUploadProgress)
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
      const res = await analysisApi.analyzeAudio(file, onUploadProgress)
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
      await analysisApi.analyzeBatch(batchFiles, onUploadProgress)
      router.push(`/history`) // Go to history to see them all
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit batch for analysis')
      setIsSubmitting(false)
    }
  }

  const renderSubmitButton = (onClick: () => void, disabled: boolean, label: string) => {
    if (isSubmitting) {
      return (
        <div className="w-full relative py-4 rounded-[16px] bg-black/40 border border-[var(--color-accent-real)]/30 overflow-hidden shadow-inner flex items-center justify-center">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[var(--color-accent-real)]/40 to-blue-500/40 transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
          <div className="relative z-10 flex items-center gap-2 font-bold text-white text-sm">
            <Loader2 className="animate-spin text-[var(--color-accent-real)]" size={16} />
            {uploadProgress < 95 ? `Analyzing Content... ${uploadProgress}%` : 'Finalizing results... 99%'}
          </div>
        </div>
      );
    }
    
    return (
      <motion.button
        whileHover={{ scale: !disabled ? 1.02 : 1 }}
        whileTap={{ scale: !disabled ? 0.98 : 1 }}
        onClick={() => { setUploadProgress(0); onClick(); }}
        disabled={disabled}
        className="w-full py-4 rounded-[16px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
      >
        {label}
      </motion.button>
    );
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
                
                {renderSubmitButton(handleSubmitImage, !file, 'Run Image Analysis')}
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
                
                <div className="flex flex-wrap gap-4 mt-4">
                  <button 
                    onClick={() => {
                      setTranslatedText('')
                      setTranslateError('')
                      setShowTranslateModal(true)
                    }}
                    disabled={!text.trim() || isSubmitting}
                    className="flex-1 min-w-[150px] py-3 rounded-[12px] bg-[var(--color-accent-ai)]/10 text-[var(--color-accent-ai)] border border-[var(--color-accent-ai)]/30 hover:bg-[var(--color-accent-ai)] hover:text-white transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Languages size={18} /> AI Translator
                  </button>
                </div>
                
                {renderSubmitButton(handleSubmitText, !text.trim(), 'Run Text Analysis')}
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
                
                {renderSubmitButton(handleSubmitPdf, !file, 'Run PDF Analysis')}
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
                
                {renderSubmitButton(handleSubmitVideo, !file, 'Run Video Analysis')}
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
                
                {renderSubmitButton(handleSubmitAudio, !file, 'Run Audio Analysis')}
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
                
                {renderSubmitButton(handleSubmitBatch, batchFiles.length === 0, `Analyze ${batchFiles.length} files in background`)}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Downside Content */}
      <HowToUse />
      <FAQ />

      {/* Translator Modal */}
      <AnimatePresence>
        {showTranslateModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
            >
              <div className="p-8">
                <button 
                  onClick={() => setShowTranslateModal(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[var(--color-accent-ai)]/20 border border-[var(--color-accent-ai)]/30 rounded-full flex items-center justify-center text-[var(--color-accent-ai)]">
                    <Languages size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Translator</h2>
                    <p className="text-sm text-[var(--text-muted)]">Seamlessly translate your content.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Target Language</label>
                      <select 
                        value={targetLanguage}
                        onChange={e => setTargetLanguage(e.target.value)}
                        className="w-full bg-black/40 border border-[var(--border-color)] rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent-ai)] transition-colors appearance-none"
                      >
                        {languages.map(l => (
                          <option key={l.code} value={l.code}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleTranslate}
                      disabled={translateLoading}
                      className="bg-[var(--color-accent-ai)] hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-[12px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[140px]"
                    >
                      {translateLoading ? <Loader2 className="animate-spin" size={20} /> : 'Translate'}
                    </button>
                  </div>

                  {translateError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-[12px] text-red-500 text-sm">
                      {translateError}
                    </div>
                  )}

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Translated Result</label>
                    <textarea 
                      readOnly
                      value={translatedText}
                      placeholder="Translation will appear here..."
                      className="w-full h-48 bg-black/40 border border-[var(--border-color)] rounded-[16px] p-5 text-white focus:outline-none focus:border-[var(--color-accent-ai)] transition-colors resize-none text-lg leading-relaxed shadow-inner"
                    />
                    
                    {translatedText && (
                      <button 
                        onClick={handleCopy}
                        className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium backdrop-blur-sm border border-white/10"
                      >
                        {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy text'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
