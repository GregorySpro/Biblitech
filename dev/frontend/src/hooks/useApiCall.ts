import { useState, useCallback } from 'react'

interface UseApiCallState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useApiCall<T>(
  fn: () => Promise<T>,
  immediate = true
): UseApiCallState<T> & {
  refetch: () => Promise<void>
  setData: (data: T) => void
} {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState(s => ({
        ...s,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    }
  }, [fn])

  const setData = useCallback((data: T) => {
    setState(s => ({ ...s, data }))
  }, [])

  // Auto-fetch on mount if immediate is true
  if (immediate && state.data === null && !state.loading && state.error === null) {
    // Schedule refetch for next render
    void refetch()
  }

  return { ...state, refetch, setData }
}
