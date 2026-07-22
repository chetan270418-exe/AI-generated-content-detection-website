'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Users, Activity, Loader2, ShieldCheck, FileCheck, Brain } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminDashboard() {
  const { isAuthenticated, user, loading: authLoading } = useAuth() as any
  const router = useRouter()

  const [stats, setStats] = useState<any>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'users'>('overview')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user?.role !== 'admin') {
        router.push('/')
      } else {
        fetchAdminData()
      }
    }
  }, [isAuthenticated, authLoading, user, router])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/api/admin/ws' + (token ? `?token=${encodeURIComponent(token)}` : '');
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'analysis_completed') {
          // Update stats dynamically
          setStats((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              total_analyses: prev.total_analyses + 1,
              ai_count: payload.data.verdict === 'ai_generated' ? prev.ai_count + 1 : prev.ai_count,
              human_count: payload.data.verdict === 'human_made' ? prev.human_count + 1 : prev.human_count
            };
          });
          
          // Prepend to analyses list
          setAnalyses((prev) => {
            const newAnalysis = {
              id: payload.data.id,
              filename: "Real-time update",
              file_type: payload.data.file_type,
              verdict: payload.data.verdict,
              status: payload.data.status,
              created_at: new Date().toISOString()
            };
            return [newAnalysis, ...prev].slice(0, 50);
          });
        } else if (payload.event === 'user_signup') {
          setStats((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              total_users: prev.total_users + 1
            };
          });
        }
      } catch (err) {
        console.error("WebSocket message parse error", err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, analysesRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/analyses'),
        api.get('/api/admin/users')
      ])
      
      setStats(statsRes.data)
      setAnalyses(analysesRes.data)
      setUsers(usersRes.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-[var(--color-accent-real)]" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center mt-20">{error}</div>
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-10 h-10 text-[var(--color-accent-real)]" />
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Admin Dashboard
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-[var(--border-color)]">
        <button 
          onClick={() => setTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'overview' ? 'border-[var(--color-accent-real)] text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          Overview & Activity
        </button>
        <button 
          onClick={() => setTab('users')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'users' ? 'border-[var(--color-accent-real)] text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          User Management
        </button>
      </div>

      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-[20px] border border-white/10 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 font-medium">Total Users</p>
                <Users className="text-blue-400" size={20} />
              </div>
              <p className="text-3xl font-bold">{stats?.total_users}</p>
            </div>
            
            <div className="glass p-6 rounded-[20px] border border-[var(--color-accent-real)]/30 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-real)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 font-medium">VIP Users</p>
                <Activity className="text-[var(--color-accent-real)]" size={20} />
              </div>
              <p className="text-3xl font-bold">{stats?.vip_users}</p>
            </div>
            
            <div className="glass p-6 rounded-[20px] border border-white/10 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 font-medium">Total Analyses</p>
                <FileCheck className="text-green-400" size={20} />
              </div>
              <p className="text-3xl font-bold">{stats?.total_analyses}</p>
            </div>
            
            <div className="glass p-6 rounded-[20px] border border-[var(--color-accent-ai)]/30 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-ai)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 font-medium">AI Detected</p>
                <Brain className="text-[var(--color-accent-ai)]" size={20} />
              </div>
              <p className="text-3xl font-bold">{stats?.ai_count}</p>
            </div>
          </div>

          {/* Activity Feed */}
          <h2 className="text-2xl font-bold mb-6">Global Activity Feed</h2>
          <div className="glass rounded-[24px] border border-[var(--border-color)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-6 py-4 font-medium">File</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Verdict</th>
                    <th className="px-6 py-4 font-medium">Confidence</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {analyses.map((a, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm max-w-[200px] truncate">{a.filename}</td>
                      <td className="px-6 py-4 text-sm capitalize">{a.file_type}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          a.verdict === 'ai_generated' ? 'bg-[var(--color-accent-ai)]/20 text-[var(--color-accent-ai)]' :
                          a.verdict === 'human_made' ? 'bg-[var(--color-accent-real)]/20 text-[var(--color-accent-real)]' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {a.verdict ? a.verdict.replace('_', ' ').toUpperCase() : a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {a.confidence_score ? `${(a.confidence_score * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {analyses.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent activity.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold mb-6">User Management</h2>
          <div className="glass rounded-[24px] border border-[var(--border-color)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-sm uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Plan</th>
                    <th className="px-6 py-4 font-medium">Analyses</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{u.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded border text-xs font-medium ${u.role === 'admin' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-gray-500/50 text-gray-400'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.plan === 'vip' ? 'bg-[var(--color-accent-real)]/20 text-[var(--color-accent-real)] border border-[var(--color-accent-real)]/30' : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {u.plan.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">{u.analyses_count}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
