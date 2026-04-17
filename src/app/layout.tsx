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
  maximumScale: 1,
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
};

import AIAssistant from '@/components/AIAssistant';
import { SettingsProvider } from '@/context/SettingsContext';
import { AdminOnly } from '@/components/auth/AdminOnly';
import NotificationManager from '@/components/NotificationManager';
import PWAInstall from '@/components/PWAInstall';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <NotificationManager />
            <PWAInstall />
            {children}
            <AdminOnly>
              <AIAssistant />
            </AdminOnly>
            <Toaster richColors position="top-right" duration={2500} />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
