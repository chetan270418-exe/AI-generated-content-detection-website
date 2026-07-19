'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  fileType: string;
  detailedResults?: any;
}

// Renders whatever signals the backend ensemble actually produced, instead of
// hardcoding field names per file type. If you add/remove/rename a detection
// signal in ml/common/ensemble.py later, this chart adapts automatically.
export default function ScoreChart({ fileType, detailedResults }: Props) {
  if (!detailedResults || !Array.isArray(detailedResults.signals)) return null

  const data = detailedResults.signals.map((signal: any) => ({
    name: signal.name,
    score: Math.round((signal.ai_probability ?? 0) * 100),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-lg border border-[var(--border-color)]">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-[var(--color-accent-real)] font-mono">{`${payload[0].value}% AI likelihood`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <div style={{ height: Math.max(160, data.length * 56) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `${val}%`} />
            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={140} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.score > 50 ? 'var(--color-accent-ai)' : 'var(--color-accent-real)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {typeof detailedResults.agreement === 'number' && (
        <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
          Signal agreement: {Math.round(detailedResults.agreement * 100)}%
          {detailedResults.agreement < 0.35 ? ' — signals disagreed, verdict reported as inconclusive' : ''}
        </p>
      )}
    </div>
  )
}
