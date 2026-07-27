'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Users, Activity, Loader2, ShieldCheck, FileCheck, Brain, MessageSquare, CheckCircle2, Circle, ShieldAlert, Download, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { cyberReportApi } from '@/lib/api'

export default function AdminDashboard() {
  const { isAuthenticated, user, loading: authLoading } = useAuth() as any
  const router = useRouter()

  const [stats, setStats] = useState<any>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [cyberReports, setCyberReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'users' | 'feedback' | 'cyber'>('overview')

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
          setStats((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              total_analyses: prev.total_analyses + 1,
              ai_count: payload.data.verdict === 'ai_generated' ? prev.ai_count + 1 : prev.ai_count,
              human_count: payload.data.verdict === 'human_made' ? prev.human_count + 1 : prev.human_count
            };
          });
          
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
      const [statsRes, analysesRes, usersRes, feedbackRes, cyberRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/analyses'),
        api.get('/api/admin/users'),
        api.get('/api/admin/feedback'),
        api.get('/api/admin/cyber-reports')
      ])
      
      setStats(statsRes.data)
      setAnalyses(analysesRes.data)
      setUsers(usersRes.data)
      setFeedbacks(feedbackRes.data)
      setCyberReports(cyberRes.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-[#00d4ff]" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center mt-24">{error}</div>
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Header matching Stitch redesign */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] p-[2px] shadow-[0_0_20px_rgba(0,212,255,0.4)]">
          <div className="w-full h-full bg-[#0e1424] rounded-[14px] flex items-center justify-center text-[#00d4ff]">
            <ShieldCheck size={26} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white">Admin Dashboard</h1>
          <p className="text-xs text-gray-400">Live platform telemetry & telemetry management</p>
        </div>
      </div>

      {/* Navigation Tabs matching Stitch */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        <button 
          onClick={() => setTab('overview')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'overview' ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.2)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview & Activity
        </button>
        <button 
          onClick={() => setTab('users')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'users' ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.2)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          User Management
        </button>
        <button 
          onClick={() => setTab('feedback')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            tab === 'feedback' ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.2)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={16} />
          Feedback
          {feedbacks.filter(f => f.status === 'open').length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {feedbacks.filter(f => f.status === 'open').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setTab('cyber')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            tab === 'cyber' ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShieldAlert size={16} />
          Cyber Reports
          {cyberReports.filter(r => r.status === 'filed').length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {cyberReports.filter(r => r.status === 'filed').length}
            </span>
          )}
        </button>
      </div>

      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* 4 Stat KPI Cards matching Stitch advanced_admin_analytics_view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Users */}
            <div className="glass p-6 rounded-[28px] border border-[#00d4ff]/30 shadow-[0_0_25px_rgba(0,212,255,0.15)] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                  <p className="text-3xl font-black text-white mt-1">{stats?.total_users || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#00d4ff]/15 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                  <Users size={24} />
                </div>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10 mt-4">
                <div className="bg-[#00d4ff] h-full rounded-full w-[85%] shadow-[0_0_10px_#00d4ff]" />
              </div>
              <p className="text-[11px] text-[#00d4ff] mt-2 font-medium">85% Active Rate</p>
            </div>

            {/* Card 2: VIP Users */}
            <div className="glass p-6 rounded-[28px] border border-[#c084fc]/30 shadow-[0_0_25px_rgba(192,132,252,0.15)] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">VIP Users</p>
                  <p className="text-3xl font-black text-white mt-1">{stats?.vip_users || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#c084fc]/15 border border-[#c084fc]/30 flex items-center justify-center text-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.3)]">
                  <Crown size={24} />
                </div>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10 mt-4">
                <div className="bg-[#c084fc] h-full rounded-full w-[45%]" />
              </div>
              <p className="text-[11px] text-[#c084fc] mt-2 font-medium">14% Growth</p>
            </div>

            {/* Card 3: Total Analyses */}
            <div className="glass p-6 rounded-[28px] border border-[#10b981]/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Analyses</p>
                  <p className="text-3xl font-black text-white mt-1">{stats?.total_analyses || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <FileCheck size={24} />
                </div>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10 mt-4">
                <div className="bg-[#10b981] h-full rounded-full w-[65%]" />
              </div>
              <p className="text-[11px] text-[#10b981] mt-2 font-medium">5% Increase</p>
            </div>

            {/* Card 4: AI Detected */}
            <div className="glass p-6 rounded-[28px] border border-[#ff3dff]/30 shadow-[0_0_25px_rgba(255,61,255,0.15)] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Detected</p>
                  <p className="text-3xl font-black text-white mt-1">{stats?.ai_count || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#ff3dff]/15 border border-[#ff3dff]/30 flex items-center justify-center text-[#ff3dff] shadow-[0_0_15px_rgba(255,61,255,0.3)]">
                  <Brain size={24} />
                </div>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10 mt-4">
                <div className="bg-[#ff3dff] h-full rounded-full w-[37%]" />
              </div>
              <p className="text-[11px] text-[#ff3dff] mt-2 font-medium">37% AI Rate</p>
            </div>
          </div>

          {/* Activity Feed matching Stitch */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Global Activity Feed</h2>
            <div className="glass rounded-[28px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/50 text-xs font-bold uppercase text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">File</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Verdict</th>
                      <th className="px-6 py-4">Confidence</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {analyses.map((a, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white max-w-[220px] truncate">{a.filename}</td>
                        <td className="px-6 py-4 capitalize text-gray-300">{a.file_type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${
                            a.verdict === 'ai_generated' ? 'bg-[#ff3dff]/20 text-[#ff3dff] border border-[#ff3dff]/40 shadow-[0_0_10px_rgba(255,61,255,0.3)]' :
                            a.verdict === 'human_made' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.3)]' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {a.verdict ? a.verdict.replace('_', ' ').toUpperCase() : a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-200">
                          {a.confidence_score ? `${(a.confidence_score * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <div className="glass rounded-[28px] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/50 text-xs font-bold uppercase text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Analyses</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-500/20 text-gray-400'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          u.plan === 'vip' ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {u.plan.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-200">{u.analyses_count}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">
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

      {tab === 'feedback' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-bold text-white">User Feedback</h2>
          <div className="glass rounded-[28px] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/50 text-xs font-bold uppercase text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {feedbacks.map((f, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        {f.status === 'open' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <Circle size={8} fill="currentColor" /> Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 size={12} /> Resolved
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{f.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                          {f.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-300 max-w-[280px]">
                        <p className="line-clamp-2">{f.message}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={async () => {
                            try {
                              await api.put(`/api/admin/feedback/${f.id}/resolve`)
                              setFeedbacks(prev => prev.map(fb => 
                                fb.id === f.id ? { ...fb, status: fb.status === 'open' ? 'resolved' : 'open' } : fb
                              ))
                            } catch (err) {
                              console.error(err)
                            }
                          }}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            f.status === 'open' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                          }`}
                        >
                          {f.status === 'open' ? 'Resolve' : 'Reopen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'cyber' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
            <ShieldAlert size={24} /> Cyber Crime Reports
          </h2>
          <div className="glass rounded-[28px] border border-red-500/30 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-red-500/10 text-xs font-bold uppercase text-red-400 border-b border-red-500/20">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">User Email</th>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date Filed</th>
                    <th className="px-6 py-4">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {cyberReports.map((r, i) => (
                    <tr key={i} className="hover:bg-red-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          <Circle size={8} fill="currentColor" /> Filed
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{r.user_email}</td>
                      <td className="px-6 py-4 text-gray-300">{r.platform}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                          {r.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={async () => {
                            try {
                              const blob = await cyberReportApi.downloadPdf(r.id)
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `evidence_${r.id}.pdf`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } catch (err) {
                              console.error(err)
                            }
                          }}
                          className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 hover:bg-[#00d4ff]/30 transition-all flex items-center gap-2"
                        >
                          <Download size={14} /> PDF
                        </button>
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
