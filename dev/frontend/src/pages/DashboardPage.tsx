import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BookOpenIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { PageLayout } from '../components/PageLayout'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { useAuth } from '../hooks/useAuth'
import { useApiCall } from '../hooks/useApiCall'
import { pretService } from '../services/pretService'
import { statsService } from '../services/statsService'
import type { Column } from '../components/DataTable'
import type { Pret } from '../types'

// ── Types locaux ───────────────────────────────────────────
interface RetardRow {
  id: number
  adherent: string
  livre: string
  exemplaire: string
  dateRetourPrevue: string
  joursRetard: number
}

interface PretRow {
  id: number
  adherent: string
  livre: string
  datePret: string
  dateRetourPrevue: string
  statut: Pret['statut']
}

interface MonPretRow {
  id: number
  livre: string
  auteur: string
  exemplaire: string
  datePret: string
  dateRetourPrevue: string
  statut: Pret['statut']
}

const statutLabel: Record<Pret['statut'], { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  en_cours:  { label: 'En cours',  variant: 'info'    },
  rendu:     { label: 'Rendu',     variant: 'success' },
  en_retard: { label: 'En retard', variant: 'danger'  },
}

// ── Mapping Pret → lignes d'affichage ────────────────────
function mapPretToMonPretRow(p: Pret): MonPretRow {
  return {
    id:               p.id,
    livre:            p.exemplaire?.livre?.titre           ?? `Livre #${p.exemplaire_id}`,
    auteur:           p.exemplaire?.livre?.auteur          ?? '',
    exemplaire:       p.exemplaire?.code_exemplaire        ?? `EX-${p.exemplaire_id}`,
    datePret:         p.date_pret,
    dateRetourPrevue: p.date_retour_prevue,
    statut:           p.statut,
  }
}

function mapPretToRetardRow(p: Pret): RetardRow {
  const joursRetard = Math.max(
    0,
    Math.floor((Date.now() - new Date(p.date_retour_prevue).getTime()) / 86_400_000),
  )
  return {
    id:               p.id,
    adherent:         p.utilisateur
                        ? `${p.utilisateur.prenom} ${p.utilisateur.nom}`
                        : `Adhérent #${p.utilisateur_id}`,
    livre:            p.exemplaire?.livre?.titre    ?? `Livre #${p.exemplaire_id}`,
    exemplaire:       p.exemplaire?.code_exemplaire ?? `EX-${p.exemplaire_id}`,
    dateRetourPrevue: new Date(p.date_retour_prevue).toLocaleDateString('fr-FR'),
    joursRetard,
  }
}

function mapPretToPretRow(p: Pret): PretRow {
  return {
    id:               p.id,
    adherent:         p.utilisateur
                        ? `${p.utilisateur.prenom} ${p.utilisateur.nom}`
                        : `Adhérent #${p.utilisateur_id}`,
    livre:            p.exemplaire?.livre?.titre ?? `Livre #${p.exemplaire_id}`,
    datePret:         new Date(p.date_pret).toLocaleDateString('fr-FR'),
    dateRetourPrevue: new Date(p.date_retour_prevue).toLocaleDateString('fr-FR'),
    statut:           p.statut,
  }
}

// ── Colonnes ───────────────────────────────────────────────
const colsRetards: Column<RetardRow>[] = [
  { key: 'adherent',         header: 'Adhérent',     sortable: true },
  { key: 'livre',            header: 'Livre',        sortable: true },
  { key: 'exemplaire',       header: 'Exemplaire',   width: '100px', render: r => (
    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{r.exemplaire}</span>
  )},
  { key: 'dateRetourPrevue', header: 'Retour prévu', width: '120px', sortable: true },
  { key: 'joursRetard',      header: 'Retard',       width: '90px',  sortable: true, render: r => (
    <Badge label={`${r.joursRetard}j`} variant={r.joursRetard > 10 ? 'danger' : r.joursRetard > 5 ? 'warning' : 'neutral'} dot />
  )},
]

const colsDerniers: Column<PretRow>[] = [
  { key: 'adherent',         header: 'Adhérent',     sortable: true },
  { key: 'livre',            header: 'Livre',        sortable: true },
  { key: 'datePret',         header: 'Date prêt',    width: '110px', sortable: true },
  { key: 'dateRetourPrevue', header: 'Retour prévu', width: '110px' },
  { key: 'statut',           header: 'Statut',       width: '100px', render: r => {
    const { label, variant } = statutLabel[r.statut]
    return <Badge label={label} variant={variant} dot />
  }},
]

const colsMesPrets: Column<MonPretRow>[] = [
  { key: 'livre',            header: 'Livre',        sortable: true },
  { key: 'auteur',           header: 'Auteur',       sortable: true },
  { key: 'exemplaire',       header: 'Exemplaire',   width: '100px', render: r => (
    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{r.exemplaire}</span>
  )},
  { key: 'datePret',         header: 'Emprunté le',  width: '110px', sortable: true, render: r => new Date(r.datePret).toLocaleDateString('fr-FR') },
  { key: 'dateRetourPrevue', header: 'À rendre le',  width: '110px', render: r => (
    <span className={r.statut === 'en_retard' ? 'text-red-600 font-semibold' : ''}>
      {new Date(r.dateRetourPrevue).toLocaleDateString('fr-FR')}
    </span>
  )},
  { key: 'statut',           header: 'Statut',       width: '100px', render: r => {
    const { label, variant } = statutLabel[r.statut]
    return <Badge label={label} variant={variant} dot />
  }},
]

// ── Composant ──────────────────────────────────────────────
export function DashboardPage() {
  const [selectedRetard, setSelectedRetard]   = useState<number | null>(null)
  const [selectedDernier, setSelectedDernier] = useState<number | null>(null)
  const [selectedPret, setSelectedPret]       = useState<number | null>(null)
  const { user } = useAuth()

  const isAdherent = user?.role === 'adherent'
  const prenom = user?.email?.split('@')[0] ?? 'vous'

  // Fetch stats for staff, loans for members
  const { data: stats, loading: statsLoading, error: statsError } = useApiCall(
    () => statsService.getLibrary(),
    !isAdherent
  )

  // Fetch loans
  const { data: allPretsData, loading: pretsLoading, error: pretsError } = useApiCall(() => pretService.getAll())
  const allPrets = allPretsData ?? []

  // If member, filter to own loans
  const myPrets = isAdherent
    ? allPrets.filter(p => p.utilisateur_id === user?.sub)
    : []

  const mesPretsenCours  = myPrets.filter(p => p.statut === 'en_cours').length
  const mesPretsenRetard = myPrets.filter(p => p.statut === 'en_retard').length
  const mesPretsRendus   = myPrets.filter(p => p.statut === 'rendu').length

  // Mock data for staff tables (TODO: replace with real data transformation)
  const retards       = allPrets.filter(p => p.statut === 'en_retard').map(mapPretToRetardRow)
  const derniersPrets = [...allPrets]
    .sort((a, b) => new Date(b.date_pret).getTime() - new Date(a.date_pret).getTime())
    .slice(0, 10)
    .map(mapPretToPretRow)

  return (
    <PageLayout>
      <div className="flex flex-col flex-1 p-6 gap-5 overflow-hidden">

        {/* ── En-tête ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[#111827]">
            {isAdherent ? `Bonjour, ${prenom} 👋` : 'Tableau de bord'}
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {isAdherent
              ? 'Retrouvez ici vos prêts en cours et l\'historique de vos emprunts.'
              : `Vue d'ensemble — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          </p>
        </motion.div>

        {/* Affichage des erreurs */}
        {pretsError && (
          <ErrorAlert
            message="Erreur de chargement"
            details="Impossible de charger les prêts. Veuillez réessayer."
            onDismiss={() => {}}
          />
        )}
        {!isAdherent && statsError && (
          <ErrorAlert
            message="Erreur de chargement des statistiques"
            details="Impossible de charger les statistiques de la bibliothèque."
            onDismiss={() => {}}
          />
        )}

        {isAdherent ? (
          /* ════════════════════════════════════════════════
             VUE ADHÉRENT
          ════════════════════════════════════════════════ */
          <>
            {/* Stats personnelles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-shrink-0">
              <StatCard icon={ArrowsRightLeftIcon}    label="Prêts en cours"  value={mesPretsenCours}  color="blue"   index={0} />
              <StatCard icon={ExclamationTriangleIcon} label="En retard"       value={mesPretsenRetard} color="red"    index={1} />
              <StatCard icon={CheckCircleIcon}         label="Rendus (total)"  value={mesPretsRendus}   color="green"  index={2} />
            </div>

            {/* Mes prêts */}
            <div className="flex flex-col flex-1 min-h-0 gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <BookOpenIcon className="w-4 h-4 text-[#1E3A8A]" />
                <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">
                  Mes emprunts
                </h2>
              </div>
              {pretsLoading ? (
                <LoadingState message="Chargement de vos prêts..." />
              ) : (
                <DataTable
                  columns={colsMesPrets}
                  data={myPrets.map(mapPretToMonPretRow)}
                  selectedId={selectedPret}
                  onRowClick={r => setSelectedPret(r.id === selectedPret ? null : r.id)}
                  emptyMessage="Vous n'avez aucun emprunt en cours."
                />
              )}
            </div>

            {/* Raccourcis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
              <Link
                to="/catalogue"
                className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#1E3A8A]/30 hover:shadow-md transition-all duration-200 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827] text-sm">Explorer le catalogue</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Découvrez les livres disponibles</p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link
                to="/prets"
                className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#1E3A8A]/30 hover:shadow-md transition-all duration-200 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                  <CalendarDaysIcon className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: 'var(--font-display)' }} className="font-semibold text-[#111827] text-sm">Historique de mes prêts</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Consultez tous vos emprunts passés</p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </>
        ) : (
          /* ════════════════════════════════════════════════
             VUE STAFF (admin / bibliothécaire / super_admin)
          ════════════════════════════════════════════════ */
          <>
            {/* Cartes stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
              <StatCard icon={ArrowsRightLeftIcon}     label="Prêts en cours"      value={statsLoading ? '...' : stats?.pretsenCours ?? 0}  trend={{ value: 0, positive: true  }} color="blue"   index={0} />
              <StatCard icon={ExclamationTriangleIcon} label="Prêts en retard"      value={statsLoading ? '...' : stats?.pretsEnRetard ?? 0}   trend={{ value: 0, positive: false }} color="red"    index={1} />
              <StatCard icon={BookOpenIcon}            label="Exemplaires dispo."   value={statsLoading ? '...' : stats?.totalExemplaires ?? 0} trend={{ value: 0, positive: false }} color="green"  index={2} />
              <StatCard icon={UserGroupIcon}           label="Adhérents actifs"     value={statsLoading ? '...' : stats?.adherentsActifs ?? 0} trend={{ value: 0, positive: true  }} color="orange" index={3} />
            </div>

            {/* Tables */}
            <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-0">

              <div className="flex flex-col w-full md:w-[55%] gap-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-red-500" />
                  <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">Prêts en retard</h2>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">{retards.length}</span>
                </div>
                {pretsLoading ? (
                  <LoadingState message="Chargement des prêts..." />
                ) : (
                  <DataTable
                    columns={colsRetards}
                    data={retards}
                    selectedId={selectedRetard}
                    onRowClick={r => setSelectedRetard(r.id === selectedRetard ? null : r.id)}
                  />
                )}
              </div>

              <div className="flex flex-col flex-1 gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-[#1E3A8A]" />
                  <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">Derniers prêts enregistrés</h2>
                </div>
                {pretsLoading ? (
                  <LoadingState message="Chargement des prêts..." />
                ) : (
                  <DataTable
                    columns={colsDerniers}
                    data={derniersPrets}
                    selectedId={selectedDernier}
                    onRowClick={r => setSelectedDernier(r.id === selectedDernier ? null : r.id)}
                  />
                )}
              </div>

            </div>
          </>
        )}

      </div>
    </PageLayout>
  )
}
