import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { ErrorAlert } from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
import { useGlobalLoading } from '../context/GlobalLoadingContext'
import { demandesMigrationService } from '../services/demandesMigrationService'
import { bibliothequeService } from '../services/bibliothequeService'
import type { Column } from '../components/DataTable'
import type { DemandeMigration } from '../types'

interface DemandeMigrationRow {
  id: number
  utilisateur: string
  bibliothequeSource: string
  bibliothequeCible: string
  motif: string
  statut: DemandeMigration['statut']
  createdAt: string
  traiteeAt?: string
}

const statusBadges = {
  en_attente: { label: 'En attente', variant: 'warning' as const },
  validee: { label: 'Validée', variant: 'success' as const },
  refusee: { label: 'Refusée', variant: 'danger' as const },
}

const cols: Column<DemandeMigrationRow>[] = [
  { key: 'utilisateur', header: 'Utilisateur', sortable: true },
  { key: 'bibliothequeSource', header: 'Départ', sortable: true },
  { key: 'bibliothequeCible', header: 'Destination', sortable: true },
  { key: 'motif', header: 'Motif', width: '150px' },
  { key: 'createdAt', header: 'Demandée le', width: '110px', sortable: true },
  { key: 'statut', header: 'Statut', width: '100px', render: r => {
    const { label, variant } = statusBadges[r.statut]
    return <Badge label={label} variant={variant} dot />
  }},
]

export function DemandeMigrationPage() {
  const { user } = useAuth()
  const { withLoading } = useGlobalLoading()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [filterStatut, setFilterStatut] = useState<'tous' | 'en_attente' | 'traitees'>('tous')

  const isSuperAdmin = user?.role === 'super_admin'

  const { data: demandes = [], error: fetchError, refetch: refetchDemandes } = useApiCall(
    () => demandesMigrationService.getAll()
  ) as any

  const { data: bibliotheques = [] } = useApiCall(() => bibliothequeService.getAll()) as any

  const transformedData: DemandeMigrationRow[] = (demandes as any[] ?? []).map((d: any) => ({
    id: d.id,
    utilisateur: d.utilisateur_email ?? d.utilisateur?.email ?? 'Inconnu',
    bibliothequeSource: d.bibliotheque_source_nom ?? d.bibliothequeSource?.nom ?? `#${d.bibliotheque_source_id}`,
    bibliothequeCible: d.bibliotheque_cible_nom ?? d.bibliothequeCible?.nom ?? `#${d.bibliotheque_cible_id}`,
    motif: d.motif ?? '-',
    statut: d.statut,
    createdAt: new Date(d.created_at).toLocaleDateString('fr-FR'),
    traiteeAt: d.traitee_at ? new Date(d.traitee_at).toLocaleDateString('fr-FR') : undefined,
  }))

  const filteredData: DemandeMigrationRow[] = transformedData.filter(d => {
    if (filterStatut === 'en_attente') return d.statut === 'en_attente'
    if (filterStatut === 'traitees') return d.statut !== 'en_attente'
    return true
  })

  const selectedDemande = (demandes as any[] ?? []).find((d: any) => d.id === selectedId)

  // Adhérents ne voient que leurs propres demandes → isOwner = true si adherent
  const isAdherent = user?.role === 'adherent'
  const isOwner = isAdherent || Number(selectedDemande?.utilisateur_id) === Number(user?.sub)
  const canCancel = isOwner && selectedDemande?.statut === 'en_attente'
  const canApprove = isSuperAdmin && selectedDemande?.statut === 'en_attente'
  const canReject = isSuperAdmin && selectedDemande?.statut === 'en_attente'

  // Adhérents : ils ne voient que leurs demandes → suffit de vérifier si une est en_attente
  const hasPendingDemande = isAdherent
    ? (demandes as any[] ?? []).some((d: any) => d.statut === 'en_attente')
    : (demandes as any[] ?? []).some((d: any) => Number(d.utilisateur_id) === Number(user?.sub) && d.statut === 'en_attente')

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const cibleId = parseInt(fd.get('bibliotheque_cible_id') as string)
    const motif = (fd.get('motif') as string).trim()
    const newErrors: string[] = []

    if (!Number.isInteger(cibleId) || cibleId <= 0) {
      newErrors.push('Bibliothèque cible requise')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await withLoading(async () => {
        await demandesMigrationService.create({
          bibliotheque_cible_id: cibleId,
          motif: motif || undefined,
        })
      })
      form.reset()
      setShowCreateSheet(false)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors de la création'])
    }
  }

  const handleApprove = async () => {
    if (!selectedId) return
    try {
      const result = await withLoading(() => demandesMigrationService.approve(selectedId))
      setSelectedId(null)
      await refetchDemandes()
      if (result?.prets_forces > 0) {
        alert(`Migration approuvée. ${result.prets_forces} prêt(s) actif(s) ont été automatiquement clôturés car la bibliothèque source était inactive.`)
      }
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors de l\'approbation'])
    }
  }

  const handleReject = async () => {
    if (!selectedId) return
    const reason = prompt('Motif du refus:')
    if (reason === null) return
    try {
      await withLoading(() => demandesMigrationService.reject(selectedId, { motif: reason }))
      setSelectedId(null)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors du refus'])
    }
  }

  const handleCancel = async () => {
    if (!selectedId) return
    if (!confirm('Annuler cette demande de migration ?')) return
    try {
      await withLoading(() => demandesMigrationService.delete(selectedId))
      setSelectedId(null)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors de l\'annulation'])
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 p-6 gap-5 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[#111827]">
            Demandes de migration
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Gérez les demandes de changement de bibliothèque
          </p>
        </motion.div>

        {fetchError && (
          <ErrorAlert
            message="Erreur de chargement"
            details="Impossible de charger les demandes. Veuillez réessayer."
            onDismiss={() => {}}
          />
        )}

        {errors.length > 0 && (
          <ErrorAlert
            message="Erreur"
            details={errors.join(' • ')}
            onDismiss={() => setErrors([])}
          />
        )}

        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-lg p-1">
            {([
              { key: 'tous', label: 'Toutes', count: transformedData.length },
              { key: 'en_attente', label: 'En attente', count: transformedData.filter(d => d.statut === 'en_attente').length },
              { key: 'traitees', label: 'Traitées', count: transformedData.filter(d => d.statut !== 'en_attente').length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => { setFilterStatut(key); setSelectedId(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  filterStatut === key
                    ? 'bg-white text-[#1E3A8A] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filterStatut === key ? 'bg-[#EFF6FF] text-[#1E3A8A]' : 'bg-white text-[#9CA3AF]'
                }`}>{count}</span>
              </button>
            ))}
          </div>
          {user?.role === 'adherent' && (
            <button
              onClick={() => setShowCreateSheet(true)}
              disabled={hasPendingDemande}
              title={hasPendingDemande ? 'Une demande est déjà en cours' : undefined}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle demande
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <DataTable
            columns={cols}
            data={filteredData}
            selectedId={selectedId}
            onRowClick={r => setSelectedId(r.id === selectedId ? null : r.id)}
            emptyMessage="Aucune demande de migration."
          />
        </div>

        {selectedDemande && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex-shrink-0"
          >
            <p className="text-sm font-semibold text-[#374151] mb-3">Détails</p>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-[#6B7280]">Utilisateur:</span> {selectedDemande.utilisateur_email ?? '—'}</p>
              <p><span className="text-[#6B7280]">De:</span> {selectedDemande.bibliotheque_source_nom ?? '—'}</p>
              <p><span className="text-[#6B7280]">Vers:</span> {selectedDemande.bibliotheque_cible_nom ?? '—'}</p>
              <p><span className="text-[#6B7280]">Motif:</span> {selectedDemande.motif ?? '-'}</p>
              {selectedDemande.traitee_at && (
                <p><span className="text-[#6B7280]">Traitée le:</span> {new Date(selectedDemande.traitee_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {canApprove && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium cursor-pointer"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Approuver
                </button>
              )}
              {canReject && (
                <button
                  onClick={handleReject}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium cursor-pointer"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Refuser
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm font-medium ml-auto"
                >
                  <TrashIcon className="w-4 h-4" />
                  Annuler la demande
                </button>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showCreateSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
                onClick={() => { setShowCreateSheet(false); setErrors([]) }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-md mx-auto"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
                  <span style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827] text-base">
                    Nouvelle demande de migration
                  </span>
                  <button
                    onClick={() => { setShowCreateSheet(false); setErrors([]) }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label htmlFor="bibliotheque_cible_id" className="block text-sm font-medium text-[#374151] mb-1">
                        Bibliothèque de destination
                      </label>
                      <select
                        id="bibliotheque_cible_id"
                        name="bibliotheque_cible_id"
                        required
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827]"
                      >
                        <option value="">Sélectionner...</option>
                        {(bibliotheques as any[] ?? [])
                          .filter((b: any) => b.id !== user?.bibliotheque_id)
                          .map((b: any) => (
                            <option key={b.id} value={b.id}>{b.nom}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="motif" className="block text-sm font-medium text-[#374151] mb-1">
                        Motif (optionnel)
                      </label>
                      <textarea
                        id="motif"
                        name="motif"
                        placeholder="Expliquez votre demande..."
                        rows={3}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] placeholder-[#9CA3AF] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] font-medium"
                      >
                        Créer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCreateSheet(false); setErrors([]) }}
                        className="flex-1 px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  )
}
