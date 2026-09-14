import { useState, useEffect } from 'react'
import { UserCircleIcon, LockClosedIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { ErrorAlert } from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { utilisateurService } from '../services/utilisateurService'
import { cguService } from '../services/cguService'
import type { CguVersionDTO } from '../services/cguService'
import { useCgu } from '../context/CguContext'

const REQUIREMENTS = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre',          test: (p: string) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

export function MonComptePage() {
  const { user, manualRefresh, logout } = useAuth()
  const { reload: reloadCgu } = useCgu()

  const [nom, setNom]       = useState(user?.email?.split('@')[0] ?? '')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail]   = useState(user?.email ?? '')

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const [profileError, setProfileError]     = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [pwdError, setPwdError]             = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess]         = useState(false)
  const [loading, setLoading]               = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── CGU management (super_admin only) ────────────────────────────────────────
  const [cguHistory, setCguHistory]         = useState<CguVersionDTO[]>([])
  const [cguVersion, setCguVersion]         = useState('')
  const [cguContenuForm, setCguContenuForm] = useState('')
  const [cguDateEffet, setCguDateEffet]     = useState('')
  const [cguError, setCguError]             = useState<string | null>(null)
  const [cguSuccess, setCguSuccess]         = useState(false)
  const [cguLoading, setCguLoading]         = useState(false)

  const isSuperAdmin = user?.role === 'super_admin'

  useEffect(() => {
    if (!isSuperAdmin) return
    cguService.getHistory()
      .then(setCguHistory)
      .catch(() => setCguHistory([]))
  }, [isSuperAdmin])

  const handleCguCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCguError(null)
    setCguSuccess(false)
    setCguLoading(true)
    try {
      await cguService.create({ version: cguVersion, contenu: cguContenuForm, date_effet: cguDateEffet })
      setCguVersion('')
      setCguContenuForm('')
      setCguDateEffet('')
      setCguSuccess(true)
      const history = await cguService.getHistory()
      setCguHistory(history)
      reloadCgu()
    } catch (err: any) {
      setCguError(err?.response?.data?.message ?? 'Erreur lors de la publication.')
    } finally {
      setCguLoading(false)
    }
  }

  const allPwdValid = REQUIREMENTS.every(r => r.test(newPwd)) && newPwd === confirmPwd

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProfileError(null)
    setProfileSuccess(false)
    try {
      await utilisateurService.updateMe({ nom, prenom, email })
      await manualRefresh()
      setProfileSuccess(true)
    } catch (err: any) {
      setProfileError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allPwdValid) return
    setLoading(true)
    setPwdError(null)
    setPwdSuccess(false)
    try {
      await utilisateurService.updateMe({ current_password: currentPwd, mot_de_passe: newPwd })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdSuccess(true)
    } catch (err: any) {
      setPwdError(err?.response?.data?.message ?? 'Erreur lors du changement de mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await utilisateurService.deleteMe()
      logout()
    } catch {
      // silently ignore
    }
  }

  const roleLabel: Record<string, string> = {
    super_admin:    'Super Administrateur',
    admin:          'Administrateur',
    bibliothecaire: 'Bibliothécaire',
    adherent:       'Adhérent',
  }

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 p-6 gap-6 max-w-2xl">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[#111827]">Mon compte</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Gérez vos informations personnelles et votre sécurité</p>
        </div>

        {/* Informations du profil */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <UserCircleIcon className="w-5 h-5 text-[#1E3A8A]" />
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827]">Informations personnelles</h2>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E3A8A] font-medium">
              {user?.role ? (roleLabel[user.role] ?? user.role) : '–'}
            </span>
            {user?.bibliotheque_nom && (
              <span className="text-xs text-[#6B7280]">· {user.bibliotheque_nom}</span>
            )}
          </div>

          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Nom</label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
              />
            </div>

            {profileError && <ErrorAlert message="Erreur" details={profileError} onDismiss={() => setProfileError(null)} />}
            {profileSuccess && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Profil mis à jour avec succès.</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="self-start px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-40"
            >
              {loading ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        {/* Changement de mot de passe */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <LockClosedIcon className="w-5 h-5 text-[#1E3A8A]" />
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827]">Changer le mot de passe</h2>
          </div>

          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                placeholder="••••••••"
              />
              <div className="mt-2 grid grid-cols-2 gap-1">
                {REQUIREMENTS.map(r => (
                  <p key={r.label} className={`text-xs ${r.test(newPwd) ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                    {r.test(newPwd) ? '✓' : '○'} {r.label}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Confirmer</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                placeholder="••••••••"
              />
            </div>

            {pwdError && <ErrorAlert message="Erreur" details={pwdError} onDismiss={() => setPwdError(null)} />}
            {pwdSuccess && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Mot de passe modifié avec succès.</p>
            )}

            <button
              type="submit"
              disabled={!allPwdValid || !currentPwd || loading}
              className="self-start px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* ── Gestion CGU (super_admin uniquement) ── */}
        {isSuperAdmin && (
          <>
            {/* Historique des versions */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <DocumentTextIcon className="w-5 h-5 text-[#1E3A8A]" />
                <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827]">Gestion des CGU</h2>
              </div>

              {cguHistory.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] italic">Aucune version publiée pour l'instant.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-[#E5E7EB]">
                        <th className="pb-2 font-semibold text-[#374151] pr-4">Version</th>
                        <th className="pb-2 font-semibold text-[#374151] pr-4">Publiée par</th>
                        <th className="pb-2 font-semibold text-[#374151] pr-4">Date publication</th>
                        <th className="pb-2 font-semibold text-[#374151]">Date d'effet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cguHistory.map(v => (
                        <tr key={v.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                          <td className="py-2 pr-4 font-medium text-[#1E3A8A]">{v.version}</td>
                          <td className="py-2 pr-4 text-[#6B7280]">{v.publie_par}</td>
                          <td className="py-2 pr-4 text-[#6B7280]">{new Date(v.date_publication).toLocaleDateString('fr-FR')}</td>
                          <td className="py-2 text-[#6B7280]">{new Date(v.date_effet).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Formulaire publication nouvelle version */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <DocumentTextIcon className="w-5 h-5 text-[#1E3A8A]" />
                <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827]">Publier une nouvelle version de CGU</h2>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                La date d'effet doit être au minimum 15 jours après aujourd'hui (préavis obligatoire).
                Les utilisateurs seront notifiés et devront accepter les nouvelles CGU à la date d'effet.
              </p>

              <form onSubmit={handleCguCreate} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">Numéro de version</label>
                    <input
                      type="text"
                      value={cguVersion}
                      onChange={e => setCguVersion(e.target.value)}
                      placeholder="ex : 2.0"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">Date d'effet</label>
                    <input
                      type="date"
                      value={cguDateEffet}
                      onChange={e => setCguDateEffet(e.target.value)}
                      required
                      min={(() => {
                        const d = new Date(); d.setDate(d.getDate() + 15)
                        return d.toISOString().split('T')[0]
                      })()}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">Contenu des CGU</label>
                  <textarea
                    value={cguContenuForm}
                    onChange={e => setCguContenuForm(e.target.value)}
                    rows={10}
                    required
                    placeholder="Saisissez le texte des CGU. Séparez les paragraphes par des retours à la ligne."
                    className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] resize-y font-mono"
                  />
                </div>

                {cguError && <ErrorAlert message="Erreur" details={cguError} onDismiss={() => setCguError(null)} />}
                {cguSuccess && (
                  <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    Nouvelle version publiée avec succès. Les utilisateurs seront notifiés.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cguLoading}
                  className="self-start px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-40"
                >
                  {cguLoading ? 'Publication…' : 'Publier la version'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Zone danger */}
        <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <TrashIcon className="w-5 h-5 text-red-500" />
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-red-700">Zone dangereuse</h2>
          </div>
          <p className="text-sm text-[#6B7280] mb-4">
            La suppression de votre compte est irréversible. Vos données seront anonymisées conformément au RGPD si vous avez des prêts enregistrés.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Confirmer la suppression
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-[#374151] text-sm hover:bg-[#F9FAFB] transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
