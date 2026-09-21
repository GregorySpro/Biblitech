import api from './api'
import type { DemandeMigration } from '../types'

export interface CreateDemandeMigrationDTO {
  bibliotheque_cible_id: number
  motif?: string
}

export interface RejectDemandeMigrationDTO {
  motif?: string
}

function validateId(id: number | undefined): void {
  if (id === undefined || id <= 0 || !Number.isInteger(id)) {
    throw new Error('ID invalide')
  }
}

export const demandesMigrationService = {
  getAll: () => api.get<DemandeMigration[]>('/api/demandes-migration').then(r => r.data),

  getById: (id: number) => {
    validateId(id)
    return api.get<DemandeMigration>(`/api/demandes-migration/${id}`).then(r => r.data)
  },

  create: (data: CreateDemandeMigrationDTO) => {
    if (data.bibliotheque_cible_id <= 0 || !Number.isInteger(data.bibliotheque_cible_id)) {
      throw new Error('Bibliothèque cible invalide')
    }
    return api.post<DemandeMigration>('/api/demandes-migration', data).then(r => r.data)
  },

  approve: (id: number) => {
    validateId(id)
    return api.patch<DemandeMigration & { prets_forces: number }>(`/api/demandes-migration/${id}/approuver`).then(r => r.data)
  },

  reject: (id: number, data: RejectDemandeMigrationDTO) => {
    validateId(id)
    return api.patch<DemandeMigration>(`/api/demandes-migration/${id}/refuser`, data).then(r => r.data)
  },

  delete: (id: number) => {
    validateId(id)
    return api.delete(`/api/demandes-migration/${id}`)
  },
}
