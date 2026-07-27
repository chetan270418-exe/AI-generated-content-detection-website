'use client'

import { useState } from 'react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      login(data)
      window.location.href = '/upload'
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to login'
      if (err.response?.status === 403 && detail.includes('not verified')) {
        setError(detail)
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        setError(detail)
      }
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4 overflow-hidden pt-20">
      {/* Animated 3D Wave Lines Background — matching sleek_3d_login_screen Stitch */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dark charcoal base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#050811] to-[#0a0e1a]" />
        {/* Animated wave SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1400 768" preserveAspectRatio="xMidYMid slice">
          {[...Array(12)].map((_, i) => (
            <path
              key={i}
              d={`M0,${200 + i * 40} C350,${160 + i * 40} 700,${240 + i * 40} 1050,${180 + i * 40} S1400,${220 + i * 40} 1400,${200 + i * 40}`}
              fill="none"
              stroke={i % 3 === 0 ? '#0066ff' : i % 3 === 1 ? '#00d4ff' : '#1a3a7a'}
              strokeWidth="0.8"
              style={{
                animation: `waveMove ${4 + i * 0.4}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.4 + (i * 0.05)
              }}
            />
          ))}
        </svg>
        <style>{`
          @keyframes waveMove {
            0% { transform: translateY(0px) scaleY(1); }
            100% { transform: translateY(${Math.random() > 0.5 ? '-' : ''}12px) scaleY(1.04); }
          }
        `}</style>
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#0066ff]/25 via-[#00d4ff]/20 to-transparent blur-[130px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass p-10 rounded-[32px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-[#0e1424]/75">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              Dictator
            </h1>
            <p className="text-sm text-gray-400">
              Sign in to access your AI analysis dashboard
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0066ff] via-[#00d4ff] to-[#0066ff] text-white font-bold text-base shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between text-xs font-medium border-t border-white/10 pt-6">
            <Link 
              href="/forgot-password" 
              className="text-gray-400 hover:text-[#00d4ff] transition-colors"
            >
              Forgot Password?
            </Link>
            <Link 
              href="/signup" 
              className="text-[#00d4ff] hover:underline font-bold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
