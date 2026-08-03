import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cguService } from '../services/cguService'

interface CguContextType {
  currentVersion: string | null
  cguContenu: string | null
  isLoading: boolean
  reload: () => void
}

const CguContext = createContext<CguContextType>({
  currentVersion: null,
  cguContenu: null,
  isLoading: false,
  reload: () => {},
})

export function CguProvider({ children }: { children: ReactNode }) {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [cguContenu, setCguContenu]         = useState<string | null>(null)
  const [isLoading, setIsLoading]           = useState(false)

  const load = useCallback(async () => {
    const token = localStorage.getItem('biblitech_token')
    if (!token) return

    setIsLoading(true)
    try {
      const cgu = await cguService.getCurrent()
      setCurrentVersion(cgu.version)
      setCguContenu(cgu.contenu)
    } catch {
      // Aucune CGU en vigueur ou non accessible — on laisse null
      setCurrentVersion(null)
      setCguContenu(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Recharger au login (AuthContext émet cet événement)
  useEffect(() => {
    window.addEventListener('biblitech:auth', load)
    return () => window.removeEventListener('biblitech:auth', load)
  }, [load])

  // Charger au montage si déjà connecté
  useEffect(() => {
    void load()
  }, [load])

  return (
    <CguContext.Provider value={{ currentVersion, cguContenu, isLoading, reload: load }}>
      {children}
    </CguContext.Provider>
  )
}

export function useCgu() {
  return useContext(CguContext)
}
