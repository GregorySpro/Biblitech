import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCgu } from '../context/CguContext'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  requirePasswordChange?: boolean
  requireCguAccepted?: boolean
}

export function ProtectedRoute({ allowedRoles, requirePasswordChange = true, requireCguAccepted = true }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const { currentVersion } = useCgu()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Redirige vers le changement de mot de passe obligatoire (sauf si on y est déjà)
  if (requirePasswordChange && user?.must_change_password) {
    return <Navigate to="/premier-login/mot-de-passe" replace />
  }

  // Redirige vers l'acceptation des CGU si la version courante n'a pas été acceptée
  if (requireCguAccepted && user && user.cgu_accepted_version !== currentVersion) {
    return <Navigate to="/premier-login/cgu" replace />
  }

  return <Outlet />
}
