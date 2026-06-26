import './globals.css';

import AuthProvider from '../providers/AuthProvider';
import QueryProvider from '../providers/QueryProvider';
import ToastProvider from '../providers/ToastProvider';
import type { Metadata } from 'next';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}





