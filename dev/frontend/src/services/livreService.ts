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

export const livreService = {
  // List all books for current library
  getAll: (params?: { search?: string; limit?: number; offset?: number }) =>
    api.get<Livre[]>('/api/livres', { params }).then(r => r.data),

  // Get single book
  getById: (id: number) =>
    api.get<Livre>(`/api/livres/${id}`).then(r => r.data),

  // Search book by ISBN (Google Books)
  searchByIsbn: (isbn: string) =>
    api.get<Livre>(`/api/livres/isbn/${isbn}`).then(r => r.data),

  // Create book
  create: (data: CreateLivreDTO) =>
    api.post<Livre>('/api/livres', data).then(r => r.data),

  // Update book
  update: (id: number, data: UpdateLivreDTO) =>
    api.put<Livre>(`/api/livres/${id}`, data).then(r => r.data),

  // Delete book
  delete: (id: number) =>
    api.delete(`/api/livres/${id}`).then(r => r.data),
}
