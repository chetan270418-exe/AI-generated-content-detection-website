'use client'

import { useState, useRef, useEffect } from 'react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, CheckCircle, Shield, Lock, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  // OTP state
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!agreed) {
      setError('Please agree to the Terms of Service')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    try {
      await authApi.signup(email, password)
      setStep('otp')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < paste.length; i++) {
      newOtp[i] = paste[i]
    }
    setOtp(newOtp)
    const focusIndex = Math.min(paste.length, 5)
    otpRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    
    setError('')
    setLoading(true)
    try {
      const data = await authApi.verifyOtp(email, otpCode)
      login(data)
      window.location.href = '/upload'
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    try {
      await authApi.resendOtp(email)
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4 lg:p-8 pt-20">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[450px] bg-gradient-to-r from-[#00d4ff]/15 to-[#8b5cf6]/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: 3D Illustration & Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 text-center lg:text-left space-y-6 flex flex-col items-center lg:items-start"
        >
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff] to-[#ff3dff] rounded-3xl blur-2xl opacity-40 animate-pulse-glow" />
            <div className="relative w-full h-full glass rounded-3xl border border-[#00d4ff]/40 flex items-center justify-center shadow-[0_0_50px_rgba(0,212,255,0.3)]">
              <Shield size={64} className="text-[#00d4ff] animate-float" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-3">
              Dictator
            </h1>
            <p className="text-gray-400 text-base max-w-sm leading-relaxed">
              Secure AI-Powered Content Integrity. Join the Vanguard.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-ping" />
            <span>Includes 20 free analyses on signup</span>
          </div>
        </motion.div>

        {/* Right Side: Form Card */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-7 w-full"
        >
          <div className="glass p-8 lg:p-10 rounded-[32px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-[#0e1424]/80">
            {/* Progress bar matching mockup */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-2">
                <span>{step === 'form' ? 'Registration Progress' : 'Verification'}</span>
                <span className="text-[#00d4ff]">{step === 'form' ? '66%' : '99%'}</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: step === 'form' ? '66%' : '99%' }}
                  className="h-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] rounded-full shadow-[0_0_10px_rgba(0,212,255,0.8)]"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Create Your Account</h2>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
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
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-11 pr-12 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
                        >
                          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                        <input
                          type={showPwd ? "text" : "password"}
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="tos"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#00d4ff] bg-black/40 border-white/20 cursor-pointer"
                      />
                      <label htmlFor="tos" className="text-xs text-gray-400 cursor-pointer">
                        I agree to the <span className="text-[#00d4ff] underline">Terms of Service</span> and <span className="text-[#00d4ff] underline">Privacy Policy</span>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-black font-bold text-base shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    >
                      {loading ? <Loader2 className="animate-spin text-black" size={20} /> : (
                        <>Create Account <ArrowUpRight size={20} /></>
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-xs text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#00d4ff] font-bold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button 
                    onClick={() => { setStep('form'); setError('') }}
                    className="text-gray-400 hover:text-white flex items-center gap-1 text-xs mb-6 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Sign Up
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                      <Mail size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Verify Email Address</h2>
                    <p className="text-xs text-gray-400">
                      We've sent a 6-digit verification code to<br />
                      <span className="text-white font-medium">{email}</span>
                    </p>
                  </div>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-black/40 border border-white/20 rounded-2xl focus:outline-none focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/30 text-white transition-all"
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-black font-bold text-base shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin text-black" size={20} /> : (
                      <><CheckCircle size={20} /> Verify & Complete</>
                    )}
                  </button>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                      Didn't receive the code?{' '}
                      {resendCooldown > 0 ? (
                        <span className="text-gray-500 font-mono">Resend in {resendCooldown}s</span>
                      ) : (
                        <button onClick={handleResend} className="text-[#00d4ff] font-bold hover:underline">
                          Resend Code
                        </button>
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
