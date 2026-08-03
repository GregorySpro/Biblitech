import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useCgu } from '../context/CguContext'
import { useAuth } from '../hooks/useAuth'
import { cguService } from '../services/cguService'

export function PremierLoginCguPage() {
  const { currentVersion, cguContenu, isLoading } = useCgu()
  const { manualRefresh }                          = useAuth()
  const [accepted, setAccepted]                    = useState(false)
  const [loading, setLoading]                      = useState(false)
  const [error, setError]                          = useState<string | null>(null)
  const navigate                                   = useNavigate()

  const handleAccept = async () => {
    if (!currentVersion) return
    setLoading(true)
    setError(null)
    try {
      await cguService.accept(currentVersion)
      await manualRefresh()
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>
        <div className="p-6 border-b border-[#E5E7EB] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-[#111827]">
                Conditions Générales d'Utilisation
              </h1>
              {currentVersion && (
                <p className="text-xs text-[#6B7280]">Version {currentVersion} — Acceptation obligatoire</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-[#6B7280]">
              Chargement des CGU…
            </div>
          ) : cguContenu ? (
            <div className="prose prose-sm max-w-none">
              {cguContenu.split('\n').map((line, i) => (
                <p key={i} className="text-sm text-[#374151] leading-relaxed mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Aucune condition générale disponible.</p>
          )}
        </div>

        <div className="p-6 border-t border-[#E5E7EB] bg-[#F9FAFB] flex-shrink-0">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#1E3A8A]"
            />
            <span className="text-sm text-[#374151]">
              J'ai lu et j'accepte les Conditions Générales d'Utilisation de BiblioTech (version {currentVersion ?? '…'}).
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
          )}

          <button
            onClick={handleAccept}
            disabled={!accepted || loading || !currentVersion}
            className="w-full py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            {loading ? 'Enregistrement…' : 'Accepter et accéder à l\'application'}
          </button>
        </div>
      </div>
    </div>
  )
}
