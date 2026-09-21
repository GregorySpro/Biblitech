import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PencilSquareIcon,
  UserIcon,
  XMarkIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  BuildingLibraryIcon,
  NoSymbolIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { SearchBar } from '../components/SearchBar'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { BottomSheet } from '../components/BottomSheet'
import { useApiCall } from '../hooks/useApiCall'
import { useAuth } from '../hooks/useAuth'
import { useGlobalLoading } from '../context/GlobalLoadingContext'
import { utilisateurService } from '../services/utilisateurService'
import { bibliothequeService } from '../services/bibliothequeService'
import { validators, errorMessages } from '../utils/validators'
import api from '../services/api'
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
  { key: 'active',  header: 'Statut',   width: '100px', render: r => (
    <Badge label={r.active ? 'Actif' : 'Inactif'} variant={r.active ? 'success' : 'neutral'} dot />
  )},
  { key: 'created_at', header: 'Inscription', width: '120px', sortable: true, render: r => (
    new Date(r.created_at).toLocaleDateString('fr-FR')
  )},
]

export function AdherentsPage() {
  const { user } = useAuth()
  const { withLoading } = useGlobalLoading()
  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = user?.role === 'admin'
  const canChangeRole = isSuperAdmin || isAdmin
  const canCreate = !isSuperAdmin  // super_admin ne crée pas d'adhérents directement
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<Utilisateur | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [emailUnlocked, setEmailUnlocked] = useState(false)
  const [emailConfirm, setEmailConfirm] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'adherent' as const,
    mot_de_passe: '',
    bibliotheque_id: null as number | null,
  })

  // Fetch users from API
  const { data: utilisateursData, loading, error, refetch } = useApiCall(() => utilisateurService.getAll())
  const { data: bibliotheques } = useApiCall(() => bibliothequeService.getAll())
  const utilisateurs = utilisateursData ?? []

  const filtered = useMemo(() => {
    if (!search) return utilisateurs
    const q = search.toLowerCase()
    return utilisateurs.filter(u =>
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [search, utilisateurs])

  const handleOpenAddForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      role: 'adherent',
      mot_de_passe: '',
      bibliotheque_id: null,
    })
    setIsEditing(false)
    setEmailUnlocked(false)
    setEmailConfirm('')
    setShowFormModal(true)
  }

  const handleOpenEditForm = () => {
    if (!selected) return
    setFormData({
      nom: selected.nom,
      prenom: selected.prenom,
      email: selected.email,
      role: selected.role as any,
      mot_de_passe: '',
      bibliotheque_id: selected.bibliotheque_id ?? null,
    })
    setIsEditing(true)
    setEmailUnlocked(false)
    setEmailConfirm('')
    setShowFormModal(true)
  }

  const handleFormSubmit = async () => {    const errors: string[] = []

    // Validation
    if (!formData.nom.trim()) {
      errors.push('Nom obligatoire')
    } else if (!validators.isValidName(formData.nom)) {
      errors.push(errorMessages.name)
    }

    if (!formData.prenom.trim()) {
      errors.push('Prénom obligatoire')
    } else if (!validators.isValidName(formData.prenom)) {
      errors.push(errorMessages.name)
    }

    if (!formData.email.trim()) {
      errors.push('Email obligatoire')
    } else if (!validators.isValidEmail(formData.email)) {
      errors.push(errorMessages.email)
    }

    // Garde-fou : si email modifié en édition, confirmation obligatoire
    if (isEditing && emailUnlocked) {
      if (!emailConfirm.trim()) {
        errors.push('Veuillez confirmer le nouvel email')
      } else if (formData.email.trim() !== emailConfirm.trim()) {
        errors.push('Les deux emails ne correspondent pas')
      }
    }

    if (!isEditing && !formData.mot_de_passe?.trim()) {
      errors.push('Mot de passe requis pour créer un compte')
    } else if (!isEditing && formData.mot_de_passe && !validators.isStrongPassword(formData.mot_de_passe)) {
      errors.push(errorMessages.password)
    }

    if (errors.length > 0) {
      setFormError(errors.join(' • '))
      return
    }

    setFormSaving(true)
    try {
      setFormError(null)
      const submitData = isEditing
        ? {
            nom: formData.nom,
            prenom: formData.prenom,
            // N'envoie l'email que si l'utilisateur a explicitement déverrouillé et confirmé
            ...(emailUnlocked && { email: formData.email }),
            role: formData.role,
            ...(isSuperAdmin && { bibliotheque_id: formData.bibliotheque_id }),
          }
        : formData
      await withLoading(async () => {
        if (isEditing && selected) {
          await utilisateurService.update(selected.id, submitData)
        } else {
          await utilisateurService.create(submitData as any)
        }
      })
      setShowFormModal(false)
      setSelected(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setFormSaving(false)
    }
  }

  const handleToggleSuspension = async () => {
    if (!selected) return
    await withLoading(async () => {
      const suspendre = !selected.prets_suspendus
      await api.patch(`/api/utilisateurs/${selected.id}/suspendre-prets`, { suspendre })
      await refetch()
      setSelected(prev => prev ? { ...prev, prets_suspendus: suspendre } : null)
    })
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
              Adhérents
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {loading ? 'Chargement...' : error ? 'Erreur' : `${utilisateurs.filter(u => u.active).length} actifs sur ${utilisateurs.length} inscrits`}
            </p>
          </div>
        </motion.div>

        {/* Affichage des erreurs */}
        {error && (
          <ErrorAlert
            message="Erreur de chargement"
            details="Impossible de charger la liste des adhérents. Veuillez réessayer."
            onDismiss={() => refetch()}
          />
        )}

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
            {loading ? (
              <LoadingState message="Chargement des adhérents..." />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                selectedId={selected?.id ?? null}
                onRowClick={row => setSelected(row.id === selected?.id ? null : row)}
                emptyMessage="Aucun adhérent ne correspond à votre recherche."
              />
            )}

            {/* Boutons d'action */}
            <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
              {canCreate && (
                <button
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all duration-200 shadow-sm hover:shadow-md shadow-[#1E3A8A]/20">
                  <PlusIcon className="w-4 h-4" />
                  Ajouter un adhérent
                </button>
              )}
              <button
                disabled={!selected}
                onClick={handleOpenEditForm}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Modifier
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
                    {selected.bibliotheque_id && (
                      <div className="flex items-center gap-3 text-sm">
                        <BuildingLibraryIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                        <span className="text-[#374151]">
                          {(bibliotheques ?? []).find((b: any) => b.id === selected.bibliotheque_id)?.nom ?? `Bibliothèque #${selected.bibliotheque_id}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <CalendarDaysIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                      <span className="text-[#374151]">
                        Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-[#9CA3AF] text-xs font-medium w-4 flex-shrink-0">●</span>
                      <Badge label={selected.active ? 'Compte actif' : 'Compte désactivé'} variant={selected.active ? 'success' : 'danger'} dot />
                    </div>
                    {selected.prets_suspendus && (
                      <div className="flex items-center gap-3 text-sm">
                        <NoSymbolIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <Badge label="Prêts suspendus" variant="warning" />
                      </div>
                    )}
                  </div>

                  {/* Bouton suspension */}
                  {(isAdmin || isSuperAdmin) && (
                    <button
                      onClick={handleToggleSuspension}
                      style={{ cursor: 'pointer' }}
                      className={`w-full flex items-center justify-center gap-2 mt-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        selected.prets_suspendus
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                      }`}
                    >
                      {selected.prets_suspendus
                        ? <><CheckCircleIcon className="w-4 h-4" /> Réautoriser les prêts</>
                        : <><NoSymbolIcon className="w-4 h-4" /> Suspendre les prêts</>
                      }
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
              {selected.bibliotheque_id && (
                <div className="flex items-center gap-3 text-sm">
                  <BuildingLibraryIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  <span className="text-[#374151]">
                    {(bibliotheques ?? []).find((b: any) => b.id === selected.bibliotheque_id)?.nom ?? `Bibliothèque #${selected.bibliotheque_id}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <CalendarDaysIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <span className="text-[#374151]">
                  Inscrit le {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#9CA3AF] text-xs font-medium w-4 flex-shrink-0">●</span>
                <Badge label={selected.active ? 'Compte actif' : 'Compte désactivé'} variant={selected.active ? 'success' : 'danger'} dot />
              </div>
              {selected.prets_suspendus && (
                <div className="flex items-center gap-3 text-sm">
                  <NoSymbolIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <Badge label="Prêts suspendus" variant="warning" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleOpenEditForm}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors">
                <PencilSquareIcon className="w-4 h-4" />
                Modifier
              </button>
              {(isAdmin || isSuperAdmin) && (
                <button
                  onClick={handleToggleSuspension}
                  style={{ cursor: 'pointer' }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    selected.prets_suspendus
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-orange-200 bg-orange-50 text-orange-700'
                  }`}
                >
                  {selected.prets_suspendus
                    ? <><CheckCircleIcon className="w-4 h-4" /> Réautoriser</>
                    : <><NoSymbolIcon className="w-4 h-4" /> Suspendre</>
                  }
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

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
              className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-[#111827] mb-6">{isEditing ? 'Modifier l\'adhérent' : 'Ajouter un adhérent'}</h3>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Prénom"
                    disabled={formSaving}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom"
                    disabled={formSaving}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Email *</label>
                  {isEditing && !emailUnlocked ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#6B7280] truncate">
                        {formData.email}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEmailUnlocked(true); setEmailConfirm('') }}
                        disabled={formSaving}
                        className="px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        Modifier
                      </button>
                    </div>
                  ) : (
                    <>
                      {isEditing && emailUnlocked && (
                        <div className="mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">⚠️</span>
                          <span>Attention — la modification de l'email affecte la connexion de cet utilisateur. Assurez-vous de saisir correctement le nouvel email.</span>
                        </div>
                      )}
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        autoComplete="off"
                        disabled={formSaving}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-amber-300 bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all disabled:opacity-50"
                      />
                      {isEditing && emailUnlocked && (
                        <>
                          <label className="block text-sm font-medium text-[#374151] mt-3 mb-1">Confirmer le nouvel email *</label>
                          <input
                            type="email"
                            value={emailConfirm}
                            onChange={e => setEmailConfirm(e.target.value)}
                            placeholder="Répétez le nouvel email"
                            autoComplete="off"
                            disabled={formSaving}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                              emailConfirm && emailConfirm !== formData.email
                                ? 'border-red-300 focus:ring-red-300/30 focus:border-red-400 bg-red-50'
                                : emailConfirm && emailConfirm === formData.email
                                ? 'border-green-300 focus:ring-green-300/30 focus:border-green-400 bg-green-50'
                                : 'border-[#E5E7EB] bg-white focus:ring-amber-400/30 focus:border-amber-400'
                            }`}
                          />
                          {emailConfirm && emailConfirm !== formData.email && (
                            <p className="text-xs text-red-600 mt-1">Les emails ne correspondent pas</p>
                          )}
                          <button
                            type="button"
                            onClick={() => { setEmailUnlocked(false); setEmailConfirm(''); setFormData(f => ({ ...f, email: selected!.email })) }}
                            className="mt-2 text-xs text-[#6B7280] hover:text-[#374151] underline cursor-pointer"
                          >
                            Annuler la modification
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Rôle */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Rôle *</label>
                  {canChangeRole && !(isAdmin && (formData.role as string) === 'super_admin') ? (
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                      disabled={formSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    >
                      <option value="adherent">Adhérent</option>
                      <option value="bibliothecaire">Bibliothécaire</option>
                      <option value="admin">Admin</option>
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                  ) : (
                    <div className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#6B7280]">
                      {roleLabelMap[formData.role]?.label ?? formData.role}
                    </div>
                  )}
                </div>

                {/* Bibliothèque (super_admin uniquement) */}
                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Bibliothèque associée</label>
                    <select
                      value={formData.bibliotheque_id ?? ''}
                      onChange={e => setFormData({ ...formData, bibliotheque_id: e.target.value ? Number(e.target.value) : null })}
                      disabled={formSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    >
                      <option value="">— Aucune (super_admin) —</option>
                      {(bibliotheques ?? []).map((b: any) => (
                        <option key={b.id} value={b.id}>{b.nom}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mot de passe (création seulement) */}
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1">Mot de passe *</label>
                    <input
                      type="password"
                      value={formData.mot_de_passe}
                      onChange={e => setFormData({ ...formData, mot_de_passe: e.target.value })}
                      placeholder="Mot de passe"
                      autoComplete="new-password"
                      disabled={formSaving}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all disabled:opacity-50"
                    />
                  </div>
                )}
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
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {formSaving ? '...' : isEditing ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
