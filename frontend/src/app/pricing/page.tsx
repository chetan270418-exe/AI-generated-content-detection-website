'use client'

import { useState, useEffect } from 'react'
import { subscriptionApi } from '@/lib/api'
import { Check, Zap, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState('')
  const { user } = useAuth() as any
  const router = useRouter()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    const fetchStatus = async () => {
      try {
        const data = await subscriptionApi.getStatus()
        setStatus(data)
      } catch (err: any) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      fetchStatus()
    } else {
      router.push('/login')
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [user, router])

  const handleUpgrade = async () => {
    setError('')
    setProcessing(true)
    
    try {
      const order = await subscriptionApi.createOrder()
      
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Dictator Pro",
        description: "VIP Subscription for Unlimited AI Detection",
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            await subscriptionApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            window.location.reload()
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Payment verification failed')
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#00d4ff"
        }
      }
      
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response: any){
        setError(`Payment Failed: ${response.error.description}`)
      })
      rzp.open()
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize payment')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="flex-grow flex justify-center items-center h-[70vh]">
      <Loader2 className="animate-spin w-10 h-10 text-[#00d4ff]" />
    </div>
  )

  const isVip = status?.plan === 'vip'

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-16 pt-24 overflow-hidden">
      {/* Background Radial Glow matching Stitch redesign */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[800px] rounded-full border border-[#00d4ff]/20 bg-gradient-to-r from-[#00d4ff]/10 to-[#8b5cf6]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 text-center mb-14 max-w-3xl">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl">
          {isVip 
            ? "You are currently enjoying full Dictator VIP access." 
            : "Upgrade to VIP for unlimited access and priority processing."}
        </p>
      </div>

      {error && (
        <div className="relative z-10 max-w-2xl w-full mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center text-sm font-medium">
          {error}
        </div>
      )}

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Free Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 sm:p-10 rounded-[32px] border border-white/10 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Free Trial</h2>
            <div className="text-5xl font-black text-white mb-8">
              $0<span className="text-base text-gray-400 font-normal"> /mo</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>Up to 20 content analyses</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>Image and Text support only</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>Max 10MB per file</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-500">
                <Check className="text-gray-600 shrink-0" size={18} />
                <span>Standard processing speed</span>
              </li>
            </ul>
          </div>

          <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center font-bold text-gray-400 text-sm">
            {!isVip ? 'Current Plan' : 'Free Tier'}
          </div>
        </motion.div>

        {/* VIP Pro Plan matching Stitch redesign with 3D Lightning */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass relative p-8 sm:p-10 rounded-[32px] border-2 border-[#00d4ff]/60 shadow-[0_0_50px_rgba(0,212,255,0.25)] flex flex-col justify-between bg-[#0e1424]/90"
        >
          {/* Floating 3D Lightning Badge */}
          <div className="absolute -top-7 right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] p-[2px] shadow-[0_0_25px_rgba(0,212,255,0.6)] animate-float">
            <div className="w-full h-full bg-[#0e1424] rounded-[14px] flex items-center justify-center text-[#00d4ff]">
              <Zap size={28} fill="#00d4ff" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              Dictator VIP <Zap className="text-[#00d4ff]" size={22} fill="#00d4ff" />
            </h2>
            <div className="text-5xl font-black text-[#00d4ff] mb-8 drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]">
              ₹199<span className="text-base text-gray-400 font-normal"> /mo</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm text-white font-medium">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>Unlimited content analyses</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-200">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>All formats (Image, Text, PDF, Video, Audio)</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-200">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>Max 50MB per file</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-200">
                <Check className="text-[#00d4ff] shrink-0" size={18} />
                <span>Batch upload (up to 10 files)</span>
              </li>
            </ul>
          </div>

          {isVip ? (
            <div className="w-full py-4 rounded-2xl bg-[#00d4ff]/20 border border-[#00d4ff]/40 text-[#00d4ff] text-center font-extrabold text-sm flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Active VIP Subscription
            </div>
          ) : (
            <button 
              onClick={handleUpgrade}
              disabled={processing}
              className="w-full py-4 rounded-2xl bg-[#00d4ff] hover:bg-[#33ddff] text-black font-extrabold text-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(0,212,255,0.5)] flex justify-center items-center gap-2"
            >
              {processing ? <Loader2 className="animate-spin text-black" size={20} /> : 'Upgrade Now'}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
