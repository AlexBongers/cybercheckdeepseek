import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cybercheck',
  description: 'Matching platform for cybersecurity interviews between HBO ICT students and entrepreneurs.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
