import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { SearchBar } from '../components/SearchBar'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { BottomSheet } from '../components/BottomSheet'
import { useApiCall } from '../hooks/useApiCall'
import { utilisateurService } from '../services/utilisateurService'
import type { Column } from '../components/DataTable'
import type { Utilisateur } from '../types'

const roleLabelMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
  admin:          { label: 'Admin',          variant: 'warning' },
  bibliothecaire: { label: 'Bibliothécaire', variant: 'info'    },
  adherent:       { label: 'Adhérent',       variant: 'neutral' },
}

const columns: Column<Utilisateur>[] = [
  { key: 'nom',    header: 'Nom',      sortable: true, render: r => (
    <span className="font-medium text-[#1F2937]">{r.nom} {r.prenom}</span>
  )},
  { key: 'email',  header: 'Email',    sortable: true, render: r => (
    <span className="text-[#6B7280]">{r.email}</span>
  )},
  { key: 'role',   header: 'Rôle',     width: '130px', render: r => {
    const { label, variant } = roleLabelMap[r.role] ?? { label: r.role, variant: 'neutral' as const }
    return <Badge label={label} variant={variant} />
  }},
  { key: 'actif',  header: 'Statut',   width: '100px', render: r => (
    <Badge label={r.actif ? 'Actif' : 'Inactif'} variant={r.actif ? 'success' : 'neutral'} dot />
  )},
  { key: 'date_inscription', header: 'Inscription', width: '120px', sortable: true, render: r => (
    new Date(r.date_inscription).toLocaleDateString('fr-FR')
  )},
]

export function AdherentsPage() {
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<Utilisateur | null>(null)

  // Fetch users from API
  const { data: utilisateurs = [], loading, error } = useApiCall(() => utilisateurService.getAll())

  const filtered = useMemo(() => {
    if (!search) return utilisateurs
    const q = search.toLowerCase()
    return utilisateurs.filter(u =>
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [search, utilisateurs])

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
              Adhérents
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {mockAdherents.filter(u => u.actif).length} actifs sur {mockAdherents.length} inscrits
            </p>
          </div>
        </motion.div>

        {/* Barre de recherche */}
        <SearchBar
          placeholder="Rechercher par nom, prénom ou email…"
          onSearch={setSearch}
          className="flex-shrink-0"
        />

        {/* Contenu */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Table + actions */}
          <div className="flex flex-col flex-1 min-w-0 gap-3">
            <DataTable
              columns={columns}
              data={filtered}
              selectedId={selected?.id ?? null}
              onRowClick={row => setSelected(row.id === selected?.id ? null : row)}
              emptyMessage="Aucun adhérent ne correspond à votre recherche."
            />

            {/* Boutons d'action */}
            <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all duration-200 shadow-sm hover:shadow-md shadow-[#1E3A8A]/20">
                <PlusIcon className="w-4 h-4" />
                Ajouter un adhérent
              </button>
              <button
                disabled={!selected}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Modifier
              </button>
              <button
                disabled={!selected || selected.role === 'admin'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>

          {/* Panneau de détail */}
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
                    <UserIcon className="w-4 h-4 text-[#1E3A8A]" />
                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">
                      Fiche adhérent
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
                  {/* Avatar + nom */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border-2 border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                      <span style={{ fontFamily: 'var(--font-display)' }} className="text-[#1E3A8A] font-bold text-base">
                        {selected.prenom[0]}{selected.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827]">
                        {selected.prenom} {selected.nom}
                      </p>
                      <div className="mt-1">
                        <Badge
                          label={roleLabelMap[selected.role]?.label ?? selected.role}
                          variant={roleLabelMap[selected.role]?.variant ?? 'neutral'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <EnvelopeIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                      <span className="text-[#374151] break-all">{selected.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CalendarDaysIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                      <span className="text-[#374151]">
                        Inscrit le {new Date(selected.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[#9CA3AF] text-xs font-medium w-4 flex-shrink-0">●</span>
                      <Badge label={selected.actif ? 'Compte actif' : 'Compte désactivé'} variant={selected.actif ? 'success' : 'danger'} dot />
                    </div>
                  </div>
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
                  <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sélectionnez un adhérent pour voir sa fiche</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile : BottomSheet détail ── */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Fiche adhérent"
      >
        {selected && (
          <div className="px-5 py-4 space-y-5">
            {/* Avatar + nom */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border-2 border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                <span style={{ fontFamily: 'var(--font-display)' }} className="text-[#1E3A8A] font-bold text-base">
                  {selected.prenom[0]}{selected.nom[0]}
                </span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827]">
                  {selected.prenom} {selected.nom}
                </p>
                <div className="mt-1">
                  <Badge
                    label={roleLabelMap[selected.role]?.label ?? selected.role}
                    variant={roleLabelMap[selected.role]?.variant ?? 'neutral'}
                  />
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <EnvelopeIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <span className="text-[#374151] break-all">{selected.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarDaysIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <span className="text-[#374151]">
                  Inscrit le {new Date(selected.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#9CA3AF] text-xs font-medium w-4 flex-shrink-0">●</span>
                <Badge label={selected.actif ? 'Compte actif' : 'Compte désactivé'} variant={selected.actif ? 'success' : 'danger'} dot />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                <PencilSquareIcon className="w-4 h-4" />
                Modifier
              </button>
              <button
                disabled={selected.role === 'admin'}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </PageLayout>
  )
}
