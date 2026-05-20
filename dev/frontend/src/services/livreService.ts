import api from './api'
import type { Livre } from '../types'

export interface CreateLivreDTO {
  isbn: string
  titre: string
  auteur: string
  editeur: string
  annee_publication: number
  genre: string
  resume: string
}

export interface UpdateLivreDTO extends Partial<CreateLivreDTO> {}

function validateId(id: number | undefined): void {
  if (id === undefined || id <= 0 || !Number.isInteger(id)) {
    throw new Error('ID invalide')
  }
}

export const livreService = {
  // List all books for current library
  getAll: (params?: { search?: string; limit?: number; offset?: number }) => {
    if (params?.limit !== undefined && (params.limit <= 0 || !Number.isInteger(params.limit))) {
      throw new Error('Limite invalide')
    }
    if (params?.offset !== undefined && (params.offset < 0 || !Number.isInteger(params.offset))) {
      throw new Error('Offset invalide')
    }
    return api.get<Livre[]>('/api/livres', { params }).then(r => r.data)
  },

  // Get single book
  getById: (id: number) => {
    validateId(id)
    return api.get<Livre>(`/api/livres/${id}`).then(r => r.data)
  },

  // Search book by ISBN (Google Books)
  searchByIsbn: (isbn: string) => {
    if (!isbn || isbn.trim().length === 0) {
      throw new Error('ISBN requis')
    }
    return api.get<Livre>(`/api/livres/isbn/${isbn}`).then(r => r.data)
  },

  // Create book
  create: (data: CreateLivreDTO) => {
    if (!data.isbn?.trim() || !data.titre?.trim()) {
      throw new Error('ISBN et titre requis')
    }
    return api.post<Livre>('/api/livres', data).then(r => r.data)
  },

  // Update book
  update: (id: number, data: UpdateLivreDTO) => {
    validateId(id)
    if (Object.keys(data).length === 0) {
      throw new Error('Données à modifier requises')
    }
    return api.put<Livre>(`/api/livres/${id}`, data).then(r => r.data)
  },

  // Delete book
  delete: (id: number) => {
    validateId(id)
    return api.delete(`/api/livres/${id}`).then(r => r.data)
  },
}
