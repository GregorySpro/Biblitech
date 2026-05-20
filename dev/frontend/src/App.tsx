import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './pages/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CataloguePage } from './pages/CataloguePage'
import { AdherentsPage } from './pages/AdherentsPage'
import { PretsPage } from './pages/PretsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/catalogue"  element={<CataloguePage />} />
            <Route path="/prets"      element={<PretsPage />} />
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
              <Route path="/adherents" element={<AdherentsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}