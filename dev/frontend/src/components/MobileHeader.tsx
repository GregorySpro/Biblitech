import { Bars3Icon, BuildingLibraryIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuth()
  const initial = user?.email ? user.email[0].toUpperCase() : '?'

  return (
    <header
      className="fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 md:hidden"
      style={{ background: '#1E3A8A', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-white/15 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Logo + Titre */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <BuildingLibraryIcon className="w-4 h-4 text-white" />
        </div>
        <span
          style={{ fontFamily: 'var(--font-display)' }}
          className="font-bold text-white text-base leading-none"
        >
          BiblioTech
        </span>
      </div>

      {/* Avatar initiales */}
      <div className="w-9 h-9 rounded-full bg-[#60A5FA]/25 border border-[#60A5FA]/40 flex items-center justify-center">
        <span className="text-white text-sm font-bold">{initial}</span>
      </div>
    </header>
  )
}
