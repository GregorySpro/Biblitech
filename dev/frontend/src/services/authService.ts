import api from './api'

export interface LoginDTO {
  email: string
  mot_de_passe: string
}

export interface LoginResponse {
  token: string
}

export const authService = {
  // Login
  login: (data: LoginDTO) =>
    api.post<LoginResponse>('/api/login', data).then(r => r.data),

  // Logout (client-side only, server is stateless)
  logout: async () => {
    localStorage.removeItem('biblitech_token')
  },
}
