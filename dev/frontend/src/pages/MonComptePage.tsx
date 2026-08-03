import { useState } from 'react'
import { UserCircleIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { ErrorAlert } from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'
import { utilisateurService } from '../services/utilisateurService'

const REQUIREMENTS = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre',          test: (p: string) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

export function MonComptePage() {
  const { user, manualRefresh, logout } = useAuth()

  const [nom, setNom]       = useState(user?.email?.split('@')[0] ?? '')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail]   = useState(user?.email ?? '')

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const [profileError, setProfileError]   = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [pwdError, setPwdError]           = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess]       = useState(false)
  const [loading, setLoading]             = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
