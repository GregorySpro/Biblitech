import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface GlobalLoadingContextType {
  isLoading: boolean
  increment: () => void
  decrement: () => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  isLoading: false,
  increment: () => {},
  decrement: () => {},
  withLoading: (fn) => fn(),
})

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [counter, setCounter] = useState(0)

  const increment = useCallback(() => setCounter(c => c + 1), [])
  const decrement = useCallback(() => setCounter(c => Math.max(0, c - 1)), [])

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    increment()
    try {
      return await fn()
    } finally {
      decrement()
    }
  }, [increment, decrement])

  return (
    <GlobalLoadingContext.Provider value={{ isLoading: counter > 0, increment, decrement, withLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext)
}
