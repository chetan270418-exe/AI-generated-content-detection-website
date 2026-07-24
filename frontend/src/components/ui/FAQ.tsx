import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How accurate is the AI Content Detector?",
      answer: "Our AI Content Detector uses state-of-the-art transformer models (like ViT and RoBERTa) fine-tuned on millions of data points. It achieves over 95% accuracy on standard benchmarks. However, like any AI tool, it provides a probabilistic assessment and should be used alongside human judgment, not as absolute proof."
    },
    {
      question: "What types of files are supported?",
      answer: "For images, we support JPG, PNG, WebP, and HEIC. For text, you can paste up to 10,000 characters directly. We also support extracting content from PDF documents, audio files (MP3, WAV), and video files (MP4, AVI)."
    },
    {
      question: "Can it detect ChatGPT and Midjourney content?",
      answer: "Yes. Our text models are specifically trained to detect patterns from modern LLMs like ChatGPT, Claude, and Gemini (including perplexity and burstiness analysis). Our image models are trained on artifacts left by diffusion models like Midjourney, DALL-E 3, and Stable Diffusion."
    },
    {
      question: "What happens to the files I upload?",
      answer: "Your privacy is our priority. Files are processed securely, analyzed in memory, and immediately deleted from our servers after the analysis is complete. We do not use your uploads to train our models."
    }
  ]

  return (
    <section className="mb-24 max-w-3xl mx-auto">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
      >
        Frequently Asked Questions
      </motion.h2>
      
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-[16px] border border-white/10 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-bold text-lg">{faq.question}</span>
              <ChevronDown 
                className={`transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-[var(--color-accent-real)]' : 'text-gray-500'}`} 
              />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 pb-5 pt-1 text-[var(--text-muted)] leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
