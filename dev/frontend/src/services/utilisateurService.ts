import api from './api'
import type { Utilisateur } from '../types'

export interface CreateUtilisateurDTO {
  nom: string
  prenom: string
  email: string
  role: string
  mot_de_passe?: string
}

export interface UpdateUtilisateurDTO extends Partial<CreateUtilisateurDTO> {}

function validateId(id: number | undefined): void {
  if (id === undefined || id <= 0 || !Number.isInteger(id)) {
    throw new Error('ID invalide')
  }
}

export const utilisateurService = {
  // Get current user
  getMe: () =>
    api.get<Utilisateur>('/api/utilisateurs/me').then(r => r.data),

  // List users (admin+ only)
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<Utilisateur[]>('/api/utilisateurs', { params }).then(r => r.data),

  // Get single user
  getById: (id: number) => {
    validateId(id)
    return api.get<Utilisateur>(`/api/utilisateurs/${id}`).then(r => r.data)
  },

  // Create user
  create: (data: CreateUtilisateurDTO) =>
    api.post<Utilisateur>('/api/utilisateurs', data).then(r => r.data),

  // Update user
  update: (id: number, data: UpdateUtilisateurDTO) => {
    validateId(id)
    return api.put<Utilisateur>(`/api/utilisateurs/${id}`, data).then(r => r.data)
  },

  // Delete user (soft delete / anonymization)
  delete: (id: number) => {
    validateId(id)
    return api.delete(`/api/utilisateurs/${id}`).then(r => r.data)
  },
}
