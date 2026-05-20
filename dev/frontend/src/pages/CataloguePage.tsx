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
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
import { livreService } from '../services/livreService'
import type { Column } from '../components/DataTable'
import type { Livre } from '../types'

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
  const { user } = useAuth()
  const canEdit = user?.role !== 'adherent'

  // Fetch books from API
  const { data: livres = [], loading, error } = useApiCall(() => livreService.getAll())

  const filtered = useMemo(() => {
    if (!search) return livres
    const q = search.toLowerCase()
    return livres.filter(l =>
      l.titre.toLowerCase().includes(q) ||
      l.auteur.toLowerCase().includes(q) ||
      l.isbn.includes(q) ||
      l.genre.toLowerCase().includes(q)
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
            <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors shadow-sm">
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
            <DataTable
              columns={columns}
              data={filtered}
              selectedId={selected?.id ?? null}
              onRowClick={row => setSelected(row.id === selected?.id ? null : row)}
              emptyMessage="Aucun livre ne correspond à votre recherche."
            />

            {/* Actions (right-down-left-down-part) */}
            {canEdit && (
              <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all duration-200 shadow-sm hover:shadow-md shadow-[#1E3A8A]/20">
                  <PlusIcon className="w-4 h-4" />
                  Ajouter un livre
                </button>
                <button
                  disabled={!selected}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  disabled={!selected}
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
      </div>
    </PageLayout>
  )
}
