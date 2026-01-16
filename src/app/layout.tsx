import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Grande Sports | Book Training Sessions',
  description: 'Book soccer training sessions with Grande Sports. Private, semi-private, and group sessions available.',
  icons: {
    icon: '/logo-black.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-body`}>{children}</body>
    </html>
  )
}
