'use client'

import { Analysis } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Type, File, Video, ChevronRight } from 'lucide-react'

interface Props {
  analyses: Analysis[];
}

export default function HistoryTable({ analyses }: Props) {
  const router = useRouter()

  if (!analyses || analyses.length === 0) {
    return (
      <div className="glass rounded-[16px] p-12 text-center border-dashed">
        <p className="text-[var(--text-muted)] text-lg mb-4">No analyses found.</p>
        <button 
          onClick={() => router.push('/upload')}
          className="text-[var(--color-accent-real)] hover:underline"
        >
          Start your first analysis
        </button>
      </div>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={18} />
      case 'text': return <Type size={18} />
      case 'pdf': return <File size={18} />
      case 'video': return <Video size={18} />
      default: return <File size={18} />
    }
  }

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'ai_generated':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-ai)]/20 text-[var(--color-accent-ai)] border border-[var(--color-accent-ai)]/30">AI Generated</span>
      case 'human_made':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-real)]/20 text-[var(--color-accent-real)] border border-[var(--color-accent-real)]/30">Human Made</span>
      case 'inconclusive':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-neutral)]/20 text-[var(--color-accent-neutral)] border border-[var(--color-accent-neutral)]/30">Inconclusive</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">Processing</span>
    }
  }

  return (
    <div className="glass rounded-[16px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-[var(--border-color)]">
              <th className="p-4 font-medium text-[var(--text-muted)]">Type</th>
              <th className="p-4 font-medium text-[var(--text-muted)]">File / Input</th>
              <th className="p-4 font-medium text-[var(--text-muted)]">Date</th>
              <th className="p-4 font-medium text-[var(--text-muted)]">Verdict</th>
              <th className="p-4 font-medium text-[var(--text-muted)]">Score</th>
              <th className="p-4 font-medium text-[var(--text-muted)] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/50">
            {analyses.map((a) => (
              <tr 
                key={a.id} 
                onClick={() => router.push(`/result/${a.id}`)}
                className="hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <td className="p-4 text-[var(--text-muted)]">
                  <div className="flex items-center gap-2 capitalize">
                    {getIcon(a.file_type)} {a.file_type}
                  </div>
                </td>
                <td className="p-4 max-w-[200px] truncate">
                  {a.original_filename || 'Text Input'}
                </td>
                <td className="p-4 text-sm text-[var(--text-muted)]">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {getVerdictBadge(a.verdict)}
                </td>
                <td className="p-4 font-mono">
                  {a.confidence_score ? `${Math.round(a.confidence_score * 100)}%` : '-'}
                </td>
                <td className="p-4 text-right text-[var(--text-muted)] group-hover:text-white transition-colors">
                  <ChevronRight size={20} className="inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
