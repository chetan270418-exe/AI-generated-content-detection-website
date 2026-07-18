'use client'

import { useState, useEffect } from 'react'
import { subscriptionApi } from '@/lib/api'
import { Check, Zap, Loader2 } from 'lucide-react'
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
    // Load Razorpay script
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
      document.body.removeChild(script)
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
            // Reload window to update auth state
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
    <div className="flex-grow flex justify-center items-center h-[60vh]">
      <Loader2 className="animate-spin w-8 h-8 text-[var(--color-accent-real)]" />
    </div>
  )

  const isVip = status?.plan === 'vip'

  return (
    <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-[var(--text-muted)]">
          {isVip 
            ? "You are currently subscribed to the VIP plan." 
            : "Upgrade to VIP for unlimited access and priority processing."}
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass p-8 rounded-[24px] border ${!isVip ? 'border-[var(--color-accent-real)]/30 shadow-[0_0_20px_rgba(0,212,255,0.1)]' : 'border-white/10 opacity-70'}`}
        >
          <h2 className="text-2xl font-bold mb-2">Free Trial</h2>
          <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-[var(--text-muted)] font-normal"> /mo</span></div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-sm">
              <Check className="text-green-400 shrink-0" size={18} />
              <span>Up to 50 content analyses</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="text-green-400 shrink-0" size={18} />
              <span>Image, Text, PDF, and Video support</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="text-green-400 shrink-0" size={18} />
              <span>Basic reporting and history</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
              <Check className="text-gray-500 shrink-0" size={18} />
              <span>Standard processing speed</span>
            </li>
          </ul>

          <div className="w-full py-3 rounded-[12px] bg-white/5 border border-white/10 text-center font-medium">
            {!isVip ? 'Current Plan' : 'Free Tier'}
          </div>
        </motion.div>

        {/* Pro Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass relative p-8 rounded-[24px] border ${isVip ? 'border-[var(--color-accent-real)] shadow-[0_0_30px_rgba(0,212,255,0.2)]' : 'border-[var(--color-accent-real)]/50'}`}
        >
          {isVip && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Active
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            Dictator VIP <Zap className="text-[var(--color-accent-real)]" size={20} fill="currentColor" />
          </h2>
          <div className="text-4xl font-bold mb-6">₹999<span className="text-lg text-[var(--text-muted)] font-normal"> /mo</span></div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-sm font-medium">
              <Check className="text-[var(--color-accent-real)] shrink-0" size={18} />
              <span>Unlimited content analyses</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="text-[var(--color-accent-real)] shrink-0" size={18} />
              <span>Priority processing queue (Zero wait time)</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="text-[var(--color-accent-real)] shrink-0" size={18} />
              <span>Advanced downloadable reports</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Check className="text-[var(--color-accent-real)] shrink-0" size={18} />
              <span>API access for bulk uploads (Coming soon)</span>
            </li>
          </ul>

          {isVip ? (
            <div className="w-full py-3 rounded-[12px] bg-[var(--color-accent-real)]/20 text-[var(--color-accent-real)] text-center font-bold">
              You are VIP
            </div>
          ) : (
            <button 
              onClick={handleUpgrade}
              disabled={processing}
              className="w-full py-3 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black font-bold hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(0,212,255,0.4)] flex justify-center items-center gap-2"
            >
              {processing ? <Loader2 className="animate-spin text-black" /> : 'Upgrade Now'}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
