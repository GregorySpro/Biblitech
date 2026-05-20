import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  QrCodeIcon,
  BookOpenIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { SearchBar } from '../components/SearchBar'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
import { livreService } from '../services/livreService'
import { exemplaireService } from '../services/exemplaireService'
import type { Column } from '../components/DataTable'
import type { Livre, Exemplaire } from '../types'

// ── Colonnes ───────────────────────────────────────────────
const columns: Column<Livre>[] = [
  { key: 'isbn',   header: 'ISBN',    width: '140px', render: r => (
    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
      {r.isbn}
    </span>
  )},
  { key: 'titre',  header: 'Titre',   sortable: true },
  { key: 'auteur', header: 'Auteur',  sortable: true },
  { key: 'editeur',header: 'Éditeur', sortable: true },
  { key: 'annee_publication', header: 'Année', width: '70px', sortable: true },
  { key: 'genre',  header: 'Genre',   width: '130px', render: r => (
    <Badge label={r.genre} variant="info" />
  )},
]

// ── Composant principal ────────────────────────────────────
export function CataloguePage() {
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Livre | null>(null)
  const [isbnSearch, setIsbnSearch] = useState('')
  const [isbnError, setIsbnError]   = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [formData, setFormData] = useState({
    isbn: '',
    titre: '',
    auteur: '',
    editeur: '',
    annee_publication: new Date().getFullYear(),
    genre: '',
    resume: '',
  })
  const [exemplaires, setExemplaires] = useState<Exemplaire[]>([])
  const [loadingExemplaires, setLoadingExemplaires] = useState(false)
  const [showExemplaireForm, setShowExemplaireForm] = useState(false)
  const [exemplaireSaving, setExemplaireSaving] = useState(false)
  const [codeExemplaire, setCodeExemplaire] = useState('')
  const [exemplaireStatut, setExemplaireStatut] = useState<'disponible' | 'emprunte' | 'hors_service'>('disponible')
  const { user } = useAuth()
  const canEdit = user?.role !== 'adherent'

  // Fetch books from API
  const { data: livres = [], loading, error, refetch } = useApiCall(() => livreService.getAll())

  // Handle ISBN search
  const handleIsbnSearch = async () => {
    if (!isbnSearch.trim()) {
      setIsbnError('Veuillez entrer un ISBN')
      return
    }
    try {
      setIsbnError(null)
      const livre = await livreService.searchByIsbn(isbnSearch.trim())
      setSelected(livre)
      setIsbnSearch('')
    } catch (err) {
      setIsbnError(err instanceof Error ? err.message : 'ISBN non trouvé')
    }
  }

  // Handle book deletion
  const handleDeleteBook = async () => {
    if (!selected) return
    setDeleting(true)
    try {
      await livreService.delete(selected.id)
      setSelected(null)
      setShowDeleteConfirm(false)
      await refetch()
    } catch (err) {
      setIsbnError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  // Handle form open for adding new book
  const handleOpenAddForm = () => {
    setFormData({
      isbn: '',
      titre: '',
      auteur: '',
      editeur: '',
      annee_publication: new Date().getFullYear(),
      genre: '',
      resume: '',
    })
    setIsEditing(false)
    setShowFormModal(true)
  }

  // Handle form open for editing selected book
  const handleOpenEditForm = () => {
    if (!selected) return
    setFormData({
      isbn: selected.isbn,
      titre: selected.titre,
      auteur: selected.auteur,
      editeur: selected.editeur,
      annee_publication: selected.annee_publication,
      genre: selected.genre,
      resume: selected.resume,
    })
    setIsEditing(true)
    setShowFormModal(true)
  }

  // Handle form submission (create or update)
  const handleFormSubmit = async () => {
    if (!formData.isbn.trim() || !formData.titre.trim()) {
      setIsbnError('ISBN et titre sont obligatoires')
      return
    }
    setFormSaving(true)
    try {
      setIsbnError(null)
      if (isEditing && selected) {
        await livreService.update(selected.id, formData)
      } else {
        await livreService.create(formData)
      }
      setShowFormModal(false)
      setSelected(null)
      await refetch()
    } catch (err) {
      setIsbnError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setFormSaving(false)
    }
  }

  // Load exemplaires when book is selected
  const loadExemplaires = async (livreId: number) => {
    setLoadingExemplaires(true)
    try {
      const data = await exemplaireService.getByLivre(livreId)
      setExemplaires(data)
    } catch (err) {
      setIsbnError(err instanceof Error ? err.message : 'Erreur lors du chargement des exemplaires')
    } finally {
      setLoadingExemplaires(false)
    }
  }

  // Handle adding exemplaire
  const handleAddExemplaire = async () => {
    if (!codeExemplaire.trim() || !selected) {
      setIsbnError('Code exemplaire obligatoire')
      return
    }
    setExemplaireSaving(true)
    try {
      setIsbnError(null)
      await exemplaireService.create({
        livreId: selected.id,
        codeExemplaire: codeExemplaire.trim(),
        statut: exemplaireStatut,
      })
      setCodeExemplaire('')
      setExemplaireStatut('disponible')
      setShowExemplaireForm(false)
      await loadExemplaires(selected.id)
    } catch (err) {
      setIsbnError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setExemplaireSaving(false)
    }
  }

  // Handle deleting exemplaire
  const handleDeleteExemplaire = async (id: number) => {
    if (!window.confirm('Supprimer cet exemplaire ?')) return
    try {
      await exemplaireService.delete(id)
      if (selected) await loadExemplaires(selected.id)
    } catch (err) {
      setIsbnError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const filtered = useMemo(() => {
    if (!search) return livres
    const q = search.toLowerCase()
    return livres.filter(l =>
      l.titre?.toLowerCase().includes(q) ||
      l.auteur?.toLowerCase().includes(q) ||
      l.isbn?.includes(q) ||
      l.genre?.toLowerCase().includes(q)
    )
  }, [search, livres])

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 p-6 gap-4 overflow-hidden">

        {/* ── En-tête ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between flex-shrink-0"
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[#111827]">
              Catalogue
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {loading ? 'Chargement...' : error ? 'Erreur' : `${livres.length} livres dans la bibliothèque`}
            </p>
          </div>
        </motion.div>

        {/* Affichage des erreurs */}
        {error && (
          <ErrorAlert
            message="Erreur de chargement"
            details="Impossible de charger le catalogue. Veuillez réessayer."
            onDismiss={() => refetch()}
          />
        )}
        {isbnError && (
          <ErrorAlert
            message="Erreur"
            details={isbnError}
            onDismiss={() => setIsbnError(null)}
          />
        )}

        {/* ── Zone recherche (right-up-part) ── */}
        <div className="flex gap-3 flex-shrink-0">
          <SearchBar
            placeholder="Rechercher par titre, auteur, ISBN, genre…"
            onSearch={setSearch}
            className="flex-1"
          />
          {/* Recherche ISBN via Google Books */}
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              <input
                type="text"
                value={isbnSearch}
                onChange={e => setIsbnSearch(e.target.value)}
                placeholder="ISBN (Google Books)"
                style={{ fontFamily: 'var(--font-mono)' }}
                className="pl-9 pr-4 py-2.5 w-52 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all duration-200 shadow-sm"
              />
            </div>
            <button
              onClick={handleIsbnSearch}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors shadow-sm"
            >
              <QrCodeIcon className="w-4 h-4" />
              Rechercher
            </button>
          </div>
        </div>

        {/* ── Contenu principal (right-down-part) ── */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── Gauche : table + actions ── */}
          <div className="flex flex-col flex-1 min-w-0 gap-3">

            {/* Table (right-down-left-up-part) */}
            {loading ? (
              <LoadingState message="Chargement du catalogue..." />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                selectedId={selected?.id ?? null}
                onRowClick={row => {
                  if (selected?.id === row.id) {
                    setSelected(null)
                    setExemplaires([])
                  } else {
                    setSelected(row)
                    loadExemplaires(row.id)
                  }
                }}
                emptyMessage="Aucun livre ne correspond à votre recherche."
              />
            )}

            {/* Actions (right-down-left-down-part) */}
            {canEdit && (
              <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
                <button
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all duration-200 shadow-sm hover:shadow-md shadow-[#1E3A8A]/20">
                  <PlusIcon className="w-4 h-4" />
                  Ajouter un livre
                </button>
                <button
                  disabled={!selected}
                  onClick={handleOpenEditForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  disabled={!selected}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {/* ── Droite : panneau de détail ── */}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-[30%] flex-shrink-0 bg-white rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden"
              >
                {/* Header détail */}
                <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-[#1E3A8A]" />
                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">
                      Détail du livre
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
                    aria-label="Fermer"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Corps détail */}
                <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827] text-base leading-tight">
                      {selected.titre}
                    </h3>
                    <p className="text-sm text-[#60A5FA] font-medium mt-1">{selected.auteur}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">ISBN</p>
                      <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#374151] bg-[#F3F4F6] px-2 py-1 rounded">
                        {selected.isbn}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">Année</p>
                      <p className="text-[#374151]">{selected.annee_publication}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">Éditeur</p>
                      <p className="text-[#374151]">{selected.editeur}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-1">Genre</p>
                      <Badge label={selected.genre} variant="info" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Résumé</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{selected.resume}</p>
                  </div>

                  {/* Exemplaires section */}
                  <div className="border-t border-[#F3F4F6] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Exemplaires ({exemplaires.length})</p>
                      {canEdit && (
                        <button
                          onClick={() => setShowExemplaireForm(true)}
                          className="text-[#1E3A8A] hover:text-[#1e40af] transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {loadingExemplaires ? (
                      <p className="text-xs text-[#6B7280]">Chargement...</p>
                    ) : exemplaires.length > 0 ? (
                      <div className="space-y-2">
                        {exemplaires.map(ex => (
                          <div key={ex.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3F4F6] text-xs">
                            <div className="flex-1">
                              <p style={{ fontFamily: 'var(--font-mono)' }} className="font-medium text-[#374151]">{ex.codeExemplaire}</p>
                              <Badge label={ex.statut === 'disponible' ? 'Disponible' : ex.statut === 'emprunte' ? 'Emprunté' : 'Hors service'}
                                     variant={ex.statut === 'disponible' ? 'success' : ex.statut === 'emprunte' ? 'info' : 'neutral'} />
                            </div>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteExemplaire(ex.id)}
                                className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#9CA3AF]">Aucune copie</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-[30%] flex-shrink-0 bg-white/50 rounded-xl border border-dashed border-[#D1D5DB] flex items-center justify-center"
              >
                <div className="text-center text-[#9CA3AF] px-6">
                  <BookOpenIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sélectionnez un livre pour voir ses détails</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Confirmation delete modal ── */}
        <AnimatePresence>
          {showDeleteConfirm && selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
              onClick={() => !deleting && setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-[#111827] mb-2">Supprimer ce livre ?</h3>
                <p className="text-sm text-[#6B7280] mb-6">
                  Vous êtes sur le point de supprimer "<strong>{selected.titre}</strong>". Cette action ne peut pas être annulée.
                </p>
                <div className="flex gap-3">
                  <button
                    disabled={deleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={deleting}
                    onClick={handleDeleteBook}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {deleting ? '...' : 'Supprimer'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Add/Edit form modal ── */}
        <AnimatePresence>
          {showFormModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
              onClick={() => !formSaving && setShowFormModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-[#111827] mb-6">{isEditing ? 'Modifier le livre' : 'Ajouter un livre'}</h3>

                <div className="space-y-4 mb-6">
                  {/* ISBN */}
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">ISBN *</label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="ISBN"
                      disabled={formSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Titre *</label>
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={e => setFormData({ ...formData, titre: e.target.value })}
                      placeholder="Titre du livre"
                      disabled={formSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Auteur & Éditeur */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Auteur</label>
                      <input
                        type="text"
                        value={formData.auteur}
                        onChange={e => setFormData({ ...formData, auteur: e.target.value })}
                        placeholder="Nom de l'auteur"
                        disabled={formSaving}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Éditeur</label>
                      <input
                        type="text"
                        value={formData.editeur}
                        onChange={e => setFormData({ ...formData, editeur: e.target.value })}
                        placeholder="Éditeur"
                        disabled={formSaving}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Année & Genre */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Année de publication</label>
                      <input
                        type="number"
                        value={formData.annee_publication}
                        onChange={e => setFormData({ ...formData, annee_publication: parseInt(e.target.value) })}
                        disabled={formSaving}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#374151] mb-1">Genre</label>
                      <input
                        type="text"
                        value={formData.genre}
                        onChange={e => setFormData({ ...formData, genre: e.target.value })}
                        placeholder="Genre"
                        disabled={formSaving}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Résumé */}
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Résumé</label>
                    <textarea
                      value={formData.resume}
                      onChange={e => setFormData({ ...formData, resume: e.target.value })}
                      placeholder="Description du livre"
                      disabled={formSaving}
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={formSaving}
                    onClick={() => setShowFormModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={formSaving}
                    onClick={handleFormSubmit}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {formSaving ? '...' : isEditing ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Add exemplaire modal ── */}
        <AnimatePresence>
          {showExemplaireForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
              onClick={() => !exemplaireSaving && setShowExemplaireForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-[#111827] mb-6">Ajouter une copie</h3>

                <div className="space-y-4 mb-6">
                  {/* Code Exemplaire */}
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Code exemplaire *</label>
                    <input
                      type="text"
                      value={codeExemplaire}
                      onChange={e => setCodeExemplaire(e.target.value)}
                      placeholder="Identifiant unique"
                      disabled={exemplaireSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Statut</label>
                    <select
                      value={exemplaireStatut}
                      onChange={e => setExemplaireStatut(e.target.value as any)}
                      disabled={exemplaireSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="emprunte">Emprunté</option>
                      <option value="hors_service">Hors service</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={exemplaireSaving}
                    onClick={() => setShowExemplaireForm(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={exemplaireSaving}
                    onClick={handleAddExemplaire}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {exemplaireSaving ? '...' : 'Ajouter'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
