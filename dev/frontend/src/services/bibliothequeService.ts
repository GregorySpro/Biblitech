import api from './api'
import type { Bibliotheque } from '../types'

function validateId(id: number | undefined): void {
  if (id === undefined || id <= 0 || !Number.isInteger(id)) {
    throw new Error('ID invalide')
  }
}

export const bibliothequeService = {
  getAll: () => api.get<Bibliotheque[]>('/api/bibliotheques').then(r => r.data),

  getById: (id: number) => {
    validateId(id)
    return api.get<Bibliotheque>(`/api/bibliotheques/${id}`).then(r => r.data)
  },

  create: (data: Partial<Bibliotheque>) => {
    if (!data.nom || data.nom.trim().length === 0) {
      throw new Error('Nom de la bibliothèque requis')
    }
    return api.post<Bibliotheque>('/api/bibliotheques', data).then(r => r.data)
  },

  update: (id: number, data: Partial<Bibliotheque>) => {
    validateId(id)
    return api.put<Bibliotheque>(`/api/bibliotheques/${id}`, data).then(r => r.data)
  },

  setActive: (id: number, active: boolean) => {
    validateId(id)
    return api.patch<Bibliotheque>(`/api/bibliotheques/${id}/activer`, { active }).then(r => r.data)
  },

  delete: (id: number) => {
    validateId(id)
    return api.delete(`/api/bibliotheques/${id}`)
  },
}
