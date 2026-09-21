import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GlobalLoadingProvider } from './context/GlobalLoadingContext'
import { CguProvider } from './context/CguContext'
import { ProtectedRoute } from './pages/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CataloguePage } from './pages/CataloguePage'
import { AdherentsPage } from './pages/AdherentsPage'
import { PretsPage } from './pages/PretsPage'
import { DemandeMigrationPage } from './pages/DemandeMigrationPage'
import { BibliothequeManagementPage } from './pages/BibliothequeManagementPage'
import { MonComptePage } from './pages/MonComptePage'
import { PremierLoginMotDePassePage } from './pages/PremierLoginMotDePassePage'
import { PremierLoginCguPage } from './pages/PremierLoginCguPage'

export default function App() {
  return (
    <GlobalLoadingProvider>
      <AuthProvider>
        <CguProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Routes de premier login (authentifié, sans les guards CGU/password) */}
              <Route element={<ProtectedRoute requirePasswordChange={false} requireCguAccepted={false} />}>
                <Route path="/premier-login/mot-de-passe" element={<PremierLoginMotDePassePage />} />
                <Route path="/premier-login/cgu" element={<PremierLoginCguPage />} />
              </Route>

              {/* Routes protégées avec tous les guards */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"  element={<DashboardPage />} />
                <Route path="/catalogue"  element={<CataloguePage />} />
                <Route path="/prets"      element={<PretsPage />} />
                <Route path="/demandes-migration" element={<DemandeMigrationPage />} />
                <Route path="/mon-compte" element={<MonComptePage />} />
                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                  <Route path="/adherents" element={<AdherentsPage />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                  <Route path="/bibliotheques" element={<BibliothequeManagementPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </CguProvider>
      </AuthProvider>
    </GlobalLoadingProvider>
  )
}
