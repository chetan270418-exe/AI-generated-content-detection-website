'use client'

import { useState } from 'react'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      login(data)
      window.location.href = '/upload' // Use window.location to ensure full state reset
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login')
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="glass p-8 rounded-[16px] w-full max-w-md animate-slide-up">
        <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>
        
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-white font-semibold flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform glow-cyan disabled:opacity-50 disabled:hover:scale-100 mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[var(--color-accent-real)] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
