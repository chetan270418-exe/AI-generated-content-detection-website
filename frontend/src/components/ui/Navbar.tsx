'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import ThemeToggle from './ThemeToggle'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add scroll listener for sticky nav effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-[var(--border-color)] h-16 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'bg-transparent h-20'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 hover:scale-105 transition-transform inline-block">
              DICTATOR
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {isAuthenticated && (
                <>
                  <Link href="/upload" className="text-sm font-medium hover:text-[var(--color-accent-real)] transition-colors relative group">
                    Analyze
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-accent-real)] transition-all group-hover:w-full"></span>
                  </Link>
                  <Link href="/history" className="text-sm font-medium hover:text-[var(--color-accent-real)] transition-colors relative group">
                    History
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-accent-real)] transition-all group-hover:w-full"></span>
                  </Link>
                  <Link href="/pricing" className="text-sm font-medium hover:text-[var(--color-accent-real)] transition-colors relative group">
                    Pricing
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-accent-real)] transition-all group-hover:w-full"></span>
                  </Link>
                  {(user as any)?.role === 'admin' && (
                    <Link href="/admin" className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors relative group">
                      Admin
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-400 transition-all group-hover:w-full"></span>
                    </Link>
                  )}
                </>
              )}
              
              <div className="flex items-center space-x-4 border-l border-white/10 pl-4">
                <ThemeToggle />
                
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-[var(--text-muted)] font-mono">{user?.email}</span>
                    <button 
                      onClick={logout}
                      className="px-4 py-2 text-sm rounded-[12px] border border-[var(--border-color)] hover:bg-white/5 hover:border-white/20 transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-4 py-2 text-sm font-bold rounded-[12px] bg-gradient-to-r from-[var(--color-accent-real)] to-blue-500 text-black hover:scale-[1.05] transition-transform duration-200 shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[var(--text-color)]"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-[var(--border-color)] overflow-hidden"
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link href="/upload" className="block px-3 py-2 rounded-[12px] hover:bg-white/5 font-medium">Analyze</Link>
                  <Link href="/history" className="block px-3 py-2 rounded-[12px] hover:bg-white/5 font-medium">History</Link>
                  <Link href="/pricing" className="block px-3 py-2 rounded-[12px] hover:bg-white/5 font-medium">Pricing</Link>
                  {(user as any)?.role === 'admin' && (
                    <Link href="/admin" className="block px-3 py-2 rounded-[12px] hover:bg-white/5 font-medium text-red-400">Admin Panel</Link>
                  )}
                  <button onClick={logout} className="block w-full text-left px-3 py-2 rounded-[12px] hover:bg-white/5 font-medium text-red-400">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 rounded-[12px] hover:bg-white/5 font-medium">Login</Link>
                  <Link href="/signup" className="block px-3 py-2 rounded-[12px] bg-[var(--color-accent-real)]/20 text-[var(--color-accent-real)] font-medium">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
