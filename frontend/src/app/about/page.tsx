"use client";

import React from 'react';
import Navbar from '@/components/ui/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-indigo-500/30">
      <Navbar />

      <main className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none" />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              About Dictator
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              [Placeholder] Add your mission statement or tagline here.
            </p>
          </div>

          {/* Content Section */}
          <div className="space-y-12">
            <section className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl transition hover:border-white/[0.1]">
              <h2 className="text-2xl font-bold mb-4 text-white">Our Mission</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  [Placeholder] Describe the core problem your product solves. Why was Dictator created?
                </p>
                <p>
                  [Placeholder] Add more details about your approach and philosophy towards AI detection.
                </p>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl transition hover:border-white/[0.1]">
              <h2 className="text-2xl font-bold mb-4 text-white">The Technology</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  [Placeholder] Explain the advanced 7-signal ensemble, frequency forensics, and acoustic fingerprinting that powers your platform.
                </p>
              </div>
            </section>
            
            <section className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl transition hover:border-white/[0.1]">
              <h2 className="text-2xl font-bold mb-4 text-white">Our Team</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  [Placeholder] Introduce yourself or your team here.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
