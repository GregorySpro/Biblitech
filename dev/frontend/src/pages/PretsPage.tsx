import { useState, useMemo } from 'react'
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
import { pretService } from '../services/pretService'
import type { Column } from '../components/DataTable'
import type { Pret } from '../types'

// ── Types locaux enrichis ──────────────────────────────────
interface PretRow extends Omit<Pret, 'exemplaire' | 'utilisateur'> {
  adherentNom: string
  livretitre: string
  codeExemplaire: string
}

const statutConfig: Record<Pret['statut'], { label: string; variant: 'info' | 'success' | 'danger' }> = {
  en_cours:  { label: 'En cours',  variant: 'info'    },
  rendu:     { label: 'Rendu',     variant: 'success' },
  en_retard: { label: 'En retard', variant: 'danger'  },
}

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
    new Date(r.date_retour_prevue).toLocaleDateString('fr-FR')
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
  return {
    ...rest,
    adherentNom:    utilisateur
                      ? `${utilisateur.prenom} ${utilisateur.nom}`
                      : `Adhérent #${p.utilisateur_id}`,
    livretitre:     exemplaire?.livre?.titre    ?? `Livre #${p.exemplaire_id}`,
    codeExemplaire: exemplaire?.code_exemplaire ?? `EX-${p.exemplaire_id}`,
  }
}

export function PretsPage() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<FilterStatut>('tous')
  const [selected, setSelected] = useState<PretRow | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [returning, setReturning] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [exemplaire_id, setExemplaireId] = useState('')
  const [utilisateur_id, setUtilisateurId] = useState('')
  const { user } = useAuth()
  const isAdherent = user?.role === 'adherent'
  const canManage  = !isAdherent

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

  const handleCreateLoan = async () => {
    if (!exemplaire_id.trim() || !utilisateur_id.trim()) {
      setFormError('Exemplaire et adhérent sont obligatoires')
      return
    }
    setCreating(true)
    try {
      setFormError(null)
      await pretService.create({
        exemplaire_id: parseInt(exemplaire_id),
        utilisateur_id: parseInt(utilisateur_id),
      })
      setShowCreateForm(false)
      setExemplaireId('')
      setUtilisateurId('')
      setSelected(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création du prêt')
    } finally {
      setCreating(false)
    }
  }

  const handleRegisterReturn = async () => {
    if (!selected) return
    setReturning(true)
    try {
      setFormError(null)
      await pretService.registerReturn(selected.id)
      setSelected(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du retour')
    } finally {
      setReturning(false)
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
                    onClick={handleRegisterReturn}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#16A34A]/30 bg-white text-sm font-medium text-[#16A34A] hover:bg-green-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowUturnLeftIcon className="w-4 h-4" />
                    {returning ? 'Enregistrement...' : 'Enregistrer le retour'}
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
                    {selected.date_retour_effective && (
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
                  </div>

                  {/* Action rapide retour */}
                  {canManage && (selected.statut === 'en_cours' || selected.statut === 'en_retard') && (
                    <button
                      onClick={handleRegisterReturn}
                      disabled={returning}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm mt-2 disabled:opacity-40">
                      <ArrowUturnLeftIcon className="w-4 h-4" />
                      {returning ? 'Enregistrement...' : 'Enregistrer le retour'}
                    </button>
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
              {selected.date_retour_effective && (
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
            </div>

            {/* Action rapide retour */}
            {canManage && (selected.statut === 'en_cours' || selected.statut === 'en_retard') && (
              <button
                onClick={handleRegisterReturn}
                disabled={returning}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm mt-2 disabled:opacity-40">
                <ArrowUturnLeftIcon className="w-4 h-4" />
                {returning ? 'Enregistrement...' : 'Enregistrer le retour'}
              </button>
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
            onClick={() => !creating && setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[#111827] mb-6">Créer un nouveau prêt</h3>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                {/* Exemplaire ID */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">ID Exemplaire *</label>
                  <input
                    type="number"
                    value={exemplaire_id}
                    onChange={e => setExemplaireId(e.target.value)}
                    placeholder="ID de la copie du livre"
                    disabled={creating}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                  />
                  <p className="text-xs text-[#6B7280] mt-1">Saisissez l'ID de la copie du livre (exemplaire)</p>
                </div>

                {/* Utilisateur ID */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">ID Adhérent *</label>
                  <input
                    type="number"
                    value={utilisateur_id}
                    onChange={e => setUtilisateurId(e.target.value)}
                    placeholder="ID de l'adhérent"
                    disabled={creating}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                  />
                  <p className="text-xs text-[#6B7280] mt-1">Saisissez l'ID de l'adhérent qui emprunte</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={creating}
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  disabled={creating}
                  onClick={handleCreateLoan}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {creating ? '...' : 'Créer le prêt'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
