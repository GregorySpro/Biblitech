import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

export function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<{ token: string; refresh_token: string }>('/api/login', { email, password })
      login(data.token, data.refresh_token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 401) setError('Email ou mot de passe incorrect.')
      else if (status === 403) setError('Votre compte a été désactivé. Contactez votre administrateur.')
      else if (status === 429) setError('Trop de tentatives infructueuses. Votre compte est temporairement verrouillé. Réessayez dans quelques minutes.')
      else setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E3A8A] relative overflow-hidden">

      {/* Décorations background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#60A5FA]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#60A5FA]/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md px-4"
      >
        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* En-tête colorée */}
          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] px-8 pt-8 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BuildingLibraryIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-xl text-white">
                  BiblioTech
                </h1>
                <p className="text-blue-200/70 text-xs mt-0.5">Système de gestion de bibliothèque</p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="px-8 py-7">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-lg text-[#1F2937] mb-5">
              Connexion
            </h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword
                      ? <EyeSlashIcon className="w-4 h-4" />
                      : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Message d'erreur */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                      <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bouton */}
              <motion.button
                type="submit"
                disabled={loading || !email || !password}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 mt-1 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] active:bg-[#1e3a8a] text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30 hover:shadow-md hover:shadow-[#1E3A8A]/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion en cours…
                  </span>
                ) : 'Se connecter'}
              </motion.button>
            </form>
          </div>
        </div>

        <p className="text-center text-blue-200/40 text-xs mt-5">
          BiblioTech © 2026 — Grégory Sergent
        </p>
      </motion.div>
    </div>
  )
}
