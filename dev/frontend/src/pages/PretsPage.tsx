import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  BookOpenIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { SearchBar } from '../components/SearchBar'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { BottomSheet } from '../components/BottomSheet'
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
import { useGlobalLoading } from '../context/GlobalLoadingContext'
import { pretService } from '../services/pretService'
import { livreService } from '../services/livreService'
import { exemplaireService } from '../services/exemplaireService'
import { utilisateurService } from '../services/utilisateurService'
import api from '../services/api'
import type { Column } from '../components/DataTable'
import type { Pret, Livre, Exemplaire, Utilisateur } from '../types'

// ── Types locaux enrichis ──────────────────────────────────
interface PretRow extends Omit<Pret, 'exemplaire' | 'utilisateur'> {
  adherentNom: string
  livretitre: string
  codeExemplaire: string
}

const statutConfig: Record<string, { label: string; variant: 'info' | 'success' | 'danger' | 'neutral' }> = {
  en_cours:  { label: 'En cours',  variant: 'info'    },
  rendu:     { label: 'Rendu',     variant: 'success' },
  en_retard: { label: 'En retard', variant: 'danger'  },
  perdu:     { label: 'Perdu',     variant: 'neutral' },
}

const etatOptions = [
  { value: 'bon',   label: 'Bon état' },
  { value: 'usage', label: 'Usagé' },
  { value: 'abime', label: 'Abîmé' },
]

type FilterStatut = 'tous' | Pret['statut']

const columnsStaff: Column<PretRow>[] = [
  { key: 'adherentNom',   header: 'Adhérent',       sortable: true },
  { key: 'livretitre',    header: 'Livre',          sortable: true },
  { key: 'codeExemplaire',header: 'Exemplaire',     width: '100px', render: r => (
    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
      {r.codeExemplaire}
    </span>
  )},
  { key: 'date_pret',            header: 'Date prêt',    width: '110px', sortable: true, render: r => (
    new Date(r.date_pret).toLocaleDateString('fr-FR')
  )},
  { key: 'date_retour_prevue',   header: 'Retour prévu', width: '110px', sortable: true, render: r => (
    r.statut === 'perdu'
      ? <span className="text-gray-400 italic text-xs">Perdu</span>
      : new Date(r.date_retour_prevue).toLocaleDateString('fr-FR')
  )},
  { key: 'statut', header: 'Statut', width: '110px', render: r => {
    const { label, variant } = statutConfig[r.statut]
    return <Badge label={label} variant={variant} dot />
  }},
]

// Colonnes pour l'adhérent (sans colonne Adhérent)
const columnsAdherent: Column<PretRow>[] = columnsStaff.filter(c => c.key !== 'adherentNom')

const filterButtons: { key: FilterStatut; label: string }[] = [
  { key: 'tous',      label: 'Tous' },
  { key: 'en_cours',  label: 'En cours' },
  { key: 'en_retard', label: 'En retard' },
  { key: 'rendu',     label: 'Rendus' },
]

// ── Mapping Pret → PretRow ─────────────────────────────────
function mapPretToPretRow(p: Pret): PretRow {
  const { exemplaire, utilisateur, ...rest } = p
  const exemplaireId = p.exemplaire_id ?? exemplaire?.id
  return {
    ...rest,
    exemplaire_id:  exemplaireId ?? 0,
    utilisateur_id: p.utilisateur_id ?? utilisateur?.id ?? 0,
    adherentNom:    utilisateur
                      ? `${utilisateur.prenom} ${utilisateur.nom}`
                      : `Adhérent #${p.utilisateur_id}`,
    livretitre:     exemplaire?.livre?.titre    ?? `Livre #${exemplaireId}`,
    codeExemplaire: exemplaire?.code_exemplaire ?? `EX-${exemplaireId}`,
  }
}

export function PretsPage() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<FilterStatut>('tous')
  const [selected, setSelected] = useState<PretRow | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [returning, setReturning] = useState(false)
  const [declaringPerdu, setDeclaringPerdu] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [etatDepart, setEtatDepart] = useState('')
  const [etatRetour, setEtatRetour] = useState('')
  const { user } = useAuth()
  const { withLoading } = useGlobalLoading()
  const isAdherent = user?.role === 'adherent'
  const canManage  = !isAdherent && user?.role !== 'super_admin'

  // ── Nouveau prêt : états du formulaire intelligent ──────
  const [isbnQuery, setIsbnQuery]         = useState('')
  const [livresFound, setLivresFound]     = useState<Livre[]>([])
  const [isbnSearching, setIsbnSearching] = useState(false)
  const [isbnError, setIsbnError]         = useState<string | null>(null)

  const [selectedLivre, setSelectedLivre]         = useState<Livre | null>(null)
  const [exemplaires, setExemplaires]             = useState<Exemplaire[]>([])
  const [exemplairesLoading, setExemplairesLoading] = useState(false)
  const [selectedExemplaire, setSelectedExemplaire] = useState<Exemplaire | null>(null)

  const [emailQuery, setEmailQuery]         = useState('')
  const [adherent, setAdherent]             = useState<Utilisateur | null>(null)
  const [adherentSuggestions, setAdherentSuggestions] = useState<Utilisateur[]>([])
  const [emailSearching, setEmailSearching] = useState(false)
  const [emailError, setEmailError]         = useState<string | null>(null)

  const isbnTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Réinitialiser le formulaire ────────────────────────
  const resetForm = () => {
    setIsbnQuery('')
    setLivresFound([])
    setIsbnError(null)
    setSelectedLivre(null)
    setExemplaires([])
    setSelectedExemplaire(null)
    setEmailQuery('')
    setAdherent(null)
    setAdherentSuggestions([])
    setEmailError(null)
    setFormError(null)
    setEtatDepart('')
  }

  // ── Recherche ISBN (locale, dans le catalogue) ─────────
  useEffect(() => {
    if (isbnTimerRef.current) clearTimeout(isbnTimerRef.current)
    if (!isbnQuery.trim() || isbnQuery.trim().length < 3) {
      setLivresFound([])
      setIsbnError(null)
      return
    }
    isbnTimerRef.current = setTimeout(async () => {
      setIsbnSearching(true)
      setIsbnError(null)
      setSelectedLivre(null)
      setExemplaires([])
      setSelectedExemplaire(null)
      try {
        const livres = await withLoading(() => livreService.searchInCatalogue(isbnQuery.trim()))
        if (livres.length === 0) {
          setIsbnError('Aucun livre trouvé dans votre catalogue pour cet ISBN.')
          setLivresFound([])
        } else {
          setLivresFound(livres)
        }
      } catch {
        setIsbnError('Erreur lors de la recherche.')
      } finally {
        setIsbnSearching(false)
      }
    }, 400)
  }, [isbnQuery])

  // ── Sélectionner un livre → charger ses exemplaires disponibles ──
  const handleSelectLivre = async (livre: Livre) => {
    setSelectedLivre(livre)
    setSelectedExemplaire(null)
    setExemplairesLoading(true)
    try {
      const exs = await withLoading(() => exemplaireService.getDisponibles(livre.id))
      setExemplaires(exs)
    } catch {
      setExemplaires([])
    } finally {
      setExemplairesLoading(false)
    }
  }

  // ── Recherche adhérent par email (partielle) ───────────
  useEffect(() => {
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current)
    if (!emailQuery.trim() || emailQuery.trim().length < 2) {
      setAdherentSuggestions([])
      setEmailError(null)
      return
    }
    // Si un adhérent est déjà sélectionné et que sa query correspond, ne pas relancer
    if (adherent && adherent.email === emailQuery.trim()) {
      return
    }
    emailTimerRef.current = setTimeout(async () => {
      setEmailSearching(true)
      setEmailError(null)
      try {
        const users = await withLoading(() => utilisateurService.byEmail(emailQuery.trim()))
        setAdherentSuggestions(users)
        if (users.length === 0) setEmailError('Aucun adhérent trouvé.')
      } catch (err) {
        setEmailError(err instanceof Error ? err.message : 'Erreur lors de la recherche')
      } finally {
        setEmailSearching(false)
      }
    }, 400)
  }, [emailQuery, adherent])

  // ── Créer le prêt ──────────────────────────────────────
  const handleCreateLoan = async () => {
    if (!selectedExemplaire) { setFormError('Sélectionnez un exemplaire.'); return }
    if (!adherent) { setFormError('Saisissez un email d\'adhérent valide.'); return }
    setCreating(true)
    setFormError(null)
    try {
      await withLoading(() => pretService.create({
        exemplaire_id: selectedExemplaire.id,
        utilisateur_id: adherent.id,
        etat_depart: etatDepart || undefined,
      }))
      setShowCreateForm(false)
      resetForm()
      setSelected(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création du prêt')
    } finally {
      setCreating(false)
    }
  }

  // Fetch loans from API
  const { data: allPretsData, loading, error, refetch } = useApiCall(() => pretService.getAll())
  const allPrets = allPretsData ?? []

  // Member sees only their own loans
  const pretRows = allPrets.map(mapPretToPretRow)
  const sourcePrets = isAdherent
    ? pretRows.filter(p => p.utilisateur_id === user?.sub)
    : pretRows

  const columns = isAdherent ? columnsAdherent : columnsStaff

  const filtered = useMemo(() => {
    return sourcePrets
      .filter(p => filter === 'tous' || p.statut === filter)
      .filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          p.adherentNom?.toLowerCase().includes(q) ||
          p.livretitre?.toLowerCase().includes(q) ||
          p.codeExemplaire?.toLowerCase().includes(q)
        )
      })
  }, [search, filter, sourcePrets])

  const handleRegisterReturn = async () => {
    if (!selected) return
    setReturning(true)
    try {
      setFormError(null)
      await withLoading(() => pretService.registerReturn(selected.id, etatRetour || undefined))
      setSelected(null)
      setShowReturnModal(false)
      setEtatRetour('')
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du retour')
    } finally {
      setReturning(false)
    }
  }

  const handleDeclarePerdu = async () => {
    if (!selected) return
    setDeclaringPerdu(true)
    try {
      await withLoading(() => api.patch(`/api/exemplaires/${selected.exemplaire_id}/perdu`))
      setSelected(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la déclaration de perte')
    } finally {
      setDeclaringPerdu(false)
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 p-6 gap-4 overflow-hidden">

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between flex-shrink-0"
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[#111827]">
              {isAdherent ? 'Mes prêts' : 'Prêts / Retours'}
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {loading ? 'Chargement...' : error ? 'Erreur de chargement' : (
                <>
                  {sourcePrets.filter(p => p.statut === 'en_cours').length} prêts en cours ·{' '}
                  <span className="text-red-500 font-medium">
                    {sourcePrets.filter(p => p.statut === 'en_retard').length} en retard
                  </span>
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* Affichage des erreurs */}
        {error && (
          <ErrorAlert
            message="Erreur de chargement"
            details="Impossible de charger les prêts. Veuillez réessayer."
            onDismiss={() => refetch()}
          />
        )}

        {/* Recherche + filtres */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <SearchBar
            placeholder="Rechercher par adhérent, livre ou exemplaire…"
            onSearch={setSearch}
            className="flex-1"
          />
          <div className="flex items-center gap-1.5 bg-[#F3F4F6] rounded-xl p-1 border border-[#E5E7EB] overflow-x-auto">
            <FunnelIcon className="w-3.5 h-3.5 text-[#9CA3AF] ml-1.5 flex-shrink-0" />
            {filterButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  filter === btn.key
                    ? 'bg-white text-[#1E3A8A] shadow-sm font-semibold'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {btn.label}
                {btn.key !== 'tous' && (
                  <span className="ml-1.5 text-[#9CA3AF]">
                    ({sourcePrets.filter(p => p.statut === btn.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Table + actions */}
          <div className="flex flex-col flex-1 min-w-0 gap-3">
            {loading ? (
              <LoadingState message="Chargement des prêts..." />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                selectedId={selected?.id ?? null}
                onRowClick={row => setSelected(row.id === selected?.id ? null : row)}
                emptyMessage="Aucun prêt ne correspond à votre recherche."
              />
            )}

            {/* Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
              {canManage && (
                <>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all duration-200 shadow-sm hover:shadow-md shadow-[#1E3A8A]/20">
                    <PlusIcon className="w-4 h-4" />
                    Nouveau prêt
                  </button>
                  <button
                    disabled={!selected || selected.statut !== 'en_cours' && selected.statut !== 'en_retard'}
                    onClick={() => { setEtatRetour(''); setShowReturnModal(true) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#16A34A]/30 bg-white text-sm font-medium text-[#16A34A] hover:bg-green-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowUturnLeftIcon className="w-4 h-4" />
                    Enregistrer le retour
                  </button>
                  <button
                    disabled={!selected || selected.statut !== 'en_cours' && selected.statut !== 'en_retard'}
                    onClick={handleDeclarePerdu}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <NoSymbolIcon className="w-4 h-4" />
                    {declaringPerdu ? '…' : 'Déclarer perdu'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Panneau détail */}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="hidden md:flex md:flex-col w-[30%] flex-shrink-0 bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowsRightLeftIcon className="w-4 h-4 text-[#1E3A8A]" />
                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">
                      Détail du prêt
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                  {/* Statut */}
                  <div>
                    <Badge
                      label={statutConfig[selected.statut].label}
                      variant={statutConfig[selected.statut].variant}
                      dot
                    />
                  </div>

                  {/* Livre */}
                  <div className="bg-[#F3F4F6] rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpenIcon className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Livre</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827] text-sm">
                      {selected.livretitre}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B7280]">
                      {selected.codeExemplaire}
                    </p>
                  </div>

                  {/* Adhérent */}
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-[#1E3A8A]" />
                    </div>
                    <span className="text-[#374151] font-medium">{selected.adherentNom}</span>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        <span>Date prêt</span>
                      </div>
                      <span className="text-[#374151] font-medium">
                        {new Date(selected.date_pret).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>Retour prévu</span>
                      </div>
                      <span className={`font-medium ${selected.statut === 'en_retard' ? 'text-red-600' : 'text-[#374151]'}`}>
                        {new Date(selected.date_retour_prevue).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {selected.date_retour_effective && selected.statut !== 'perdu' && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                          <span>Retourné le</span>
                        </div>
                        <span className="text-[#16A34A] font-medium">
                          {new Date(selected.date_retour_effective).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selected.statut === 'perdu' && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <NoSymbolIcon className="w-3.5 h-3.5" />
                          <span>Restitution</span>
                        </div>
                        <span className="text-gray-500 font-medium italic">Perdu — non rendu</span>
                      </div>
                    )}
                  </div>

                  {/* État départ */}
                  {selected.etat_depart && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">État au prêt</span>
                      <span className="text-[#374151] font-medium capitalize">
                        {etatOptions.find(e => e.value === selected.etat_depart)?.label ?? selected.etat_depart}
                      </span>
                    </div>
                  )}
                  {/* État retour */}
                  {selected.etat_retour && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">État au retour</span>
                      <span className="text-[#374151] font-medium capitalize">
                        {etatOptions.find(e => e.value === selected.etat_retour)?.label ?? selected.etat_retour}
                      </span>
                    </div>
                  )}

                  {/* Action rapide retour */}
                  {canManage && (selected.statut === 'en_cours' || selected.statut === 'en_retard') && (
                    <>
                      <button
                        onClick={() => { setEtatRetour(''); setShowReturnModal(true) }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm mt-2">
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                        Enregistrer le retour
                      </button>
                      <button
                        onClick={handleDeclarePerdu}
                        disabled={declaringPerdu}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors mt-1 disabled:opacity-40">
                        <NoSymbolIcon className="w-4 h-4" />
                        {declaringPerdu ? '…' : 'Déclarer perdu'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden md:flex w-[30%] flex-shrink-0 bg-white/50 rounded-xl border border-dashed border-[#D1D5DB] items-center justify-center"
              >
                <div className="text-center text-[#9CA3AF] px-6">
                  <ArrowsRightLeftIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sélectionnez un prêt pour voir ses détails</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile : BottomSheet détail prêt ── */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détail du prêt"
      >
        {selected && (
          <div className="px-5 py-4 space-y-4">
            {/* Statut */}
            <div>
              <Badge
                label={statutConfig[selected.statut].label}
                variant={statutConfig[selected.statut].variant}
                dot
              />
            </div>

            {/* Livre */}
            <div className="bg-[#F3F4F6] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpenIcon className="w-4 h-4 text-[#1E3A8A]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Livre</span>
              </div>
              <p style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827] text-sm">
                {selected.livretitre}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B7280]">
                {selected.codeExemplaire}
              </p>
            </div>

            {/* Adhérent */}
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-[#1E3A8A]" />
              </div>
              <span className="text-[#374151] font-medium">{selected.adherentNom}</span>
            </div>

            {/* Dates */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  <span>Date prêt</span>
                </div>
                <span className="text-[#374151] font-medium">
                  {new Date(selected.date_pret).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>Retour prévu</span>
                </div>
                <span className={`font-medium ${selected.statut === 'en_retard' ? 'text-red-600' : 'text-[#374151]'}`}>
                  {new Date(selected.date_retour_prevue).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {selected.date_retour_effective && selected.statut !== 'perdu' && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                    <span>Retourné le</span>
                  </div>
                  <span className="text-[#16A34A] font-medium">
                    {new Date(selected.date_retour_effective).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {selected.statut === 'perdu' && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <NoSymbolIcon className="w-3.5 h-3.5" />
                    <span>Restitution</span>
                  </div>
                  <span className="text-gray-500 font-medium italic">Perdu — non rendu</span>
                </div>
              )}
            </div>

            {/* Action rapide retour */}
            {canManage && (selected.statut === 'en_cours' || selected.statut === 'en_retard') && (
              <>
                <button
                  onClick={() => { setEtatRetour(''); setShowReturnModal(true) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm mt-2">
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                  Enregistrer le retour
                </button>
                <button
                  onClick={handleDeclarePerdu}
                  disabled={declaringPerdu}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors mt-1 disabled:opacity-40">
                  <NoSymbolIcon className="w-4 h-4" />
                  {declaringPerdu ? '…' : 'Déclarer perdu'}
                </button>
              </>
            )}
          </div>
        )}
      </BottomSheet>

      {/* ── Create loan form modal ── */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => !creating && (setShowCreateForm(false), resetForm())}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-semibold text-[#111827]">
                  Nouveau prêt
                </h3>
                <button onClick={() => { setShowCreateForm(false); resetForm() }} className="text-[#9CA3AF] hover:text-[#374151]">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* ── Étape 1 : ISBN ── */}
              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">
                  1 — Livre (ISBN)
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={isbnQuery}
                    onChange={e => setIsbnQuery(e.target.value)}
                    placeholder="Rechercher par ISBN…"
                    disabled={creating}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                  />
                </div>

                {isbnSearching && (
                  <p className="text-xs text-[#9CA3AF] mt-2">Recherche en cours…</p>
                )}
                {isbnError && (
                  <p className="text-xs text-red-600 mt-2">{isbnError}</p>
                )}

                {/* Résultats livres */}
                {livresFound.length > 0 && !selectedLivre && (
                  <div className="mt-2 space-y-1.5">
                    {livresFound.map(livre => (
                      <button
                        key={livre.id}
                        onClick={() => handleSelectLivre(livre)}
                        className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#1E3A8A]/40 hover:bg-[#EFF6FF] transition-colors"
                      >
                        <p className="text-sm font-semibold text-[#111827]">{livre.titre}</p>
                        <p className="text-xs text-[#6B7280]">
                          {livre.auteur && <span>{livre.auteur} · </span>}
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{livre.isbn}</span>
                          {user?.role === 'super_admin' && livre.bibliotheque_nom && (
                            <span className="ml-1 text-[#9CA3AF]">({livre.bibliotheque_nom})</span>
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Livre sélectionné → exemplaires */}
                {selectedLivre && (
                  <div className="mt-2 bg-[#F3F4F6] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{selectedLivre.titre}</p>
                        {selectedLivre.auteur && <p className="text-xs text-[#6B7280]">{selectedLivre.auteur}</p>}
                        {user?.role === 'super_admin' && selectedLivre.bibliotheque_nom && (
                          <p className="text-xs text-[#9CA3AF]">{selectedLivre.bibliotheque_nom}</p>
                        )}
                      </div>
                      <button onClick={() => { setSelectedLivre(null); setExemplaires([]); setSelectedExemplaire(null) }}
                        className="text-[#9CA3AF] hover:text-[#374151] text-xs underline">
                        Changer
                      </button>
                    </div>

                    <p className="text-xs font-medium text-[#6B7280] mb-1.5">Exemplaires disponibles :</p>
                    {exemplairesLoading ? (
                      <p className="text-xs text-[#9CA3AF]">Chargement…</p>
                    ) : exemplaires.length === 0 ? (
                      <p className="text-xs text-red-500">Aucun exemplaire disponible pour ce livre.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {exemplaires.map(ex => (
                          <button
                            key={ex.id}
                            onClick={() => setSelectedExemplaire(ex.id === selectedExemplaire?.id ? null : ex)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                              selectedExemplaire?.id === ex.id
                                ? 'bg-[#1E3A8A] text-white'
                                : 'bg-white border border-[#E5E7EB] text-[#374151] hover:border-[#1E3A8A]/40'
                            }`}
                          >
                            {ex.code_exemplaire}
                            {selectedExemplaire?.id === ex.id && <CheckCircleIcon className="inline w-3 h-3 ml-1" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Étape 2 : Email adhérent ── */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">
                  2 — Adhérent (email)
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={emailQuery}
                    onChange={e => { setEmailQuery(e.target.value); setAdherent(null) }}
                    placeholder="Rechercher par email…"
                    disabled={creating}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                  />
                </div>
                {emailSearching && <p className="text-xs text-[#9CA3AF] mt-1.5">Recherche…</p>}
                {emailError && <p className="text-xs text-red-600 mt-1.5">{emailError}</p>}
                {/* Liste de suggestions */}
                {!adherent && adherentSuggestions.length > 0 && (
                  <ul className="mt-1.5 border border-[#E5E7EB] rounded-lg overflow-hidden divide-y divide-[#F3F4F6]">
                    {adherentSuggestions.map(u => (
                      <li
                        key={u.id}
                        onClick={() => { setAdherent(u); setAdherentSuggestions([]); setEmailQuery(u.email) }}
                        className="flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-[#111827]">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-[#6B7280]">{u.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Adhérent sélectionné */}
                {adherent && (
                  <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827]">{adherent.prenom} {adherent.nom}</p>
                      <p className="text-xs text-[#6B7280]">{adherent.email}</p>
                    </div>
                    <button onClick={() => { setAdherent(null); setEmailQuery('') }} className="text-[#9CA3AF] hover:text-[#374151]">
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Étape 3 : État du livre ── */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">
                  3 — État du livre au départ <span className="font-normal normal-case text-[#9CA3AF]">(optionnel)</span>
                </label>
                <div className="flex gap-2">
                  {etatOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEtatDepart(etatDepart === opt.value ? '' : opt.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        etatDepart === opt.value
                          ? 'border-[#1E3A8A] bg-[#EFF6FF] text-[#1E3A8A]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1E3A8A]/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={creating}
                  onClick={() => { setShowCreateForm(false); resetForm() }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  disabled={creating || !selectedExemplaire || !adherent}
                  onClick={handleCreateLoan}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {creating ? 'Création…' : 'Créer le prêt'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Return modal with état retour ── */}
      <AnimatePresence>
        {showReturnModal && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => !returning && setShowReturnModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-base font-semibold text-[#111827]">
                  Enregistrer le retour
                </h3>
                <button onClick={() => setShowReturnModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#F3F4F6] rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-[#111827]">{selected.livretitre}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{selected.adherentNom} · {selected.codeExemplaire}</p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">
                État du livre au retour <span className="font-normal normal-case text-[#9CA3AF]">(optionnel)</span>
              </label>
              <div className="flex gap-2 mb-5">
                {etatOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEtatRetour(etatRetour === opt.value ? '' : opt.value)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                      etatRetour === opt.value
                        ? 'border-[#16A34A] bg-green-50 text-[#16A34A]'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#16A34A]/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {selected.etat_depart && (
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-4">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                  État au départ : <span className="font-medium">{etatOptions.find(e => e.value === selected.etat_depart)?.label ?? selected.etat_depart}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  disabled={returning}
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  disabled={returning}
                  onClick={handleRegisterReturn}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#16A34A] text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                  {returning ? 'Enregistrement…' : 'Confirmer le retour'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
