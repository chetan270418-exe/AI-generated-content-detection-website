'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, CheckCircle2, Loader2, AlertCircle, Bug, Lightbulb, HelpCircle } from 'lucide-react'
import api from '@/lib/api'

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { value: 'suggestion', label: 'Feature Suggestion', icon: Lightbulb, color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  { value: 'general', label: 'General Inquiry', icon: HelpCircle, color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, y: 0, 
    transition: { type: 'spring', stiffness: 400, damping: 28 } 
  }
}

export default function FeedbackPage() {
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)

  const selectedType = feedbackTypes.find(t => t.value === type)!

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setCharCount(e.target.value.length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError('')
    try {
      await api.post('/api/feedback/submit', { type, message })
      setSuccess(true)
      setMessage('')
      setCharCount(0)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while submitting feedback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass p-8 md:p-12 rounded-[32px] w-full max-w-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Ambient glow blobs */}
        <motion.div 
          animate={{ 
            x: [0, 15, -10, 0], 
            y: [0, -10, 15, 0],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-72 h-72 bg-blue-500/8 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"
        />
        <motion.div 
          animate={{ 
            x: [0, -15, 10, 0], 
            y: [0, 10, -15, 0],
            scale: [1, 0.95, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--color-accent-real)]/8 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3 pointer-events-none"
        />

        <div className="relative z-10">
          {/* Header */}
          <motion.div 
            variants={containerVariants} initial="hidden" animate="show"
            className="flex items-center gap-4 mb-10"
          >
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-[18px] bg-[var(--color-accent-real)]/15 flex items-center justify-center border border-[var(--color-accent-real)]/25 shadow-[0_0_20px_rgba(0,212,255,0.15)]"
            >
              <MessageSquare className="w-7 h-7 text-[var(--color-accent-real)]" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-bold tracking-tight">Feedback & Support</h1>
              <p className="text-[var(--text-muted)] mt-1 text-sm">Help us improve the Dictator platform</p>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.85, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.85, y: -20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="bg-green-500/8 border border-green-500/25 rounded-[24px] p-10 text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.15 }}
                  className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-500/20"
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-2xl font-bold text-green-400 mb-2"
                >
                  Thank You!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-gray-400 mb-8"
                >
                  Your feedback has been submitted to our team. We appreciate your input!
                </motion.p>
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSuccess(false)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-colors"
                >
                  Submit another response
                </motion.button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit} 
                className="space-y-7"
              >
                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="p-4 bg-red-500/10 border border-red-500/25 rounded-[16px] flex items-center gap-3 text-red-400 overflow-hidden"
                    >
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Feedback Type Cards */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-3">What kind of feedback?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {feedbackTypes.map((ft) => {
                      const Icon = ft.icon
                      const isActive = type === ft.value
                      return (
                        <motion.button
                          key={ft.value}
                          type="button"
                          onClick={() => setType(ft.value)}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative p-4 rounded-[16px] border text-center transition-all duration-200 cursor-pointer ${
                            isActive 
                              ? 'border-white/20 shadow-lg' 
                              : 'border-[var(--border-color)] hover:border-white/15'
                          }`}
                          style={{
                            backgroundColor: isActive ? ft.bg : 'rgba(0,0,0,0.3)',
                          }}
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="activeGlow"
                              className="absolute inset-0 rounded-[16px] pointer-events-none"
                              style={{ boxShadow: `0 0 20px ${ft.bg}` }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                          <motion.div
                            animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Icon 
                              size={24} 
                              className="mx-auto mb-2 transition-colors"
                              style={{ color: isActive ? ft.color : '#6b7280' }}
                            />
                          </motion.div>
                          <span className={`text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}>
                            {ft.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Message */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Message</label>
                  <div className="relative group">
                    <textarea 
                      value={message}
                      onChange={handleMessageChange}
                      placeholder="Describe your issue or share your ideas..."
                      rows={5}
                      maxLength={2000}
                      className="w-full bg-black/40 border border-[var(--border-color)] rounded-[16px] px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-accent-real)] transition-all duration-300 resize-none group-hover:border-white/15"
                      required
                    />
                    <motion.div 
                      className="absolute bottom-3 right-4 text-xs font-mono"
                      animate={{ 
                        color: charCount > 1800 ? '#ef4444' : charCount > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      {charCount}/2000
                    </motion.div>
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.div variants={itemVariants}>
                  <motion.button 
                    type="submit" 
                    disabled={loading || !message.trim()}
                    whileHover={!loading && message.trim() ? { scale: 1.02, boxShadow: '0 0 30px rgba(0,212,255,0.3)' } : {}}
                    whileTap={!loading && message.trim() ? { scale: 0.98 } : {}}
                    className="w-full bg-gradient-to-r from-[var(--color-accent-real)] to-[#0096c7] text-black font-bold text-lg rounded-[16px] py-4 flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    {!loading && message.trim() && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <motion.div
                          animate={message.trim() ? { x: [0, 4, 0] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Send className="w-5 h-5" />
                        </motion.div>
                      )}
                      {loading ? 'Submitting...' : 'Send Feedback'}
                    </span>
                  </motion.button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
