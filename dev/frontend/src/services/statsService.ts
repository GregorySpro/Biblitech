import api from './api'

export interface StatsBibliotheque {
  totalLivres: number
  totalExemplaires: number
  pretsenCours: number
  pretsEnRetard: number
  adherentsActifs: number
}

export interface StatsGlobales {
  totalBibliotheques: number
  totalUtilisateurs: number
  totalLivres: number
  totalPrets: number
}

export const statsService = {
  // Get stats for current library
  getLibrary: () =>
    api.get<StatsBibliotheque>('/api/stats/bibliotheque').then(r => r.data),

  // Get global stats (super_admin only)
  getGlobal: () =>
    api.get<StatsGlobales>('/api/stats/globales').then(r => r.data),
}
