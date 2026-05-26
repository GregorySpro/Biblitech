import api from './api'

export interface LoginDTO {
  email: string
  mot_de_passe: string
}

export interface LoginResponse {
  token: string
  refresh_token: string
}

export const authService = {
  login: (data: LoginDTO) =>
    api.post<LoginResponse>('/api/login', data).then(r => r.data),

  // Exchange a refresh token for a new access + refresh token pair
  refresh: (refreshToken: string) =>
    api.post<LoginResponse>('/api/token/refresh', { refresh_token: refreshToken }).then(r => r.data),

  // Invalidate the refresh token server-side, then clear localStorage
  logout: async (refreshToken: string | null) => {
    if (refreshToken) {
      await api.post('/api/logout', { refresh_token: refreshToken }).catch(() => {
        // Ignore server errors on logout — local cleanup happens regardless
      })
    }
    localStorage.removeItem('biblitech_token')
    localStorage.removeItem('biblitech_refresh_token')
  },
}
