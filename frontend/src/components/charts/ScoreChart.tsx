'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  fileType: string;
  detailedResults?: any;
}

export default function ScoreChart({ fileType, detailedResults }: Props) {
  if (!detailedResults) return null

  let data = []

  if (fileType === 'image') {
    data = [
      { name: 'Model Score', score: Math.round(detailedResults.model_output?.confidence * 100) || 0, isAI: detailedResults.model_output?.label?.includes('ai') },
      { name: 'ELA Score', score: Math.round(detailedResults.ela_output?.ela_score * 100) || 0, isAI: true } // ELA score usually indicates AI
    ]
  } else if (fileType === 'text') {
    data = [
      { name: 'Classifier', score: Math.round(detailedResults.model_output?.confidence * 100) || 0, isAI: detailedResults.model_output?.label?.includes('ai') },
      { name: 'Perplexity', score: Math.round(detailedResults.perplexity_output?.perplexity_score * 100) || 0, isAI: true },
      { name: 'Burstiness', score: Math.round(detailedResults.perplexity_output?.burstiness_score * 100) || 0, isAI: true }
    ]
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-lg border border-[var(--border-color)]">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-[var(--color-accent-real)] font-mono">{`${payload[0].value}% AI Probability`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `${val}%`} />
          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={100} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.score > 50 ? 'var(--color-accent-ai)' : 'var(--color-accent-real)'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
