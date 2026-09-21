import api from './api'
import type { Exemplaire } from '../types'

export interface CreateExemplaireDTO {
  livreId: number
  codeExemplaire: string
  statut?: 'disponible' | 'emprunte' | 'hors_service'
  etat?: string
}

export interface UpdateExemplaireDTO extends Partial<Omit<CreateExemplaireDTO, 'livreId'>> {}

function validateId(id: number | undefined): void {
  if (id === undefined || id <= 0 || !Number.isInteger(id)) {
    throw new Error('ID invalide')
  }
}

export const exemplaireService = {
  // List copies for a specific book
  getByLivre: (livreId: number) => {
    validateId(livreId)
    return api.get<Exemplaire[]>('/api/exemplaires', { params: { livreId } }).then(r => r.data)
  },

  // List available copies for a specific book (for loan creation)
  getDisponibles: (livreId: number) => {
    validateId(livreId)
    return api.get<Exemplaire[]>('/api/exemplaires', { params: { livreId, statut: 'disponible' } }).then(r => r.data)
  },

  // Get single copy
  getById: (id: number) => {
    validateId(id)
    return api.get<Exemplaire>(`/api/exemplaires/${id}`).then(r => r.data)
  },

  // Create copy
  create: (data: CreateExemplaireDTO) => {
    if (!data.codeExemplaire?.trim()) {
      throw new Error('Code exemplaire requis')
    }
    validateId(data.livreId)
    return api.post<Exemplaire>('/api/exemplaires', data).then(r => r.data)
  },

  // Update copy
  update: (id: number, data: UpdateExemplaireDTO) => {
    validateId(id)
    if (Object.keys(data).length === 0) {
      throw new Error('Données à modifier requises')
    }
    return api.put<Exemplaire>(`/api/exemplaires/${id}`, data).then(r => r.data)
  },

  // Delete copy
  delete: (id: number) => {
    validateId(id)
    return api.delete(`/api/exemplaires/${id}`).then(r => r.data)
  },
}
