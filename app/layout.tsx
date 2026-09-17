import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import BottomNav from '@/components/BottomNav';
import InstallApp from '@/components/InstallApp';
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'OGas',
  applicationName: 'OGas',
  description: 'Buy cooking gas from sellers near you.',
  manifest: '/manifest.json',
  icons: {
    icon: '/ogas-icon.svg',
    apple: '/ogas-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OGas',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'google-adsense-account': 'ca-pub-7537556385111201',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0F1B3D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className="bg-black text-white antialiased overscroll-none"
        style={{ fontFamily: 'Roboto, system-ui, -apple-system, sans-serif' }}
      >
        <AuthProvider>
          <div className="ogas-phone">
            <main className="min-h-dvh pb-24 [&:has(.ogas-chat-thread)]:pb-0">{children}</main>
            <BottomNav />
            <InstallApp />
          </div>
        </AuthProvider>
              <Footer />
      </body>
    </html>
  );
}
