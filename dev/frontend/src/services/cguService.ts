import api from './api'

export interface CguVersionDTO {
  id: number
  version: string
  contenu: string
  date_effet: string
  date_publication: string
  publie_par: string
}

export const cguService = {
  getCurrent: () =>
    api.get<CguVersionDTO>('/api/cgu/current').then(r => r.data),

  getPending: () =>
    api.get<CguVersionDTO | null>('/api/cgu/pending').then(r => r.data),

  getHistory: () =>
    api.get<CguVersionDTO[]>('/api/cgu/history').then(r => r.data),

  create: (data: { version: string; contenu: string; date_effet: string }) =>
    api.post<CguVersionDTO>('/api/cgu', data).then(r => r.data),

  accept: (version: string) =>
    api.post('/api/utilisateurs/me/accept-cgu', { version }).then(r => r.data),
}
