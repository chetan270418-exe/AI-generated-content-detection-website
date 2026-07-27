import { motion } from 'framer-motion'
import { FolderUp, Activity, ClipboardCheck } from 'lucide-react'

export default function HowToUse() {
  const steps = [
    {
      step: "Step 1: Upload Content",
      description: "Drag and drop your file or paste text directly into the detector workspace.",
      icon: <FolderUp size={36} className="text-[#00d4ff]" />
    },
    {
      step: "Step 2: Get Your Analysis",
      description: "Our AI evaluates deep learning features, statistical anomalies, and ELA frequency spectra.",
      icon: <Activity size={36} className="text-[#c084fc]" />
    },
    {
      step: "Step 3: Review Detection Result",
      description: "View likelihood scores, visual heatmaps, and downloadable forensic reports.",
      icon: <ClipboardCheck size={36} className="text-[#10b981]" />
    }
  ]

  return (
    <section className="mt-20 mb-16">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-2xl font-bold text-white mb-8"
      >
        How It Works
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass p-8 rounded-[28px] border border-white/10 hover:border-[#00d4ff]/40 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0e1424] border border-white/10 flex items-center justify-center mb-6 shadow-inner">
              {s.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">{s.step}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {s.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
