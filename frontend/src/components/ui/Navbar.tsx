'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import ThemeToggle from './ThemeToggle'
import { Menu, X, Shield, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Analyze', href: '/upload', public: false },
    { name: 'History', href: '/history', public: false },
    { name: 'About Us', href: '/about', public: true },
    { name: 'Pricing', href: '/pricing', public: true },
    { name: 'Feedback', href: '/feedback', public: false },
    { name: 'Settings', href: '/settings', public: false },
  ]

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#050811]/85 backdrop-blur-xl border-b border-white/10 h-16 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-gradient-to-b from-[#050811]/90 to-transparent h-20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] p-[1px] shadow-[0_0_20px_rgba(0,212,255,0.4)] group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#0e1322] rounded-[11px] flex items-center justify-center">
                  <Shield size={20} className="text-[#00d4ff] group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <span className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-[#00d4ff] to-[#ff3dff]">
                DICTATOR
              </span>
            </Link>
          </div>
          
          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-full ${
                        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {link.name}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavTab"
                          className="absolute inset-0 bg-[#00d4ff]/15 border border-[#00d4ff]/40 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.3)] -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  )
                })}

                {(user as any)?.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-full ${
                      pathname === '/admin' ? 'text-red-400 font-bold' : 'text-red-400/80 hover:text-red-300'
                    }`}
                  >
                    Admin
                    {pathname === '/admin' && (
                      <motion.div
                        layoutId="activeNavTab"
                        className="absolute inset-0 bg-red-500/15 border border-red-500/40 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/about" className={`px-4 py-2 text-sm font-medium transition-colors rounded-full ${pathname === '/about' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>About Us</Link>
                <Link href="/pricing" className={`px-4 py-2 text-sm font-medium transition-colors rounded-full ${pathname === '/pricing' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Pricing</Link>
              </>
            )}
          </div>

          {/* User & Auth Controls */}
          <div className="hidden md:flex items-center space-x-4 border-l border-white/10 pl-6">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 font-mono max-w-[180px] truncate">
                  {user?.email}
                </span>
                <button 
                  onClick={logout}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-300 rounded-full border border-white/15 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] text-black hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] hover:scale-[1.03] transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="md:hidden bg-[#0a0e1a]/95 backdrop-blur-2xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-2">
              {isAuthenticated ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-2.5 rounded-xl font-medium ${
                        pathname === link.href ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  {(user as any)?.role === 'admin' && (
                    <Link 
                      href="/admin" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-xl font-medium text-red-400 bg-red-500/10 border border-red-500/30"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }} 
                    className="block w-full text-left px-4 py-2.5 rounded-xl font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 font-medium">Login</Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] text-black font-bold text-center">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
