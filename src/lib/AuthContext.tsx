import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from './api'
import { getToken, setToken, clearToken } from './auth'
import type { UserProfile } from './types'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getToken()
      .then(async (token) => {
        if (!token) return
        try {
          const profile = await api.profile()
          setUser(profile)
        } catch {
          await clearToken()
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(loginValue: string, password: string) {
    setError(null)
    try {
      const res = await api.login(loginValue, password)
      if (!res.token) throw new Error(res.error || 'Неверный логин или пароль')
      await setToken(res.token)
      const profile = await api.profile()
      setUser(profile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа')
      throw e
    }
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      // best-effort
    }
    await clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError: () => setError(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
