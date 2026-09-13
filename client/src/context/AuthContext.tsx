import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, clearToken, getToken, setToken, UNAUTHORIZED_EVENT } from '../lib/api'
import type { AuthResponse, SessionUser } from '../lib/types'

interface AuthContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  isChef: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: SessionUser) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'la-brigade-user'

function loadStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw && getToken() ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(loadStoredUser)

  const updateUser = useCallback((next: SessionUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const persistSession = useCallback(
    (response: AuthResponse) => {
      setToken(response.token)
      updateUser(response.user)
    },
    [updateUser],
  )

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // Au chargement : on rafraîchit l'utilisateur (son rôle a pu changer) et le token
  useEffect(() => {
    if (!getToken()) return
    api
      .get<AuthResponse>('/auth/me')
      .then(persistSession)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) logout()
      })
  }, [persistSession, logout])

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const login = useCallback(
    async (email: string, password: string) => {
      persistSession(await api.post<AuthResponse>('/auth/login', { email, password }))
    },
    [persistSession],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      persistSession(await api.post<AuthResponse>('/auth/register', { name, email, password }))
    },
    [persistSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isChef: user?.role === 'CHEF_TEAM',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
  }
  return ctx
}
