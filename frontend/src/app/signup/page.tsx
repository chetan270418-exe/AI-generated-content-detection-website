'use client'

import { useState, useRef, useEffect } from 'react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  // OTP state
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
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
    if (!/^\d*$/.test(value)) return // Only digits
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only last digit
    setOtp(newOtp)
    
    // Auto-focus next input
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
    // Focus last filled or next empty
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
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="glass p-8 rounded-[16px] w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                <p className="text-[var(--text-muted)] text-sm bg-white/5 inline-block px-3 py-1 rounded-full border border-[var(--border-color)]">
                  Start your 1-month free trial (20 analyses)
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-[var(--border-color)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent-real)] transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-black/20 border border-[var(--border-color)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent-real)] transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-white"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Confirm Password</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-[var(--border-color)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent-real)] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-white font-semibold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform glow-cyan disabled:opacity-50 disabled:hover:scale-100 mt-6"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Start Free Trial'}
                </button>
              </form>

              <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-[var(--color-accent-real)] hover:underline">
                  Log In
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <button 
                onClick={() => { setStep('form'); setError('') }}
                className="text-[var(--text-muted)] hover:text-white flex items-center gap-1 text-sm mb-4 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--color-accent-real)]/20 to-blue-500/20 border border-[var(--color-accent-real)]/30 flex items-center justify-center">
                  <Mail className="text-[var(--color-accent-real)]" size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                <p className="text-[var(--text-muted)] text-sm">
                  We've sent a 6-digit code to<br />
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
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
                    className="w-12 h-14 text-center text-2xl font-bold bg-black/30 border-2 border-[var(--border-color)] rounded-[12px] focus:outline-none focus:border-[var(--color-accent-real)] transition-all text-white"
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-white font-semibold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform glow-cyan disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Verify & Continue</>}
              </button>

              <div className="mt-4 text-center">
                <p className="text-[var(--text-muted)] text-sm">
                  Didn't receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-[var(--text-muted)]">Resend in {resendCooldown}s</span>
                  ) : (
                    <button onClick={handleResend} className="text-[var(--color-accent-real)] hover:underline">
                      Resend Code
                    </button>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
