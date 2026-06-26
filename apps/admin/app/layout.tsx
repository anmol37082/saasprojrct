import './globals.css';

import AuthProvider from '../providers/AuthProvider';
import QueryProvider from '../providers/QueryProvider';
import ToastProvider from '../providers/ToastProvider';
import { Manrope, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import type { Metadata } from 'next';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body'
});

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display'
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500']
});

export const metadata: Metadata = {
  title: {
    default: 'SaaS Admin',
    template: '%s | SaaS Admin'
  },
  description: 'Multi-tenant admin console for leads, clients, analytics, and operations.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'SaaS Admin',
    description: 'Multi-tenant admin console for leads, clients, analytics, and operations.',
    type: 'website'
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased font-[family-name:var(--font-body)]" suppressHydrationWarning>
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}





