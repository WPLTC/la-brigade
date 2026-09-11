import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { apiFetch, clearToken, setToken } from '../lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'CHEF_TEAM'
}

interface AuthResponse {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'la-brigade-user'

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser)

  function persistSession(response: AuthResponse) {
    setToken(response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    setUser(response.user)
  }

  async function login(email: string, password: string) {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    persistSession(response)
  }

  async function register(name: string, email: string, password: string) {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    persistSession(response)
  }

  function logout() {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  }
  return ctx
}
