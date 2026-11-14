import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type User = { id: number; name: string; email: string }
export type Session = { token: string; user: User }

type AuthState = {
  token: string | null
  user: User | null
  setSession: (session: Session) => void
  clear: () => void
}

/**
 * Who is logged in. `persist` saves it to localStorage so a refresh keeps you logged in.
 * Trade-off: a script injected into the page could read the token; acceptable for a demo (see README).
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'auth' },
  ),
)

/** Where to go after login. Only local paths: "//evil.com" or "/\evil.com" would leave the site (open redirect). */
export const safeNext = (next: string | null) => (next && /^\/(?![/\\])/.test(next) ? next : '/')
