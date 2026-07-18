'use client'

import { useState } from 'react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

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
      const data = await authApi.signup(email, password)
      login(data)
      window.location.href = '/upload'
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign up')
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="glass p-8 rounded-[16px] w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-[var(--text-muted)] text-sm bg-white/5 inline-block px-3 py-1 rounded-full border border-[var(--border-color)]">
            Start your 1-month free trial (50 analyses)
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
      </div>
    </div>
  )
}
