'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { analysisApi } from '@/lib/api'
import { HistoryResponse } from '@/lib/types'
import HistoryTable from '@/components/ui/HistoryTable'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await analysisApi.getHistory(page, 10)
        setData(res)
      } catch (err) {
        setError('Failed to fetch history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [page, isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-grow max-w-6xl mx-auto w-full px-4 py-12"
    >
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
        >
          Analysis History
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--text-muted)]"
        >
          Review your past content authenticity checks.
        </motion.p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[var(--color-accent-real)] w-8 h-8" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <HistoryTable analyses={data?.analyses || []} />

          {data && data.pages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-6 py-2 rounded-[12px] bg-black/40 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-all font-medium"
              >
                Previous
              </button>

              <span className="text-[var(--text-muted)] text-sm font-mono bg-white/5 px-4 py-2 rounded-full border border-white/10">
                Page {page} of {data.pages}
              </span>

              <button
                disabled={page === data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 rounded-[12px] bg-black/40 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-all font-medium"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}