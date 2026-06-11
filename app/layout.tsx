import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { Logo } from '../components/Logo'

export const metadata: Metadata = {
  title: 'OGas - Gas Delivery Nigeria',
  description: 'Order cooking gas delivery anywhere in Nigeria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <Link href="/buy" className="flex items-center gap-3">
            <Logo variant="icon" size="sm" />
            <span className="text-white font-bold text-xl tracking-tight">OGas</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/buy" className="text-gray-300 hover:text-white transition-colors">Buy Gas</Link>
            <Link href="/orders" className="text-gray-300 hover:text-white transition-colors">My Orders</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
