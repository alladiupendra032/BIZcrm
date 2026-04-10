import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from './providers'

export const metadata: Metadata = {
  title: 'BizCRM — Business CRM & Operations Management',
  description: 'Manage customers, track deals, assign tasks, and grow your business with BizCRM — the premium CRM for small businesses.',
  keywords: 'CRM, customer management, sales pipeline, task management, business operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Restore theme from localStorage before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('crm-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        {/*
          AppProviders wraps the ENTIRE app with UserProvider + ToastProvider.
          This is critical: page components call useUser() at their top level,
          BEFORE rendering DashboardLayout. With UserProvider only inside
          DashboardLayout, pages always read the default context (loading=true).
          Moving it here ensures all components share one provider instance.
        */}
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
