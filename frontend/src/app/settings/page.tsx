'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { settingsApi } from '@/lib/api'
import { 
  Settings as SettingsIcon, Bell, Shield, Sliders, Layers, Check, 
  Loader2, User as UserIcon, Key, Copy, RefreshCw, Clock, 
  Smartphone, Mail, Lock, Zap, Eye, EyeOff, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Section = 'account' | 'notifications' | 'security' | 'preferences' | 'integrations'

function Toggle({ value, onChange, color = "#00d4ff" }: { value: boolean; onChange: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-14 h-8 rounded-full relative p-1 duration-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/40"
      style={{ backgroundColor: value ? color : '#374151', boxShadow: value ? `0 0 15px ${color}60` : 'none' }}
    >
      <div className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

function ToggleRow({ label, desc, value, onChange, color }: { label: string; desc: string; value: boolean; onChange: () => void; color?: string }) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/8 hover:border-white/15 transition-colors">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} color={color} />
    </div>
  )
}

const sectionPanelVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15 } }
}

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth() as any
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<Section>('account')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [apiAccess, setApiAccess] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(false)
  const [reducedAnimations, setReducedAnimations] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState('')

  const loginHistory = [
    { ip: '103.21.244.0', location: 'Mumbai, IN', device: 'Chrome / Windows', time: '2 minutes ago', current: true },
    { ip: '103.21.244.0', location: 'Mumbai, IN', device: 'Chrome / Windows', time: '2 days ago', current: false },
    { ip: '192.168.1.1', location: 'New Delhi, IN', device: 'Safari / iPhone', time: '5 days ago', current: false },
  ]

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings()
        setEmail(data.email || '')
        setUsername(data.username || '')
        setEmailAlerts(data.email_alerts ?? true)
        setPushNotifications(data.push_notifications ?? true)
        setTwoFactor(data.two_factor ?? false)
        setApiAccess(data.api_access ?? false)
      } catch {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [isAuthenticated])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSavedSuccess(false)
    try {
      await settingsApi.updateSettings({
        username,
        email_alerts: emailAlerts,
        push_notifications: pushNotifications,
        two_factor: twoFactor,
        api_access: apiAccess,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const key = 'sk_live_' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setApiKey(key)
    setShowApiKey(true)
  }

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-[#00d4ff]" />
      </div>
    )
  }

  const NAV_ITEMS: { id: Section; label: string; icon: any }[] = [
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'integrations', label: 'Integrations', icon: Layers },
  ]

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-[#00d4ff]/10 via-[#8b5cf6]/10 to-[#ff3dff]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="text-center mb-8">
          <span className="text-[#00d4ff] font-mono text-xs uppercase tracking-widest bg-[#00d4ff]/10 px-3 py-1 rounded-full border border-[#00d4ff]/20">
            System Preferences
          </span>
          <h1 className="text-4xl font-black text-white mt-3 flex items-center justify-center gap-3">
            Settings <SettingsIcon className="text-[#00d4ff] animate-spin-slow" size={32} />
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Main Card Container */}
        <div className="glass rounded-[32px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-[#0e1424]/85 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
          {/* Sidebar */}
          <div className="md:col-span-4 border-r border-white/10 p-6 space-y-1.5 bg-black/30">
            {NAV_ITEMS.map((s) => {
              const Icon = s.icon
              const isActive = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {s.label}
                  </span>
                  {isActive && <ChevronRight size={14} />}
                </button>
              )
            })}
          </div>

          {/* Panel Content */}
          <div className="md:col-span-8 p-8 sm:p-10 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                variants={sectionPanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full flex flex-col gap-6"
              >
                {/* ===== ACCOUNT ===== */}
                {activeSection === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Account Details</h3>
                      <p className="text-sm text-gray-400">Manage your profile information.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Username</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Your username"
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00d4ff] placeholder:text-gray-600 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            readOnly
                            value={email}
                            className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-gray-400 text-sm cursor-not-allowed"
                          />
                          <button className="px-4 py-3 bg-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/20 transition-colors whitespace-nowrap">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/8">
                      <div className="flex items-center gap-3 mb-3">
                        <Lock size={16} className="text-gray-400" />
                        <p className="text-sm font-bold text-white">Password</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Last changed: Never</p>
                      <button className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-bold text-white transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                )}

                {/* ===== NOTIFICATIONS ===== */}
                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Notifications</h3>
                      <p className="text-sm text-gray-400">Control how and when we contact you.</p>
                    </div>
                    <div className="space-y-3">
                      <ToggleRow label="Email Alerts" desc="Receive scan completion notifications via email" value={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
                      <ToggleRow label="Push Notifications" desc="Real-time browser alerts for analysis results" value={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
                      <ToggleRow label="Weekly Digest" desc="Get a weekly summary of your detection activity" value={autoSave} onChange={() => setAutoSave(!autoSave)} color="#8b5cf6" />
                    </div>
                    <div className="p-5 bg-[#00d4ff]/5 rounded-2xl border border-[#00d4ff]/15">
                      <div className="flex items-start gap-3">
                        <Mail size={16} className="text-[#00d4ff] mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-300 leading-relaxed">
                          We only send notifications directly related to your account activity. We will never send marketing emails or share your data with third parties.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== SECURITY ===== */}
                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Security</h3>
                      <p className="text-sm text-gray-400">Protect your account from unauthorized access.</p>
                    </div>
                    <div className="space-y-3">
                      <ToggleRow
                        label="Two-Factor Authentication"
                        desc="Require an OTP email code on every login"
                        value={twoFactor}
                        onChange={() => setTwoFactor(!twoFactor)}
                        color="#10b981"
                      />
                    </div>

                    {/* Login History */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-gray-400" />
                        <h4 className="text-sm font-bold text-white">Login History</h4>
                      </div>
                      <div className="space-y-2">
                        {loginHistory.map((log, i) => (
                          <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${log.current ? 'bg-[#00d4ff]/5 border-[#00d4ff]/20' : 'bg-white/[0.02] border-white/8'}`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <Smartphone size={13} className="text-gray-400" />
                                <p className="text-xs font-bold text-white">{log.device}</p>
                                {log.current && <span className="text-[10px] font-bold text-[#00d4ff] bg-[#00d4ff]/10 px-2 py-0.5 rounded-full">Current</span>}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{log.ip} · {log.location}</p>
                            </div>
                            <p className="text-xs text-gray-500">{log.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== PREFERENCES ===== */}
                {activeSection === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Preferences</h3>
                      <p className="text-sm text-gray-400">Customize your experience and performance settings.</p>
                    </div>
                    <div className="space-y-3">
                      <ToggleRow
                        label="Performance Mode"
                        desc="Disable heavy 3D animations to save RAM and CPU"
                        value={performanceMode}
                        onChange={() => setPerformanceMode(!performanceMode)}
                        color="#f59e0b"
                      />
                      <ToggleRow
                        label="Reduced Animations"
                        desc="Use minimal transitions for accessibility and speed"
                        value={reducedAnimations}
                        onChange={() => setReducedAnimations(!reducedAnimations)}
                        color="#f59e0b"
                      />
                      <ToggleRow
                        label="Auto-Save Results"
                        desc="Automatically save all analysis results to history"
                        value={autoSave}
                        onChange={() => setAutoSave(!autoSave)}
                      />
                    </div>
                    <div className="p-5 bg-[#f59e0b]/5 rounded-2xl border border-[#f59e0b]/15">
                      <div className="flex items-start gap-3">
                        <Zap size={16} className="text-[#f59e0b] mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-300 leading-relaxed">
                          <strong className="text-white">Performance Mode</strong> disables the 3D particle globe on the landing page and reduces GPU-intensive effects. Recommended for low-RAM devices (&lt;8GB).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== INTEGRATIONS ===== */}
                {activeSection === 'integrations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Integrations & API</h3>
                      <p className="text-sm text-gray-400">Connect Dictator to your own tools and pipelines.</p>
                    </div>
                    <div className="space-y-3">
                      <ToggleRow
                        label="API Access"
                        desc="Enable programmatic access via API keys"
                        value={apiAccess}
                        onChange={() => setApiAccess(!apiAccess)}
                        color="#8b5cf6"
                      />
                    </div>

                    {apiAccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="p-5 bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 rounded-2xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Key size={15} className="text-[#8b5cf6]" />
                              <p className="text-sm font-bold text-white">Your API Key</p>
                            </div>
                            <button
                              onClick={generateApiKey}
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                              <RefreshCw size={12} />
                              Regenerate
                            </button>
                          </div>

                          {apiKey ? (
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-300 truncate">
                                {showApiKey ? apiKey : apiKey.slice(0, 12) + '•'.repeat(32)}
                              </code>
                              <button onClick={() => setShowApiKey(!showApiKey)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                {showApiKey ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />}
                              </button>
                              <button onClick={copyKey} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                {copiedKey ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} className="text-gray-400" />}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={generateApiKey}
                              className="w-full py-3 bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 border border-[#8b5cf6]/30 rounded-xl text-sm font-bold text-[#8b5cf6] transition-colors"
                            >
                              Generate API Key
                            </button>
                          )}
                        </div>

                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/8">
                          <p className="text-xs font-bold text-white mb-2">Quick Start</p>
                          <pre className="text-xs text-gray-400 font-mono overflow-x-auto leading-relaxed">
{`curl -X POST https://api.dictator.ai/v1/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@image.jpg"`}
                          </pre>
                        </div>
                      </motion.div>
                    )}

                    {!apiAccess && (
                      <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/8 text-center">
                        <Key size={24} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Enable API Access above to generate your API key and connect Dictator to external tools.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Save Button — shown for sections that have saveable state */}
                {['account', 'notifications', 'security', 'integrations'].includes(activeSection) && (
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10 mt-auto">
                    {savedSuccess && (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Check size={16} /> Saved Successfully
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-8 py-3.5 rounded-2xl bg-[#00d4ff] hover:bg-[#33ddff] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(0,212,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin text-black" size={18} /> : (
                        <>Save Changes <Check size={18} /></>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
