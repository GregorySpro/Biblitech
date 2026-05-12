import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Injecter automatiquement le JWT sur chaque requête
api.interceptors.request.use(config => {
  const token = localStorage.getItem('biblitech_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gérer l'expiration du token globalement
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('biblitech_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
