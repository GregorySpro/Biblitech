import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface GlobalLoadingContextType {
  isLoading: boolean
  increment: () => void
  decrement: () => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  isLoading: false,
  increment: () => {},
  decrement: () => {},
})

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [counter, setCounter] = useState(0)

  const increment = useCallback(() => setCounter(c => c + 1), [])
  const decrement = useCallback(() => setCounter(c => Math.max(0, c - 1)), [])

  return (
    <GlobalLoadingContext.Provider value={{ isLoading: counter > 0, increment, decrement }}>
      {children}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext)
}
