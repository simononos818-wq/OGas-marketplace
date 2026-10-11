import Script from "next/script";
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import BottomNav from '@/components/BottomNav';
import InstallApp from '@/components/InstallApp';
import NotificationManager from '@/components/NotificationManager';
import ErrorBoundary from '@/components/ErrorBoundary';
import CaptureRef from '@/components/CaptureRef';
import TrustFooter from '@/components/TrustFooter';
import { Suspense } from 'react';

const SITE_URL = 'https://ogaslpgmarketplace.com';
const SITE_NAME = 'OGas — Online Gas Refill';
const SITE_DESC =
  "Nigeria's verified LPG marketplace. Buy cooking gas from verified sellers near you with live per-kg prices and weigh-on-scale receipts — no short-filling, no guesswork. Sellers: reach more buyers and build a verifiable sales record.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OGas — Verified LPG Marketplace | Buy Cooking Gas Near You',
    template: '%s | OGas',
  },
  applicationName: 'OGas',
  description: SITE_DESC,
  keywords: [
    'cooking gas', 'LPG Nigeria', 'gas refill near me', 'buy gas online',
    'LPG price per kg', 'gas sellers Delta', 'Ughelli gas', 'Warri gas refill',
    'verified gas sellers', 'OGas',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/ogas-icon.svg',
    apple: '/ogas-icon.svg',
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'OGas — Verified LPG Marketplace',
    description: SITE_DESC,
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OGas — Verified LPG Marketplace',
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
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
  viewportFit: 'cover',
  themeColor: '#16305e',
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OGas Ventures',
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/ogas-logo.png`,
  description: SITE_DESC,
  foundingDate: '2026-06-26',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '20 Ejumeghere Street, Oteri',
    addressLocality: 'Ughelli',
    addressRegion: 'Delta State',
    addressCountry: 'NG',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+2349133110237',
    email: 'support@ogaslpgmarketplace.com',
    contactType: 'customer support',
    availableLanguage: ['English'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
<head>
<meta name="google-site-verification" content="kmZSslXHb-lG8NfZY_eQBhB5oMzJXjk3cWnb6Fynu8Q" />
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
/>
</head>
      <body
        className="bg-black text-white antialiased overscroll-none"
        style={{ fontFamily: 'Roboto, system-ui, -apple-system, sans-serif' }}
      >
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-JM1N75NXSS" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-JM1N75NXSS');
        `}
      </Script>

        <AuthProvider>
          <Suspense fallback={null}><CaptureRef /></Suspense>
          <div className="ogas-phone">
            <main className="min-h-dvh pb-24 [&:has(.ogas-chat-thread)]:pb-0"><ErrorBoundary>{children}</ErrorBoundary><TrustFooter /></main>
            <BottomNav />
            <InstallApp />
            <NotificationManager />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
