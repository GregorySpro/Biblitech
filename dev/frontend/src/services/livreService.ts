import api from './api'
import type { Livre } from '../types'

export interface GoogleBooksMetadata {
  isbn: string
  titre: string
  auteur: string | null
  editeur: string | null
  anneePublication: number | null
  description: string | null
  couvertureUrl: string | null
}

export interface CreateLivreDTO {
  isbn: string
  titre: string
  auteur: string
  editeur: string
  annee_publication: number
  description?: string
  bibliotheque_id?: number
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

  // Search books in local catalogue by ISBN (for loan creation)
  searchInCatalogue: (isbn: string) =>
    api.get<Livre[]>('/api/livres', { params: { isbn } }).then(r => r.data),

  // Search book by ISBN (Google Books) — returns metadata to pre-fill the add form
  searchByIsbn: async (isbn: string) => {
    if (!isbn || isbn.trim().length === 0) {
      throw new Error('ISBN requis')
    }
    try {
      return await api.get<GoogleBooksMetadata>(`/api/livres/isbn/${isbn}`).then(r => r.data)
    } catch (err: any) {
      const status = err?.response?.status
      const code   = err?.response?.data?.code
      if (status === 404 || code === 'LIVRE_ISBN_NOT_FOUND_GOOGLE') {
        throw new Error('ISBN non reconnu — aucun livre trouvé dans Google Books pour cet identifiant.')
      }
      if (status === 503 || status === 502) {
        throw new Error('Service Google Books indisponible. Remplissez le formulaire manuellement.')
      }
      if (status === 409 || code === 'LIVRE_ISBN_DUPLICATE') {
        throw new Error('Ce livre est déjà dans votre catalogue.')
      }
      throw new Error('Erreur lors de la recherche ISBN. Vérifiez votre connexion et réessayez.')
    }
  },

  // Create book
  create: async (data: CreateLivreDTO) => {
    if (!data.isbn?.trim() || !data.titre?.trim()) {
      throw new Error('ISBN et titre requis')
    }
    try {
      return await api.post<Livre>('/api/livres', data).then(r => r.data)
    } catch (err: any) {
      const status = err?.response?.status
      const code   = err?.response?.data?.code
      if (status === 409 || code === 'LIVRE_ISBN_DUPLICATE') {
        throw new Error('Un livre avec cet ISBN existe déjà dans votre catalogue.')
      }
      if (status === 400) {
        throw new Error(err?.response?.data?.message ?? 'Données invalides.')
      }
      throw new Error('Erreur lors de l\'ajout du livre. Réessayez.')
    }
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
