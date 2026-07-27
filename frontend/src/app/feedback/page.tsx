'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, CheckCircle2, Loader2, AlertCircle, Bot, Smile, Meh, Frown, ChevronDown, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

export default function FeedbackPage() {
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('happy')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      q: "How accurate is Dictator's AI?",
      a: "Our AI model leverages advanced deep learning algorithms and ensemble forensic analysis, consistently achieving over 95% benchmark accuracy across various text formats and models."
    },
    {
      q: "Can I integrate Dictator with my existing workflow?",
      a: "Yes! Dictator provides RESTful API endpoints and WebSocket channels for seamless integration with custom CMS, automated verification scripts, or enterprise workflows."
    },
    {
      q: "What data privacy measures are in place?",
      a: "All uploaded content is analyzed in ephemeral memory and discarded immediately after processing. We strictly adhere to zero-retention policies and do not use your inputs to train public models."
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError('')
    try {
      await api.post('/api/feedback/submit', { 
        type: mood, 
        message: `[Mood: ${mood}] [Name: ${name || 'Anonymous'}] [Email: ${email || 'Not provided'}] ${message}` 
      })
      setSuccess(true)
      setMessage('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while submitting feedback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-[#00d4ff]/10 via-[#8b5cf6]/10 to-[#ff3dff]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Feedback Card matching Stitch mockup */}
        <motion.div 
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 glass p-8 sm:p-10 rounded-[32px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-[#0e1424]/85 relative overflow-hidden"
        >
          {/* Floating Robot Mascot Badge */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] p-[2px] shadow-[0_0_30px_rgba(0,212,255,0.4)] mb-4 animate-float">
              <div className="w-full h-full bg-[#0e1424] rounded-[22px] flex items-center justify-center text-[#00d4ff]">
                <Bot size={40} />
              </div>
            </div>

            {/* Emoji Mood Selector matching Stitch */}
            <div className="flex items-center gap-6 my-4">
              {[
                { id: 'happy', label: 'Happy', icon: Smile, color: '#00d4ff' },
                { id: 'neutral', label: 'Neutral', icon: Meh, color: '#9ca3af' },
                { id: 'sad', label: 'Sad', icon: Frown, color: '#ff3dff' },
              ].map((m) => {
                const Icon = m.icon
                const isActive = mood === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id as any)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#00d4ff]/20 border-2 border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.4)] scale-110' 
                        : 'bg-black/40 border border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                    }`}>
                      <Icon size={26} style={{ color: isActive ? m.color : '#9ca3af' }} />
                    </div>
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {m.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <h2 className="text-2xl font-bold text-white mt-2">How's your experience with Dictator?</h2>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center"
              >
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Feedback Received!</h3>
                <p className="text-gray-300 text-sm mb-6">Thank you for helping us refine Dictator.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
                >
                  Submit another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share your thoughts, suggestions, or bug reports..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition-colors text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-[#00d4ff] hover:bg-[#33ddff] text-black font-extrabold text-base shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin text-black" size={20} /> : (
                    <>Submit Feedback <Send size={18} /></>
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Side: FAQ Accordion matching Stitch mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="glass p-8 rounded-[32px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-[#0e1424]/85">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={index} className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 flex items-center justify-between text-left font-bold text-sm text-white hover:bg-white/5 transition-colors gap-4"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronDown size={18} className="text-[#00d4ff] shrink-0" /> : <ChevronRight size={18} className="text-gray-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-gray-400 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer matching Stitch mockup */}
      <footer className="mt-16 text-center text-xs text-gray-500 border-t border-white/10 pt-8">
        <div className="flex justify-center items-center gap-6 mb-3">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact Us</a>
        </div>
        <p>© 2026 Dictator AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
