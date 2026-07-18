'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Image as ImageIcon, FileText, File, Video, Shield, Zap, Lock } from 'lucide-react'
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
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-[-10vh]">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
            Detect <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent-ai)] to-[var(--color-accent-real)]">AI-Generated</span> Content
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Upload any image or text and get an instant, probabilistic authenticity analysis using advanced machine learning models.
          </p>
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
        </div>
        
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ImageIcon, title: "Image Detection", desc: "ViT-based analysis and Error Level Analysis (ELA).", active: true },
              { icon: FileText, title: "Text Analysis", desc: "RoBERTa classification with perplexity scoring.", active: true },
              { icon: File, title: "PDF Documents", desc: "Metadata and embedded content analysis.", active: false },
              { icon: Video, title: "Video Deepfakes", desc: "Frame-by-frame temporal consistency check.", active: false }
            ].map((f, i) => (
              <div key={i} className={`glass p-6 rounded-[16px] flex flex-col items-start transition-transform hover:-translate-y-2 ${!f.active && 'opacity-60'}`}>
                <div className={`p-3 rounded-lg mb-4 ${f.active ? 'bg-[var(--color-accent-real)]/20 text-[var(--color-accent-real)]' : 'bg-white/5 text-gray-400'}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  {f.title}
                  {!f.active && <span className="text-[10px] uppercase bg-white/10 px-2 py-1 rounded-full text-xs">Soon</span>}
                </h3>
                <p className="text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
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
