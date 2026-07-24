import { motion } from 'framer-motion'
import { UploadCloud, Search, CheckCircle2 } from 'lucide-react'

export default function HowToUse() {
  const steps = [
    {
      step: "Step 1",
      title: "Upload an Image or Take a Photo",
      description: "Simply drag and drop an image file into the upload box, or click to browse your device. You can also take a photo directly. The AI Image Detector accepts JPG, PNG, WebP, HEIC, and other common formats.",
      icon: <UploadCloud size={48} className="text-blue-400 mb-4" />
    },
    {
      step: "Step 2",
      title: "Get Your Image Analysis",
      description: "Our AI will analyze the image using advanced detection algorithms. The process takes just a few seconds to identify telltale signs of AI generation or manipulation.",
      icon: <Search size={48} className="text-purple-400 mb-4" />
    },
    {
      step: "Step 3",
      title: "Review the Detection Result",
      description: "View detailed results including the confidence score and classification. Our detector provides transparency into whether an image is real, AI-generated, or digitally edited with clear likelihood percentages.",
      icon: <CheckCircle2 size={48} className="text-green-400 mb-4" />
    }
  ]

  return (
    <section className="mt-24 mb-16">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
      >
        How to Use the AI Image Detector
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="glass p-8 rounded-[24px] border border-white/10 hover:border-white/20 transition-all hover:-translate-y-2"
          >
            <div className="flex flex-col items-center text-center h-32 justify-center mb-6 bg-black/40 rounded-[16px] border border-white/5">
               {s.icon}
            </div>
            <h4 className="text-[var(--color-accent-real)] font-bold mb-2">{s.step}</h4>
            <h3 className="text-xl font-bold mb-4">{s.title}</h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              {s.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
