'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Image as ImageIcon, FileText, File, Video, Shield, Zap, Lock, Mic, Flame, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'

// Dynamically import 3D scene to avoid SSR issues
const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#12121a] z-0" />
})

export default function Home() {
  const { isAuthenticated } = useAuth() as any

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <HeroScene />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-[-10vh]"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Detect{" "}
            <motion.span 
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="bg-[length:200%_auto] bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent-ai)] via-[#a855f7] to-[var(--color-accent-real)]"
            >
              AI-Generated
            </motion.span>{" "}
            Content
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto"
          >
            Upload images, text, PDFs, videos, or audio and get an instant authenticity analysis powered by advanced ML models and visual explainability.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <Link 
              href={isAuthenticated ? "/upload" : "/signup"}
              className="px-8 py-4 rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-white font-semibold text-lg hover:scale-[1.02] transition-all duration-200 glow-cyan w-full sm:w-auto"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 rounded-[12px] glass font-semibold text-lg hover:bg-white/10 transition-all duration-200 w-full sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </motion.div>
        
        <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce">
          <div className="w-[30px] h-[50px] rounded-full border-2 border-white/20 flex justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[var(--bg-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Supported Formats</h2>
            <p className="text-[var(--text-muted)] text-lg">Comprehensive analysis across multiple media types.</p>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: ImageIcon, title: "Image Detection", desc: "ViT-based deep learning combined with Error Level Analysis (ELA) for pixel-level forensics.", color: "var(--color-accent-real)" },
              { icon: FileText, title: "Text Analysis", desc: "RoBERTa classifier with GPT-2 perplexity & burstiness scoring for AI-written text.", color: "var(--color-accent-ai)" },
              { icon: File, title: "PDF Documents", desc: "Full OCR text extraction routed through the RoBERTa pipeline for document-level analysis.", color: "#8b5cf6" },
              { icon: Video, title: "Video Deepfakes", desc: "Frame-by-frame extraction with temporal consistency checks across the timeline.", color: "#ec4899" },
              { icon: Mic, title: "Audio Deepfakes", desc: "HuBERT-based voice clone detection with spectral rolloff & zero-crossing rate analysis.", color: "#f59e0b" },
              { icon: Flame, title: "Visual Heatmaps", desc: "Occlusion sensitivity mapping highlights exactly which regions triggered the AI detector.", color: "#ef4444" }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                }}
                whileHover={{ scale: 1.05, translateY: -5 }}
                className="glass p-6 rounded-[16px] flex flex-col items-start shadow-lg relative overflow-hidden group border border-white/5"
              >
                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500" 
                  style={{ background: `radial-gradient(circle at top right, ${f.color}, transparent)` }}
                />
                
                <div className="p-3 rounded-xl mb-4 bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300" style={{ color: f.color }}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 group-hover:text-white transition-colors">
                  {f.title}
                </h3>
                <p className="text-[var(--text-muted)] group-hover:text-gray-300 transition-colors">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-gradient-to-b from-[var(--bg-color)] to-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Dictator</h2>
            <p className="text-[var(--text-muted)] text-lg">Enterprise-grade AI detection with full transparency.</p>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Shield, title: "Multi-Model Ensemble", desc: "We combine deep learning classifiers with traditional forensic methods like ELA, perplexity scoring, and spectral analysis for higher accuracy.", color: "var(--color-accent-real)" },
              { icon: Zap, title: "Real-Time Dashboard", desc: "Admins can monitor every analysis live via WebSocket-powered dashboards — no page refresh required.", color: "#f59e0b" },
              { icon: BarChart3, title: "Visual Explainability", desc: "Our heatmap engine shows you exactly which pixels or regions in an image the model found suspicious.", color: "#ef4444" }
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
                }}
                className="glass p-8 rounded-[20px] border border-white/5 shadow-xl relative overflow-hidden group"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700" 
                  style={{ background: `radial-gradient(circle at bottom left, ${f.color}, transparent)` }}
                />
                <div className="p-4 rounded-2xl mb-6 bg-white/5 border border-white/10 w-fit group-hover:scale-110 transition-transform duration-300" style={{ color: f.color }}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Disclaimer */}
      <section className="py-12 border-t border-[var(--border-color)] text-center">
        <p className="text-sm text-[var(--text-muted)] max-w-3xl mx-auto px-4">
          * This system provides a probabilistic assessment of whether content appears AI-generated, based on learned patterns and forensic analysis — not a guaranteed determination.
        </p>
      </section>
    </div>
  )
}
