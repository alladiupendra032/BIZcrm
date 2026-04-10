'use client'

import { UserProvider } from '@/lib/UserContext'
import { ToastProvider } from '@/components/ui/Toast'

/**
 * Client-side providers that must wrap the entire app.
 * Placed here (instead of layout.tsx) because layout.tsx is a Server Component.
 * 
 * UserProvider MUST be at the root so every page component can call useUser()
 * before rendering DashboardLayout. If UserProvider is inside DashboardLayout,
 * pages that call useUser() at their top level would always get the default
 * context value { loading: true, user: null } — causing data to never load.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </UserProvider>
  )
}
