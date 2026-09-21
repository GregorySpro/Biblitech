import { useState } from 'react'
import { BuildingLibraryIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
import { bibliothequeService } from '../services/bibliothequeService'
import type { Bibliotheque } from '../types'
import type { Column } from '../components/DataTable'

interface BiblioRow {
  id: number
  nom: string
  ville: string
  email: string
  duret_pret_jours: number
  active: boolean
}

const cols: Column<BiblioRow>[] = [
  { key: 'nom',              header: 'Nom',                sortable: true },
  { key: 'ville',            header: 'Ville',              sortable: true },
  { key: 'email',            header: 'E-mail' },
  { key: 'duret_pret_jours', header: 'Durée prêt (j)',    width: '120px' },
  { key: 'active',           header: 'Statut',             width: '90px', render: r => (
    <Badge label={r.active ? 'Active' : 'Inactive'} variant={r.active ? 'success' : 'neutral'} dot />
  )},
]

const EMPTY_FORM: Partial<Bibliotheque> = { nom: '', adresse: '', ville: '', code_postal: '', email: '', duret_pret_jours: 21, active: true }

export function BibliothequeManagementPage() {
  const { user }                           = useAuth()
  const isSuperAdmin                       = user?.role === 'super_admin'
  const [selectedId, setSelectedId]        = useState<number | null>(null)
  const [showForm, setShowForm]            = useState(false)
  const [editing, setEditing]              = useState<Partial<Bibliotheque>>(EMPTY_FORM)
  const [editId, setEditId]                = useState<number | null>(null)
  const [saving, setSaving]                = useState(false)
  const [formError, setFormError]          = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const { data: bibliotheques, loading, error, refetch } = useApiCall(() => bibliothequeService.getAll())

  const rows: BiblioRow[] = (bibliotheques ?? []).map(b => ({
    id: b.id, nom: b.nom, ville: b.ville ?? '–', email: b.email ?? '–',
    duret_pret_jours: b.duret_pret_jours, active: b.active,
  }))

  const openCreate = () => {
    setEditing(EMPTY_FORM)
    setEditId(null)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (bib: Bibliotheque) => {
    setEditing({ ...bib })
    setEditId(bib.id)
    setFormError(null)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing.nom) return
    setSaving(true)
    setFormError(null)
    try {
      if (editId) {
        await bibliothequeService.update(editId, editing)
      } else {
        await bibliothequeService.create(editing)
      }
      setShowForm(false)
      await refetch()
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await bibliothequeService.setActive(id, !active)
      await refetch()
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: number) => {
    try {
      await bibliothequeService.delete(id)
      setShowDeleteConfirm(null)
      await refetch()
    } catch { /* ignore */ }
  }

  const selectedBib = bibliotheques?.find(b => b.id === selectedId)

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 p-6 gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[#111827]">
              {isSuperAdmin ? 'Gestion des bibliothèques' : 'Ma bibliothèque'}
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {isSuperAdmin ? 'Créez et administrez toutes les bibliothèques de la plateforme.' : 'Paramètres de votre bibliothèque.'}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle bibliothèque
            </button>
          )}
        </div>

        {error && <ErrorAlert message="Erreur de chargement" details="Impossible de charger les bibliothèques." onDismiss={() => {}} />}

        {loading ? (
          <LoadingState message="Chargement des bibliothèques…" />
        ) : (
          <DataTable
            columns={cols}
            data={rows}
            selectedId={selectedId}
            onRowClick={r => setSelectedId(r.id === selectedId ? null : r.id)}
            emptyMessage="Aucune bibliothèque enregistrée."
          />
        )}

        {/* Panneau d'actions sur la bibliothèque sélectionnée */}
        {selectedBib && isSuperAdmin && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <BuildingLibraryIcon className="w-5 h-5 text-[#1E3A8A]" />
              <span className="font-medium text-[#111827] text-sm">{selectedBib.nom}</span>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => openEdit(selectedBib)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" /> Modifier
            </button>
            <button
              onClick={() => handleToggleActive(selectedBib.id, selectedBib.active)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                selectedBib.active
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              {selectedBib.active ? 'Désactiver' : 'Activer'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(selectedBib.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-4 h-4" /> Supprimer
            </button>
          </div>
        )}

        {/* Formulaire création/édition */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-base font-bold text-[#111827] mb-5">
                {editId ? 'Modifier la bibliothèque' : 'Nouvelle bibliothèque'}
              </h2>
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Nom *</label>
                  <input type="text" required value={editing.nom ?? ''} onChange={e => setEditing(v => ({ ...v, nom: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Adresse</label>
                    <input type="text" value={editing.adresse ?? ''} onChange={e => setEditing(v => ({ ...v, adresse: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Code postal</label>
                    <input type="text" value={editing.code_postal ?? ''} onChange={e => setEditing(v => ({ ...v, code_postal: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Ville</label>
                    <input type="text" value={editing.ville ?? ''} onChange={e => setEditing(v => ({ ...v, ville: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">E-mail</label>
                    <input type="email" value={editing.email ?? ''} onChange={e => setEditing(v => ({ ...v, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Durée de prêt (jours)</label>
                  <input type="number" min={1} max={365} value={editing.duret_pret_jours ?? 21}
                    onChange={e => setEditing(v => ({ ...v, duret_pret_jours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                </div>
                {formError && <ErrorAlert message="Erreur" details={formError} onDismiss={() => setFormError(null)} />}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm text-[#374151] hover:bg-[#F9FAFB]">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] disabled:opacity-40">
                    {saving ? 'Enregistrement…' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation suppression */}
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <TrashIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h2 className="font-bold text-[#111827] mb-2">Supprimer cette bibliothèque ?</h2>
              <p className="text-sm text-[#6B7280] mb-5">Cette action est irréversible. Tous les livres, exemplaires et prêts associés seront supprimés.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm">Annuler</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Confirmer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
