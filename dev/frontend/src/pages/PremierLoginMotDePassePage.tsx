import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockClosedIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import api from '../services/api'

const REQUIREMENTS = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre',          test: (p: string) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

export function PremierLoginMotDePassePage() {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const { manualRefresh }             = useAuth()
  const navigate                      = useNavigate()

  const allValid  = REQUIREMENTS.every(r => r.test(password))
  const confirmed = password === confirm && confirm.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allValid || !confirmed) return

    setLoading(true)
    setError(null)
    try {
      await api.post('/api/utilisateurs/me/change-password', { password })
      await manualRefresh()
      navigate('/premier-login/cgu', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <LockClosedIcon className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-[#111827]">
              Définir votre mot de passe
            </h1>
            <p className="text-xs text-[#6B7280]">Première connexion — action obligatoire</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
              placeholder="••••••••"
            />
          </div>

          {/* Indicateurs de force */}
          <div className="bg-[#F9FAFB] rounded-lg p-3 flex flex-col gap-1.5">
            {REQUIREMENTS.map(req => (
              <div key={req.label} className="flex items-center gap-2 text-xs">
                {req.test(password)
                  ? <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircleIcon    className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />}
                <span className={req.test(password) ? 'text-green-700' : 'text-[#6B7280]'}>{req.label}</span>
              </div>
            ))}
            {confirm.length > 0 && (
              <div className="flex items-center gap-2 text-xs border-t border-[#E5E7EB] pt-1.5 mt-0.5">
                {confirmed
                  ? <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircleIcon    className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <span className={confirmed ? 'text-green-700' : 'text-red-600'}>Les mots de passe correspondent</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={!allValid || !confirmed || loading}
            className="w-full py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement…' : 'Valider et continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}
