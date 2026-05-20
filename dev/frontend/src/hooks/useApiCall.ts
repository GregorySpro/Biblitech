import { useState, useCallback, useEffect } from 'react'

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
      const errorObj = error instanceof Error ? error : new Error(String(error))
      setState(s => ({
        ...s,
        loading: false,
        error: errorObj,
      }))
      throw errorObj
    }
  }, [fn])

  const setData = useCallback((data: T) => {
    setState(s => ({ ...s, data }))
  }, [])

  // Auto-fetch on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      void refetch()
    }
  }, [immediate, refetch])

  return { ...state, refetch, setData }
}
