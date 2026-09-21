import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Inject JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('biblitech_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queue of requests waiting for a token refresh to complete
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => (token ? p.resolve(token) : p.reject(error)))
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config ?? {}

    // Only attempt refresh on 401, and not for login/refresh routes themselves
    const isAuthRoute = originalRequest.url?.includes('/api/login') ||
                        originalRequest.url?.includes('/api/token/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem('biblitech_refresh_token')

      if (!refreshToken) {
        // No refresh token → hard logout
        localStorage.removeItem('biblitech_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Another refresh is already in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${token}`,
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post<{ token: string; refresh_token: string }>(
          '/api/token/refresh',
          { refresh_token: refreshToken }
        )

        localStorage.setItem('biblitech_token', data.token)
        localStorage.setItem('biblitech_refresh_token', data.refresh_token)

        api.defaults.headers.common.Authorization = `Bearer ${data.token}`
        processQueue(null, data.token)

        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${data.token}`,
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('biblitech_token')
        localStorage.removeItem('biblitech_refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
