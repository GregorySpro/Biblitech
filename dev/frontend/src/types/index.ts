// ──────────────────────────────────────────────────────────
// Types BiblioTech — correspondance MPD Jalon 3
// ──────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'bibliothecaire' | 'adherent'

export type ExemplaireStatut = 'disponible' | 'emprunte' | 'hors_service' | 'perdu'
export type ExemplaireEtat   = 'bon' | 'usage' | 'abime'
export type PretStatut       = 'en_cours' | 'rendu' | 'en_retard' | 'perdu'
export type MigrationStatut  = 'en_attente' | 'validee' | 'refusee'

// ── Payload JWT ───────────────────────────────────────────
export interface AuthUser {
  sub: number
  email: string
  role: UserRole
  bibliotheque_id: number | null
  bibliotheque_nom: string | null
  duret_pret_jours: number
  must_change_password: boolean
  cgu_accepted_version: string | null
  prets_suspendus: boolean
  exp: number
}

// ── Entités ───────────────────────────────────────────────
export interface Bibliotheque {
  id: number
  nom: string
  adresse: string | null
  ville: string | null
  code_postal: string | null
  email: string | null
  active: boolean
  duret_pret_jours: number
  created_at: string
}

export interface Utilisateur {
  id: number
  nom: string
  prenom: string
  email: string
  role: UserRole
  active: boolean
  bibliotheque_id: number | null
  prets_suspendus: boolean
  created_at: string
}

export interface Livre {
  id: number
  isbn: string
  titre: string
  auteur: string
  editeur: string
  annee_publication: number
  description: string | null
  couverture_url: string | null
  bibliotheque_id: number
  bibliotheque_nom: string
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
  etat_depart: string | null
  etat_retour: string | null
  exemplaire_id: number
  utilisateur_id: number
  exemplaire?: Exemplaire & { livre: Livre }
  utilisateur?: Utilisateur
}

export interface DemandeMigration {
  id: number
  statut: MigrationStatut
  bibliotheque_source_id?: number
  bibliotheque_cible_id?: number
  bibliothequeSource?: Bibliotheque
  bibliothequeCible?: Bibliotheque
  utilisateur_id?: number
  utilisateur?: Utilisateur
  motif?: string | null
  traitee_at?: string | null
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
