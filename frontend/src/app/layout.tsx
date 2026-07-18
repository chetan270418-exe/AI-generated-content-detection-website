import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import Navbar from '@/components/ui/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'Dictator — AI Content Authenticity Detector',
  description: 'Upload content and get an instant AI authenticity analysis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
