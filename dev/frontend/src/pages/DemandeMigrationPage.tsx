import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { BottomSheet } from '../components/BottomSheet'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
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
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin'

  const { data: demandes = [], error: fetchError, loading: fetchLoading, refetch: refetchDemandes } = useApiCall(
    () => demandesMigrationService.getAll()
  ) as any

  const { data: bibliotheques = [] } = useApiCall(() => bibliothequeService.getAll()) as any

  const transformedData: DemandeMigrationRow[] = (demandes as any[]).map((d: any) => ({
    id: d.id,
    utilisateur: d.utilisateur?.email ?? 'Inconnu',
    bibliothequeSource: d.bibliothequeSource?.nom ?? `#${d.bibliotheque_source_id}`,
    bibliothequeCible: d.bibliothequeCible?.nom ?? `#${d.bibliotheque_cible_id}`,
    motif: d.motif ?? '-',
    statut: d.statut,
    createdAt: new Date(d.created_at).toLocaleDateString('fr-FR'),
    traiteeAt: d.traitee_at ? new Date(d.traitee_at).toLocaleDateString('fr-FR') : undefined,
  }))

  const selectedDemande = (demandes as any[]).find((d: any) => d.id === selectedId)
  const isOwner = selectedDemande?.utilisateur_id === user?.sub
  const canEdit = isOwner && selectedDemande?.statut === 'en_attente'
  const canApprove = isSuperAdmin && selectedDemande?.statut === 'en_attente'
  const canReject = isSuperAdmin && selectedDemande?.statut === 'en_attente'
  const canDelete = canEdit

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

    setLoading(true)
    try {
      await demandesMigrationService.create({
        bibliotheque_cible_id: cibleId,
        motif: motif || undefined,
      })
      form.reset()
      setShowCreateSheet(false)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors de la création'])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      await demandesMigrationService.approve(selectedId)
      setSelectedId(null)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors de l\'approbation'])
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedId) return
    const reason = prompt('Motif du refus:')
    if (reason === null) return
    setLoading(true)
    try {
      await demandesMigrationService.reject(selectedId, { motif: reason })
      setSelectedId(null)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors du refus'])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    if (!confirm('Supprimer cette demande ?')) return
    setLoading(true)
    try {
      await demandesMigrationService.delete(selectedId)
      setSelectedId(null)
      await refetchDemandes()
    } catch (err: any) {
      setErrors([err.message || 'Erreur lors de la suppression'])
    } finally {
      setLoading(false)
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
          <p className="text-sm text-[#6B7280]">{demandes.length} demande(s)</p>
          <button
            onClick={() => setShowCreateSheet(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Nouvelle demande
          </button>
        </div>

        {fetchLoading ? (
          <LoadingState message="Chargement des demandes..." />
        ) : (
          <div className="flex-1 min-h-0">
            <DataTable
              columns={cols}
              data={transformedData}
              selectedId={selectedId}
              onRowClick={r => setSelectedId(r.id === selectedId ? null : r.id)}
              emptyMessage="Aucune demande de migration."
            />
          </div>
        )}

        {selectedDemande && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex-shrink-0"
          >
            <p className="text-sm font-semibold text-[#374151] mb-3">Détails</p>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-[#6B7280]">Utilisateur:</span> {selectedDemande.utilisateur?.email}</p>
              <p><span className="text-[#6B7280]">De:</span> {selectedDemande.bibliothequeSource?.nom}</p>
              <p><span className="text-[#6B7280]">Vers:</span> {selectedDemande.bibliothequeCible?.nom}</p>
              <p><span className="text-[#6B7280]">Motif:</span> {selectedDemande.motif ?? '-'}</p>
              {selectedDemande.traitee_at && (
                <p><span className="text-[#6B7280]">Traitée le:</span> {new Date(selectedDemande.traitee_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {canApprove && (
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 text-sm font-medium"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Approuver
                </button>
              )}
              {canReject && (
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 text-sm font-medium"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Refuser
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 text-sm font-medium ml-auto"
                >
                  <TrashIcon className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
          </motion.div>
        )}

        <BottomSheet
          open={showCreateSheet}
          onClose={() => {
            setShowCreateSheet(false)
            setErrors([])
          }}
          title="Nouvelle demande de migration"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="bibliotheque_cible_id" className="block text-sm font-medium text-[#374151] mb-1">
                Bibliothèque de destination
              </label>
              <select
                id="bibliotheque_cible_id"
                name="bibliotheque_cible_id"
                required
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[#111827] placeholder-[#9CA3AF]"
              >
                <option value="">Sélectionner...</option>
                {(bibliotheques as any[])
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
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] disabled:opacity-50 font-medium"
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateSheet(false)}
                className="flex-1 px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </BottomSheet>
      </div>
    </PageLayout>
  )
}
