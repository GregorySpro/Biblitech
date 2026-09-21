import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { BibliothequeInactiveBanner } from './BibliothequeInactiveBanner'
import { useGlobalLoading } from '../context/GlobalLoadingContext'
import type { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isLoading } = useGlobalLoading()

  // Close drawer automatically on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleToggle = () => {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem('sidebar_collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:block sticky top-0 h-screen flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {/* ── Mobile header ── */}
      <MobileHeader onMenuClick={() => setMobileOpen(true)} />

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar
                collapsed={false}
                onToggle={() => {}}
                isMobileDrawer
                onMobileClose={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <motion.main
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex-1 flex flex-col min-h-screen overflow-hidden pt-14 md:pt-0"
      >
        <BibliothequeInactiveBanner />
        {children}
      </motion.main>

      {/* ── Global loading overlay ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="global-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-3">
              <svg
                className="animate-spin w-8 h-8 text-[#1E3A8A]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm font-medium text-[#374151]">Chargement…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

