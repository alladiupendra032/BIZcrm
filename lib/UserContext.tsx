'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export type UserRole = 'Admin' | 'Manager' | 'Team Member' | null

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  organization_id: string | null
}

interface UserContextValue {
  user: UserProfile | null
  role: UserRole
  loading: boolean
  refresh: () => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  role: null,
  loading: true,
  refresh: () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryRef   = useRef<NodeJS.Timeout | null>(null)
  const loadedRef  = useRef(false)

  const loadProfile = async (session: Session | null, isRefresh = false) => {
    // Clear any safety and retry timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (retryRef.current)   clearTimeout(retryRef.current)

    if (!session) {
      setUser(null)
      setLoading(false)
      loadedRef.current = false
      return
    }

    // Show spinner only on first load — not on token‑refresh events
    const showSpinner = !loadedRef.current || isRefresh
    if (showSpinner) setLoading(true)

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, name, email, role, organization_id')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned — not fatal (new signup)
        console.error('[UserContext] profile fetch error:', error.message)
      }

      if (profile) {
        setUser(profile as UserProfile)
        loadedRef.current = true
      } else {
        // No profile yet (e.g. brand‑new signup before trigger fires)
        // Build minimal stub from auth data and retry in 1 second
        setUser({
          id:              session.user.id,
          email:           session.user.email ?? null,
          name:            session.user.user_metadata?.full_name ?? null,
          role:            null,
          organization_id: null,
        })

        // Retry once in 1.5 s — the signup DB trigger may not have fired yet
        if (!loadedRef.current) {
          retryRef.current = setTimeout(() => {
            loadProfile(session)
          }, 1500)
        }
      }
    } catch (err) {
      console.error('[UserContext] unexpected error:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Safety net: if still loading after 10 s, force‑resolve
    timeoutRef.current = setTimeout(() => {
      console.warn('[UserContext] safety timeout — forcing loading=false')
      setLoading(false)
    }, 10000)

    // Primary: fire immediately with current session, then on every auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadProfile(session)
      }
    )

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (retryRef.current)   clearTimeout(retryRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = async () => {
    loadedRef.current = false
    const { data: { session } } = await supabase.auth.getSession()
    await loadProfile(session, true)
  }

  return (
    <UserContext.Provider value={{ user, role: user?.role ?? null, loading, refresh }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserRole(): UserRole {
  return useContext(UserContext).role
}

export function useUser() {
  return useContext(UserContext)
}
