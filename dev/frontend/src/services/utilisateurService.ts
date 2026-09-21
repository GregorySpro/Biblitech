import api from './api'
import type { Utilisateur } from '../types'

export interface CreateUtilisateurDTO {
  nom: string
  prenom: string
  email: string
  role: string
  mot_de_passe?: string
  bibliotheque_id?: number | null
}

export interface UpdateUtilisateurDTO extends Partial<CreateUtilisateurDTO> {
  current_password?: string
}

function toApiPayload(data: CreateUtilisateurDTO | UpdateUtilisateurDTO) {
  const { mot_de_passe, bibliotheque_id, current_password, ...rest } = data as UpdateUtilisateurDTO & CreateUtilisateurDTO
  return {
    ...rest,
    ...(mot_de_passe ? { password: mot_de_passe } : {}),
    ...(current_password ? { current_password } : {}),
    ...(bibliotheque_id !== undefined ? { bibliotheque_id } : {}),
  }
}

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

  // Search users by partial email (for loan creation)
  byEmail: async (email: string): Promise<Utilisateur[]> => {
    try {
      const r = await api.get<Utilisateur[]>('/api/utilisateurs/by-email', { params: { email } })
      return r.data
    } catch (err: any) {
      throw new Error('Erreur lors de la recherche')
    }
  },

  // Create user
  create: (data: CreateUtilisateurDTO) =>
    api.post<Utilisateur>('/api/utilisateurs', toApiPayload(data)).then(r => r.data),

  // Update own profile (self)
  updateMe: (data: UpdateUtilisateurDTO) =>
    api.patch<Utilisateur>('/api/utilisateurs/me', toApiPayload(data)).then(r => r.data),

  // Delete own account (self, RGPD)
  deleteMe: () =>
    api.delete('/api/utilisateurs/me').then(r => r.data),

  // Update user
  update: (id: number, data: UpdateUtilisateurDTO) => {
    validateId(id)
    return api.put<Utilisateur>(`/api/utilisateurs/${id}`, toApiPayload(data)).then(r => r.data)
  },

  // Delete user (soft delete / anonymization)
  delete: (id: number) => {
    validateId(id)
    return api.delete(`/api/utilisateurs/${id}`).then(r => r.data)
  },
}
