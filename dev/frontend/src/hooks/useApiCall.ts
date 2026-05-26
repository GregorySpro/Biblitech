import { useState, useCallback, useEffect, useRef } from 'react'

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

  // Keep fn ref up-to-date without adding it to effect deps (avoids infinite loop
  // when fn is an inline arrow function that changes reference on every render)
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fnRef.current()
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
  }, []) // stable reference — always calls the latest fn via fnRef

  const setData = useCallback((data: T) => {
    setState(s => ({ ...s, data }))
  }, [])

  // Auto-fetch on mount only (immediate flag checked once)
  useEffect(() => {
    if (immediate) {
      void refetch()
    }
  }, [immediate]) // refetch is stable, no risk of infinite loop

  return { ...state, refetch, setData }
}
