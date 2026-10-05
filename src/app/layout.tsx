import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Samachar Bharat | हिंदी समाचार',
    template: '%s | Samachar Bharat',
  },
  description: 'भारत की ताज़ा खबरें, राजनीति, खेल, मनोरंजन और अधिक। Samachar Bharat पर पढ़ें सबसे तेज़ और सटीक हिंदी समाचार।',
  keywords: ['हिंदी समाचार', 'news', 'india news', 'hindi news', 'breaking news'],
  authors: [{ name: 'Samachar Bharat' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Samachar Bharat',
  },
  openGraph: {
    title: 'Samachar Bharat | हिंदी समाचार',
    description: 'भारत की ताज़ा खबरें',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

import { Suspense } from 'react';
import AIAssistant from '@/components/AIAssistant';
import { SettingsProvider } from '@/context/SettingsContext';
import NotificationManager from '@/components/NotificationManager';
import PWAInstall from '@/components/PWAInstall';
import TopLoader from '@/components/TopLoader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" data-theme="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6227927412029836" crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.className} bg-slate-50 text-gray-900 min-h-screen selection:bg-red-500 selection:text-white`}>
        <AuthProvider>
          <SettingsProvider>
            <Suspense fallback={null}>
              <TopLoader />
            </Suspense>
            <NotificationManager />
            <PWAInstall />
            {children}
            <AIAssistant />
            <Toaster richColors position="top-right" duration={2500} />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
