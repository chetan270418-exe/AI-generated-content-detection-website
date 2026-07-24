'use client'

import { useState, useRef, useEffect } from 'react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useSearchParams } from 'next/navigation'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  
  const [email, setEmail] = useState(emailParam)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const { login } = useAuth()

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

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

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    if (!email) {
      setError('Email is required')
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
    if (resendCooldown > 0 || !email) return
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
      <div className="glass p-8 rounded-[16px] w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--color-accent-real)]/20 to-blue-500/20 border border-[var(--color-accent-real)]/30 flex items-center justify-center">
            <Mail className="text-[var(--color-accent-real)]" size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Enter the 6-digit code sent to<br />
            <span className="text-white font-medium">{email || 'your email'}</span>
          </p>
        </div>

        {!emailParam && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 bg-black/20 border border-[var(--border-color)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent-real)] transition-colors"
            />
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

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
              <span>Resend in {resendCooldown}s</span>
            ) : (
              <button onClick={handleResend} className="text-[var(--color-accent-real)] hover:underline">
                Resend Code
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>}>
      <VerifyContent />
    </Suspense>
  )
}
