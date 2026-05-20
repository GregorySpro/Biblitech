import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  BookOpenIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  BuildingLibraryIcon,
  PowerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  BookOpenIcon as BookSolid,
  UserGroupIcon as UsersSolid,
  ArrowsRightLeftIcon as ArrowsSolid,
  BuildingLibraryIcon as BuildingSolid,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'
import type { ComponentType } from 'react'
import type { UserRole } from '../types'

const roleLabelMap: Record<string, string> = {
  super_admin:    'Super Admin',
  admin:          'Admin',
  bibliothecaire: 'Bibliothécaire',
  adherent:       'Adhérent',
}

// Mock : en prod, viendra d'un appel GET /api/bibliotheques/{id} ou du contexte global
const mockBibliotheques: Record<number, string> = {
  1: 'Médiathèque Centrale',
  2: 'Bibliothèque du Nord',
  3: 'Bibliothèque Universitaire',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navItems: { to: string; label: string; Icon: ComponentType<any>; IconActive: ComponentType<any>; roles: UserRole[] | null }[] = [
  { to: '/dashboard',  label: 'Tableau de bord', Icon: HomeIcon,               IconActive: HomeSolid,   roles: null },
  { to: '/catalogue',  label: 'Catalogue',        Icon: BookOpenIcon,           IconActive: BookSolid,   roles: null },
  { to: '/adherents',  label: 'Adhérents',        Icon: UserGroupIcon,          IconActive: UsersSolid,  roles: ['super_admin', 'admin'] },
  { to: '/prets',      label: 'Prêts / Retours',  Icon: ArrowsRightLeftIcon,    IconActive: ArrowsSolid, roles: null },
  { to: '/demandes-migration', label: 'Migrations', Icon: BuildingLibraryIcon, IconActive: BuildingSolid, roles: null },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobileDrawer?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, isMobileDrawer, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleNavItems = navItems.filter(
    item => !item.roles || (user?.role && item.roles.includes(user.role))
  )

  const biblioNom = user?.bibliotheque_id
    ? (mockBibliotheques[user.bibliotheque_id] ?? `Bibliothèque #${user.bibliotheque_id}`)
    : null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // En mode drawer mobile la largeur est toujours pleine (220px), pas de collapse
  const effectiveCollapsed = isMobileDrawer ? false : collapsed

  return (
    <motion.aside
      initial={isMobileDrawer ? { x: -240 } : { x: -240 }}
      animate={{ x: 0, width: isMobileDrawer ? 260 : (effectiveCollapsed ? 64 : 220) }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full bg-[#1E3A8A] flex flex-col py-5 flex-shrink-0 relative"
      style={{ boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}
    >
      {/* ── Bouton toggle (desktop only) ── */}
      {!isMobileDrawer && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[72px] z-20 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-[#1E3A8A] hover:bg-blue-50 transition-colors cursor-pointer"
          aria-label={effectiveCollapsed ? 'Déplier la sidebar' : 'Replier la sidebar'}
        >
          {effectiveCollapsed
            ? <ChevronRightIcon className="w-3.5 h-3.5" />
            : <ChevronLeftIcon  className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* ── Bouton fermer (mobile drawer only) ── */}
      {isMobileDrawer && (
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-4 z-20 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          aria-label="Fermer le menu"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}

      {/* ── Logo + nom bibliothèque ── */}
      <div className={clsx('mb-6 transition-all duration-200', effectiveCollapsed ? 'px-3' : 'px-5')}>
        <div className={clsx('flex items-center mb-3', effectiveCollapsed ? 'justify-center' : 'gap-2.5', isMobileDrawer && 'pr-10')}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <BuildingLibraryIcon className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                style={{ fontFamily: 'var(--font-display)', overflow: 'hidden', whiteSpace: 'nowrap' }}
                className="font-bold text-white text-lg leading-tight"
              >
                BiblioTech
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Bandeau bibliothèque */}
        <AnimatePresence>
          {!effectiveCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15">
                <BuildingLibraryIcon className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/60 leading-none mb-0.5">
                    Bibliothèque
                  </p>
                  <p className="text-white text-xs font-semibold truncate leading-tight" title={biblioNom ?? ''}>
                    {biblioNom ?? 'Toutes les bibliothèques'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icône seule quand collapsed */}
        {effectiveCollapsed && (
          <div className="flex justify-center" title={biblioNom ?? 'Toutes les bibliothèques'}>
            <BuildingLibraryIcon className="w-4 h-4 text-[#60A5FA]" />
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className={clsx('flex-1 space-y-0.5', effectiveCollapsed ? 'px-2' : 'px-3')}>
        {visibleNavItems.map(({ to, label, Icon, IconActive }) => (
          <NavLink
            key={to}
            to={to}
            title={effectiveCollapsed ? label : undefined}
            onClick={() => onMobileClose?.()}
            className={({ isActive }) =>
              clsx(
                'relative flex items-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                effectiveCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200/80 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#60A5FA] rounded-r-full"
                  />
                )}
                {isActive
                  ? <IconActive style={{ width: 18, height: 18 }} className="text-[#60A5FA] flex-shrink-0" />
                  : <Icon style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                }
                <AnimatePresence>
                  {!effectiveCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Séparateur ── */}
      <div className={clsx('my-3 h-px bg-white/10', effectiveCollapsed ? 'mx-3' : 'mx-5')} />

      {/* ── Utilisateur + Déconnexion ── */}
      <div className={clsx('pb-2', effectiveCollapsed ? 'px-2' : 'px-4')}>
        <AnimatePresence>
          {!effectiveCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden mb-3 px-1"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/60 mb-1">Connecté</p>
              <p className="text-white text-sm font-medium truncate">{user?.email ?? '—'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/15 text-blue-100 text-[11px] font-medium">
                {roleLabelMap[user?.role ?? ''] ?? user?.role}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => { onMobileClose?.(); handleLogout() }}
          title={effectiveCollapsed ? 'Déconnexion' : undefined}
          className={clsx(
            'flex items-center w-full py-2 rounded-xl text-sm font-medium text-red-300/80 hover:bg-red-500/15 hover:text-red-200 transition-all duration-200',
            effectiveCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
          )}
        >
          <PowerIcon className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
