import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Cookie-based auth client — session stored in cookies, visible to Next.js middleware
// Note: createClientComponentClient must only be called client-side (browser)

let _supabase: ReturnType<typeof createClientComponentClient> | null = null

function getSupabase() {
  // Guard: only instantiate in browser
  if (typeof window === 'undefined') {
    // During SSR, return a minimal stub — actual data fetching happens client-side
    return createClientComponentClient()
  }
  if (!_supabase) {
    _supabase = createClientComponentClient()
  }
  return _supabase
}

// Named export: use this everywhere in the app
export const supabase = new Proxy({} as ReturnType<typeof createClientComponentClient>, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  },
})

export const isSupabaseConfigured = () => Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
