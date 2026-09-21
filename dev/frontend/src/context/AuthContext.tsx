import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types'
import { authService } from '../services/authService'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string, refreshToken: string) => void
  logout: () => void
  isAuthenticated: boolean
  manualRefresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

function parseJwt(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as AuthUser
  } catch {
    return null
  }
}

// Trigger refresh 5 minutes before expiry
const REFRESH_MARGIN_MS = 5 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('biblitech_token')
  )
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem('biblitech_refresh_token')
  )
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('biblitech_token')
    return stored ? parseJwt(stored) : null
  })

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  const logout = useCallback(() => {
    clearRefreshTimer()
    const rt = localStorage.getItem('biblitech_refresh_token')
    authService.logout(rt)
    setToken(null)
    setRefreshToken(null)
    setUser(null)
  }, [])

  const login = useCallback((newToken: string, newRefreshToken: string) => {
    localStorage.setItem('biblitech_token', newToken)
    localStorage.setItem('biblitech_refresh_token', newRefreshToken)
    setToken(newToken)
    setRefreshToken(newRefreshToken)
    setUser(parseJwt(newToken))
    // Signal au CguContext de (re)charger les CGU depuis l'API
    window.dispatchEvent(new CustomEvent('biblitech:auth'))
  }, [])

  // Schedule the next silent refresh based on token expiry
  const scheduleRefresh = useCallback((currentToken: string, currentRefreshToken: string) => {
    clearRefreshTimer()
    const parsed = parseJwt(currentToken)
    if (!parsed) return

    const msUntilRefresh = parsed.exp * 1000 - Date.now() - REFRESH_MARGIN_MS

    if (msUntilRefresh <= 0) {
      // Already within margin or expired — refresh immediately
      authService.refresh(currentRefreshToken)
        .then(res => login(res.token, res.refresh_token))
        .catch(() => logout())
      return
    }

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await authService.refresh(currentRefreshToken)
        login(res.token, res.refresh_token)
      } catch {
        logout()
      }
    }, msUntilRefresh)
  }, [login, logout])

  // Schedule refresh whenever the access token changes
  useEffect(() => {
    if (token && refreshToken) {
      scheduleRefresh(token, refreshToken)
    }
    return clearRefreshTimer
  }, [token, refreshToken, scheduleRefresh])

  // Immediate expiry guard on mount
  useEffect(() => {
    if (token && user && user.exp * 1000 <= Date.now()) {
      // Try to silently refresh; if no refresh token available → logout
      if (refreshToken) {
        authService.refresh(refreshToken)
          .then(res => login(res.token, res.refresh_token))
          .catch(() => logout())
      } else {
        logout()
      }
    }
  }, []) // run once on mount only

  const isAuthenticated = !!token && !!user && user.exp * 1000 > Date.now()

  const manualRefresh = useCallback(async () => {
    const rt = localStorage.getItem('biblitech_refresh_token')
    if (!rt) return
    try {
      const res = await authService.refresh(rt)
      login(res.token, res.refresh_token)
    } catch {
      logout()
    }
  }, [login, logout])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, manualRefresh }}>
      {children}
    </AuthContext.Provider>
  )
}
