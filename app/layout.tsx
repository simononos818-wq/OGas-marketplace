import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OGas - Gas Delivered to Your Door',
  description: 'Order cooking gas from trusted sellers near you. Fast delivery in Delta State, Nigeria.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OGas',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          <main className="min-h-screen pb-20">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
