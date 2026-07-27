"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Shield, Eye, Zap, Users, Star, Code2, Cpu, FileText, Image, Mic, Video, BarChart2, Layers, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 }
  })
};

const TECH_STACK = [
  { icon: Image, name: "ViT Diffusion Classifier", desc: "Detects SDXL / Midjourney artifacts via Vision Transformer", color: "#00d4ff" },
  { icon: Layers, name: "GAN Classifier", desc: "Catches StyleGAN and older generative model fingerprints", color: "#8b5cf6" },
  { icon: FileText, name: "RoBERTa Text Classifier", desc: "Fine-tuned on human vs AI text corpus for sequence classification", color: "#ff3dff" },
  { icon: Eye, name: "Error Level Analysis", desc: "JPEG compression artifact forensics exposing synthetic generation patterns", color: "#ec4899" },
  { icon: BarChart2, name: "Fourier Frequency Forensics", desc: "DCT spectrum analysis revealing invisible upsampling artifacts in AI images", color: "#f59e0b" },
  { icon: Brain, name: "GPT-2 Perplexity Scoring", desc: "Measures sentence predictability & burstiness to detect LLM-generated text", color: "#ef4444" },
  { icon: Mic, name: "Audio Spectral Fingerprinting", desc: "Spectral rolloff & zero-crossing rate detection for voice-cloned audio", color: "#10b981" },
  { icon: Video, name: "Dynamic Frame Sampling", desc: "Scene-change-aware frame selection for efficient deepfake video analysis", color: "#6366f1" },
];

const STATS = [
  { value: "5+", label: "Detection Signals Per Analysis" },
  { value: "5", label: "Media Types Supported" },
  { value: "Free", label: "Tier Available Forever" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050811] text-gray-200">
      {/* ===== HERO ===== */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-[#ff3dff]/10 via-[#8b5cf6]/8 to-transparent blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
          >
            <span className="text-[#00d4ff] font-mono text-xs uppercase tracking-widest bg-[#00d4ff]/10 px-3 py-1 rounded-full border border-[#00d4ff]/20">
              About the Project
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-5xl md:text-7xl font-black tracking-tight mt-6 mb-6 leading-none"
          >
            About{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff3dff] via-[#c084fc] to-[#00d4ff]">
              Dictator
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Fighting Synthetic Media. One Upload at a Time.
          </motion.p>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <p className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6]">
                  {s.value}
                </p>
                <p className="text-sm text-gray-400 mt-2 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#8b5cf6]/8 blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Why We Built This
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The internet is flooded with AI-generated content. We built a tool to fight back.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                title: "The Problem",
                color: "#ef4444",
                desc: "Deepfake images, AI-written articles, synthetic voice clones, and generated videos are eroding trust in digital information at an unprecedented scale. Traditional detection tools are either inaccurate, inaccessible, or can only handle one media type at a time."
              },
              {
                icon: Shield,
                title: "Our Mission",
                color: "#00d4ff",
                desc: "Build the most accurate, transparent, and accessible AI content detection platform available. By combining multiple independent forensic signals into a single ensemble verdict, we aim to give everyone \u2014 from journalists to students \u2014 the tools to verify what they see."
              },
              {
                icon: Star,
                title: "Our Values",
                color: "#f59e0b",
                desc: "We believe in open-source transparency, forensic explainability, and user privacy. Every detection result comes with a detailed breakdown of exactly which signals fired and why \u2014 no black boxes, no hidden scoring."
              }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-8 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${card.color}15`, color: card.color }}
                >
                  <card.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECHNOLOGY STACK ===== */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-[#090e1f]/50 to-transparent border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-[#ff3dff] font-mono text-xs uppercase tracking-widest bg-[#ff3dff]/10 px-3 py-1 rounded-full border border-[#ff3dff]/20">
              Under the Hood
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">
              Our Detection Technology
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A multi-layer ensemble combining neural networks with classical signal forensics — no single model, no single point of failure.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TECH_STACK.map((tech, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] p-6 hover:border-white/25 hover:-translate-y-1 transition-all duration-300 group"
                style={{ borderColor: `${tech.color}15` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${tech.color}15`, color: tech.color }}
                >
                  <tech.icon size={18} />
                </div>
                <p className="text-sm font-bold text-white mb-2">{tech.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DSA OPTIMIZATIONS ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-gradient-to-r from-[#00d4ff]/5 via-[#8b5cf6]/5 to-[#ff3dff]/5 border border-white/10 rounded-[32px] p-10 md:p-14"
          >
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#8b5cf6]/15 flex items-center justify-center shrink-0">
                <Cpu size={24} className="text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-4">Engineered for Performance</h3>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Every detection request runs through a custom-built <strong className="text-white">O(1) LRU Cache</strong> (Doubly Linked List + Hash Map) so duplicate or near-duplicate content is returned instantly without waking the neural network. A <strong className="text-white">Perceptual Hash (dHash)</strong> algorithm computes a 64-bit image fingerprint using Hamming distance comparisons, enabling near-duplicate deepfake detection even across compression artifacts.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Video analysis uses a <strong className="text-white">Dynamic Frame Sampling Algorithm</strong> \u2014 instead of blindly grabbing every second of footage, it computes mean absolute pixel differences to only extract forensically significant scene-change frames. The backend API is protected by a <strong className="text-white">Sliding Window Rate Limiter</strong> that prevents burst abuse with microsecond-precision timestamp tracking.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#ff3dff]/20 border border-white/15 flex items-center justify-center mx-auto mb-6">
              <Users size={24} className="text-white" />
            </div>
            <span className="text-[#00d4ff] font-mono text-xs uppercase tracking-widest bg-[#00d4ff]/10 px-3 py-1 rounded-full border border-[#00d4ff]/20">
              Built By
            </span>
            <h2 className="text-3xl font-black text-white mt-4 mb-6">The Builders</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Dictator was built as a capstone research project to combat the growing threat of synthetic media. It represents the cutting edge of multimodal AI forensics \u2014 combining computer vision, natural language processing, audio signal analysis, and classical signal forensics into a single, unified detection pipeline accessible to everyone.
            </p>
            <p className="text-gray-500 mt-4 text-sm">
              Built with FastAPI · Next.js · ONNX Runtime · MongoDB · Beanie ODM
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative text-center bg-gradient-to-br from-[#0e1424] to-[#050811] border border-[#00d4ff]/20 rounded-[32px] p-14 overflow-hidden shadow-[0_0_80px_rgba(0,212,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/5 to-[#ff3dff]/5 pointer-events-none" />
            <Code2 size={40} className="text-[#00d4ff] mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">
              Start Detecting AI Content
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Free tier available. No credit card required. Get your first analysis in seconds.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#00d4ff] hover:bg-[#33ddff] text-black font-extrabold text-base shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:scale-[1.04] active:scale-[0.98] transition-all duration-200"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
