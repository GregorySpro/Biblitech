import api from './api'
import type { Pret } from '../types'

export interface CreatePretDTO {
  exemplaire_id: number
  utilisateur_id: number
}

export interface PretWithDetails extends Pret {
  adherentNom?: string
  livretitre?: string
  codeExemplaire?: string
}

export const pretService = {
  // List all loans for current library
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<Pret[]>('/api/prets', { params }).then(r => r.data),

  // Get single loan
  getById: (id: number) =>
    api.get<Pret>(`/api/prets/${id}`).then(r => r.data),

  // Get loans for specific member
  getByMember: (memberId: number) =>
    api.get<Pret[]>(`/api/prets/adherent/${memberId}`).then(r => r.data),

  // Get overdue loans
  getOverdue: () =>
    api.get<Pret[]>('/api/prets/retards').then(r => r.data),

  // Create loan
  create: (data: CreatePretDTO) =>
    api.post<Pret>('/api/prets', data).then(r => r.data),

  // Register return
  registerReturn: (id: number) =>
    api.patch<Pret>(`/api/prets/${id}/retour`).then(r => r.data),
}
