import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

function parseJwt(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('biblitech_token')
  )
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('biblitech_token')
    return stored ? parseJwt(stored) : null
  })

  const login = useCallback((newToken: string) => {
    localStorage.setItem('biblitech_token', newToken)
    setToken(newToken)
    setUser(parseJwt(newToken))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('biblitech_token')
    setToken(null)
    setUser(null)
  }, [])

  // Déconnexion automatique si le token est expiré
  useEffect(() => {
    if (token && user && user.exp * 1000 <= Date.now()) {
      logout()
    }
  }, [token, user, logout])

  const isAuthenticated = !!token && !!user && user.exp * 1000 > Date.now()

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}
