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
import { useAuth } from '../hooks/useAuth'
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

// ── Mock data bibliothèque ────────────────────────────────
const mockRetards: RetardRow[] = [
  { id: 1, adherent: 'Martin Sophie',     livre: 'Le Petit Prince',          exemplaire: 'EX-042', dateRetourPrevue: '2026-03-25', joursRetard: 13 },
  { id: 2, adherent: 'Dupont Marc',       livre: "L'Étranger",               exemplaire: 'EX-011', dateRetourPrevue: '2026-03-28', joursRetard: 10 },
  { id: 3, adherent: 'Bernard Léa',       livre: 'Les Misérables T.1',       exemplaire: 'EX-078', dateRetourPrevue: '2026-04-01', joursRetard: 6  },
  { id: 4, adherent: 'Thomas Jean-Paul',  livre: 'Le Comte de Monte-Cristo',  exemplaire: 'EX-103', dateRetourPrevue: '2026-04-03', joursRetard: 4  },
  { id: 5, adherent: 'Robert Claire',     livre: 'Madame Bovary',            exemplaire: 'EX-056', dateRetourPrevue: '2026-04-04', joursRetard: 3  },
]

const mockDerniersPrets: PretRow[] = [
  { id: 10, adherent: 'Leclerc Emma',   livre: '1984',                    datePret: '2026-04-06', dateRetourPrevue: '2026-04-20', statut: 'en_cours'  },
  { id: 11, adherent: 'Moreau Antoine', livre: 'Dune',                    datePret: '2026-04-05', dateRetourPrevue: '2026-04-19', statut: 'en_cours'  },
  { id: 12, adherent: 'Simon Julie',    livre: 'Harry Potter T.1',        datePret: '2026-04-04', dateRetourPrevue: '2026-04-18', statut: 'en_cours'  },
  { id: 13, adherent: 'Laurent Paul',   livre: 'Le Seigneur des Anneaux', datePret: '2026-04-02', dateRetourPrevue: '2026-04-16', statut: 'rendu'     },
  { id: 14, adherent: 'Garcia Nina',    livre: 'Fondation',               datePret: '2026-04-01', dateRetourPrevue: '2026-04-15', statut: 'rendu'     },
  { id: 15, adherent: 'Petit Maxime',   livre: "L'Alchimiste",            datePret: '2026-03-30', dateRetourPrevue: '2026-04-13', statut: 'en_retard' },
]

// ── Mock data adhérent (prêts personnels) ─────────────────
interface MonPretRow { id: number; livre: string; auteur: string; exemplaire: string; datePret: string; dateRetourPrevue: string; statut: Pret['statut'] }

const mockMesPrets: MonPretRow[] = [
  { id: 1, livre: 'Dune',           auteur: 'Frank Herbert',  exemplaire: 'EX-056', datePret: '2026-04-05', dateRetourPrevue: '2026-04-19', statut: 'en_cours'  },
  { id: 2, livre: '1984',           auteur: 'George Orwell',  exemplaire: 'EX-091', datePret: '2026-03-20', dateRetourPrevue: '2026-04-03', statut: 'en_retard' },
  { id: 3, livre: 'Fondation',      auteur: 'Isaac Asimov',   exemplaire: 'EX-014', datePret: '2026-02-10', dateRetourPrevue: '2026-02-24', statut: 'rendu'     },
  { id: 4, livre: 'Le Petit Prince',auteur: 'Saint-Exupéry',  exemplaire: 'EX-007', datePret: '2026-01-15', dateRetourPrevue: '2026-01-29', statut: 'rendu'     },
]

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

const statutLabel: Record<Pret['statut'], { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  en_cours:  { label: 'En cours',  variant: 'info'    },
  rendu:     { label: 'Rendu',     variant: 'success' },
  en_retard: { label: 'En retard', variant: 'danger'  },
}

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

  const mesPretsenCours  = mockMesPrets.filter(p => p.statut === 'en_cours').length
  const mesPretsenRetard = mockMesPrets.filter(p => p.statut === 'en_retard').length
  const mesPretsRendus   = mockMesPrets.filter(p => p.statut === 'rendu').length

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
              <DataTable
                columns={colsMesPrets}
                data={mockMesPrets}
                selectedId={selectedPret}
                onRowClick={r => setSelectedPret(r.id === selectedPret ? null : r.id)}
                emptyMessage="Vous n'avez aucun emprunt en cours."
              />
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
              <StatCard icon={ArrowsRightLeftIcon}     label="Prêts en cours"      value={47}  trend={{ value: 12, positive: true  }} color="blue"   index={0} />
              <StatCard icon={ExclamationTriangleIcon} label="Prêts en retard"      value={8}   trend={{ value: 3,  positive: false }} color="red"    index={1} />
              <StatCard icon={BookOpenIcon}            label="Exemplaires dispo."   value={234} trend={{ value: 5,  positive: false }} color="green"  index={2} />
              <StatCard icon={UserGroupIcon}           label="Adhérents actifs"     value={156} trend={{ value: 8,  positive: true  }} color="orange" index={3} />
            </div>

            {/* Tables */}
            <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-0">

              <div className="flex flex-col w-full md:w-[55%] gap-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-red-500" />
                  <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">Prêts en retard</h2>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">{mockRetards.length}</span>
                </div>
                <DataTable
                  columns={colsRetards}
                  data={mockRetards}
                  selectedId={selectedRetard}
                  onRowClick={r => setSelectedRetard(r.id === selectedRetard ? null : r.id)}
                />
              </div>

              <div className="flex flex-col flex-1 gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-[#1E3A8A]" />
                  <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[#374151]">Derniers prêts enregistrés</h2>
                </div>
                <DataTable
                  columns={colsDerniers}
                  data={mockDerniersPrets}
                  selectedId={selectedDernier}
                  onRowClick={r => setSelectedDernier(r.id === selectedDernier ? null : r.id)}
                />
              </div>

            </div>
          </>
        )}

      </div>
    </PageLayout>
  )
}
