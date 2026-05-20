// ──────────────────────────────────────────────────────────
// Types BiblioTech — correspondance MPD Jalon 3
// ──────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'bibliothecaire' | 'adherent'

export type ExemplaireStatut = 'disponible' | 'emprunte' | 'hors_service'
export type ExemplaireEtat   = 'bon' | 'usage' | 'abime'
export type PretStatut       = 'en_cours' | 'rendu' | 'en_retard'
export type MigrationStatut  = 'en_attente' | 'validee' | 'refusee'

// ── Payload JWT ───────────────────────────────────────────
export interface AuthUser {
  sub: number
  email: string
  role: UserRole
  bibliotheque_id: number | null
  exp: number
}

// ── Entités ───────────────────────────────────────────────
export interface Bibliotheque {
  id: number
  nom: string
  adresse: string
  actif: boolean
  created_at: string
}

export interface Utilisateur {
  id: number
  nom: string
  prenom: string
  email: string
  role: UserRole
  actif: boolean
  bibliotheque_id: number | null
  date_inscription: string
}

export interface Livre {
  id: number
  isbn: string
  titre: string
  auteur: string
  editeur: string
  annee_publication: number
  genre: string
  resume: string
  couverture_url: string | null
  bibliotheque_id: number
}

export interface Exemplaire {
  id: number
  code_exemplaire: string
  statut: ExemplaireStatut
  etat: ExemplaireEtat
  livre_id: number
  bibliotheque_id: number
  livre?: Livre
}

export interface Pret {
  id: number
  date_pret: string
  date_retour_prevue: string
  date_retour_effective: string | null
  statut: PretStatut
  exemplaire_id: number
  utilisateur_id: number
  exemplaire?: Exemplaire & { livre: Livre }
  utilisateur?: Utilisateur
}

export interface DemandeMigration {
  id: number
  statut: MigrationStatut
  bibliotheque_origine_id: number
  bibliotheque_cible_id: number
  utilisateur_id: number
  utilisateur?: Utilisateur
  created_at: string
}

// ── Réponses API ──────────────────────────────────────────
export interface ApiError {
  status: number
  code: string
  message: string
  details?: Record<string, string[]> | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
