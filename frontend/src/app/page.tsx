'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Image as ImageIcon, FileText, File, Video, Shield, Zap, Mic, Flame, BarChart3, ChevronDown, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050811] z-0" />
})

export default function Home() {
  const { isAuthenticated } = useAuth() as any

  return (
    <div className="flex flex-col min-h-screen bg-[#050811]">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden pt-20">
        <HeroScene />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-[#00d4ff]/20 bg-gradient-to-r from-[#00d4ff]/10 via-[#ff3dff]/10 to-[#8b5cf6]/10 blur-3xl animate-pulse-glow" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white mb-8 leading-none"
          >
            Detect{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff3dff] via-[#c084fc] to-[#00d4ff] drop-shadow-[0_0_35px_rgba(255,61,255,0.4)]">
              AI-Generated
            </span>{" "}
            Content
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Instant authenticity forensics across images, text, PDFs, videos, and audio powered by multi-signal deep learning models.
          </motion.p>

          {/* Button Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-flex items-center gap-4 p-2 rounded-full glass border border-white/15 bg-[#0e1424]/80 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Primary CTA */}
            <Link 
              href={isAuthenticated ? "/upload" : "/signup"}
              className="px-8 py-3.5 rounded-full bg-[#00d4ff] hover:bg-[#33ddff] text-black font-bold text-base transition-all duration-300 shadow-[0_0_25px_rgba(0,212,255,0.6)] hover:scale-[1.03] active:scale-[0.98]"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
            </Link>

            {/* Analyze button — goes to /login if not authenticated, /upload if authenticated */}
            <Link 
              href={isAuthenticated ? "/upload" : "/login"}
              className="px-8 py-3.5 rounded-full border border-white/20 hover:border-[#00d4ff]/60 text-white font-medium text-base hover:bg-[#00d4ff]/10 hover:text-[#00d4ff] transition-all duration-300"
            >
              Analyze
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <a 
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border border-white/15 text-gray-400 hover:text-white hover:border-white/30 transition-all duration-300 animate-bounce"
        >
          <ChevronDown size={20} />
        </a>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-[#00d4ff] font-mono text-xs uppercase tracking-widest bg-[#00d4ff]/10 px-3 py-1 rounded-full border border-[#00d4ff]/20">
              Multimodal Forensics
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4">Supported Media Formats</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Comprehensive AI authenticity analysis across all formats.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ImageIcon, title: "Image Forensics", desc: "ViT deep learning combined with Error Level Analysis (ELA) and DCT frequency spectrums.", color: "#00d4ff" },
              { icon: FileText, title: "Text Analysis", desc: "RoBERTa classifier with GPT-2 perplexity & burstiness sentence variance scoring.", color: "#ff3dff" },
              { icon: File, title: "PDF Documents", desc: "Full text and embedded image extraction with document integrity hash generation.", color: "#8b5cf6" },
              { icon: Video, title: "Video Deepfakes", desc: "Dynamic scene-change frame sampling with temporal consistency checks.", color: "#ec4899" },
              { icon: Mic, title: "Audio Cloning", desc: "Spectral rolloff & zero-crossing rate voice clone detection for synthetic audio.", color: "#f59e0b" },
              { icon: Flame, title: "Anomaly Heatmaps", desc: "Occlusion sensitivity maps pointing out exact pixels triggering AI detection.", color: "#ef4444" }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass p-8 rounded-[28px] border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 card-3d-glow group"
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${f.color}15`, borderColor: `${f.color}30`, color: f.color }}
                >
                  <f.icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
                  {f.title}
                  <Sparkles size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: f.color }} />
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-gradient-to-b from-[#050811] via-[#090e1f] to-[#050811] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose Dictator</h2>
            <p className="text-gray-400 text-lg">Enterprise-grade detection built with complete transparency.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Multi-Model Ensemble", desc: "Combines neural classifiers with traditional signal analysis (ELA, perplexity, spectral) for over 95% benchmark accuracy.", color: "#00d4ff" },
              { icon: Zap, title: "Real-Time Monitoring", desc: "Live activity feeds and WebSocket updates let admins inspect platform scans as they happen.", color: "#f59e0b" },
              { icon: BarChart3, title: "Visual Explainability", desc: "Heatmap engines reveal exact pixel regions or sentence segments that triggered AI classification.", color: "#ef4444" }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass p-8 rounded-[28px] border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/5 border border-white/10" style={{ color: f.color }}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500 max-w-3xl mx-auto px-4 leading-relaxed">
          * Dictator provides a probabilistic assessment of whether content appears AI-generated based on statistical and deep learning signals.
        </p>
      </footer>
    </div>
  )
}
