import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cguService } from '../services/cguService'

interface CguContextType {
  currentVersion: string | null
  cguContenu: string | null
  pendingVersion: string | null
  pendingDateEffet: string | null
  isLoading: boolean
  reload: () => void
}

const CguContext = createContext<CguContextType>({
  currentVersion: null,
  cguContenu: null,
  pendingVersion: null,
  pendingDateEffet: null,
  isLoading: false,
  reload: () => {},
})

export function CguProvider({ children }: { children: ReactNode }) {
  const [currentVersion, setCurrentVersion]   = useState<string | null>(null)
  const [cguContenu, setCguContenu]           = useState<string | null>(null)
  const [pendingVersion, setPendingVersion]   = useState<string | null>(null)
  const [pendingDateEffet, setPendingDateEffet] = useState<string | null>(null)
  const [isLoading, setIsLoading]             = useState(false)

  const load = useCallback(async () => {
    const token = localStorage.getItem('biblitech_token')
    if (!token) return

    setIsLoading(true)
    try {
      const [current, pending] = await Promise.allSettled([
        cguService.getCurrent(),
        cguService.getPending(),
      ])

      if (current.status === 'fulfilled') {
        setCurrentVersion(current.value.version)
        setCguContenu(current.value.contenu)
      } else {
        setCurrentVersion(null)
        setCguContenu(null)
      }

      if (pending.status === 'fulfilled' && pending.value) {
        setPendingVersion(pending.value.version)
        setPendingDateEffet(pending.value.date_effet)
      } else {
        setPendingVersion(null)
        setPendingDateEffet(null)
      }
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
    <CguContext.Provider value={{ currentVersion, cguContenu, pendingVersion, pendingDateEffet, isLoading, reload: load }}>
      {children}
    </CguContext.Provider>
  )
}

export function useCgu() {
  return useContext(CguContext)
}
