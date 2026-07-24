'use client'

import { useState, useRef, useEffect } from 'react'
import { authApi } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ForgotPassword() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setStep('otp')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset code')
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
    otpRefs.current[Math.min(paste.length, 5)]?.focus()
  }

  const handleReset = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(email, otpCode, newPassword)
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    try {
      await authApi.forgotPassword(email)
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
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Link href="/login" className="text-[var(--text-muted)] hover:text-white flex items-center gap-1 text-sm mb-4 transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </Link>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--color-accent-ai)]/20 to-purple-500/20 border border-[var(--color-accent-ai)]/30 flex items-center justify-center">
                  <KeyRound className="text-[var(--color-accent-ai)]" size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
                <p className="text-[var(--text-muted)] text-sm">
                  Enter your email and we'll send you a reset code.
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-ai)] to-purple-500 text-white font-semibold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Mail size={18} /> Send Reset Code</>}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <button 
                onClick={() => { setStep('email'); setError('') }}
                className="text-[var(--text-muted)] hover:text-white flex items-center gap-1 text-sm mb-4 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--color-accent-ai)]/20 to-purple-500/20 border border-[var(--color-accent-ai)]/30 flex items-center justify-center">
                  <KeyRound className="text-[var(--color-accent-ai)]" size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                <p className="text-[var(--text-muted)] text-sm">
                  Enter the code sent to <span className="text-white font-medium">{email}</span>
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
                    className="w-12 h-14 text-center text-2xl font-bold bg-black/30 border-2 border-[var(--border-color)] rounded-[12px] focus:outline-none focus:border-[var(--color-accent-ai)] transition-all text-white"
                  />
                ))}
              </div>

              {/* New Password */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-4 py-2 bg-black/20 border border-[var(--border-color)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent-ai)] transition-colors pr-10"
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
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Confirm New Password</label>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-[var(--border-color)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent-ai)] transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading || otp.join('').length !== 6 || !newPassword}
                className="w-full py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-ai)] to-purple-500 text-white font-semibold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Reset Password</>}
              </button>

              <div className="mt-4 text-center">
                <p className="text-[var(--text-muted)] text-sm">
                  Didn't receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <button onClick={handleResend} className="text-[var(--color-accent-ai)] hover:underline">
                      Resend Code
                    </button>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
              <p className="text-[var(--text-muted)] text-sm mb-6">
                Your password has been updated successfully.
              </p>
              <Link
                href="/login"
                className="inline-block px-8 py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-white font-semibold hover:scale-[1.02] transition-transform glow-cyan"
              >
                Go to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
