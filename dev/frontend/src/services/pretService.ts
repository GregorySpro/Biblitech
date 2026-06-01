import api from './api'
import type { Pret } from '../types'

export interface CreatePretDTO {
  exemplaire_id: number
  utilisateur_id: number
  etat_depart?: string
}

export interface PretWithDetails extends Pret {
  adherentNom?: string
  livretitre?: string
  codeExemplaire?: string
}

function validateId(id: number | undefined): void {
  if (id === undefined || id <= 0 || !Number.isInteger(id)) {
    throw new Error('ID invalide')
  }
}

export const pretService = {
  // List all loans for current library
  getAll: (params?: { limit?: number; offset?: number }) => {
    if (params?.limit !== undefined && (params.limit <= 0 || !Number.isInteger(params.limit))) {
      throw new Error('Limite invalide')
    }
    if (params?.offset !== undefined && (params.offset < 0 || !Number.isInteger(params.offset))) {
      throw new Error('Offset invalide')
    }
    return api.get<Pret[]>('/api/prets', { params }).then(r => r.data)
  },

  // Get single loan
  getById: (id: number) => {
    validateId(id)
    return api.get<Pret>(`/api/prets/${id}`).then(r => r.data)
  },

  // Get loans for specific member
  getByMember: (memberId: number) => {
    validateId(memberId)
    return api.get<Pret[]>(`/api/prets/adherent/${memberId}`).then(r => r.data)
  },

  // Get overdue loans
  getOverdue: () =>
    api.get<Pret[]>('/api/prets/retards').then(r => r.data),

  // Create loan
  create: (data: CreatePretDTO) => {
    validateId(data.exemplaire_id)
    validateId(data.utilisateur_id)
    return api.post<Pret>('/api/prets', data).then(r => r.data)
  },

  // Register return
  registerReturn: (id: number, etat_retour?: string) => {
    validateId(id)
    return api.patch<Pret>(`/api/prets/${id}/retour`, { etat_retour }).then(r => r.data)
  },
}
