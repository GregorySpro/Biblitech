import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T extends { id: number }> {
  columns: Column<T>[]
  data: T[]
  selectedId?: number | null
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  selectedId,
  onRowClick,
  emptyMessage = 'Aucun résultat',
  loading = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = (a as Record<string, unknown>)[sortKey]
    const bVal = (b as Record<string, unknown>)[sortKey]
    if (aVal == null || bVal == null) return 0
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-[#E5E7EB]">
        <div className="flex flex-col items-center gap-3 text-[#9CA3AF]">
          <svg className="animate-spin w-8 h-8 text-[#1E3A8A]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Chargement…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : {}}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wide whitespace-nowrap select-none',
                  col.sortable && 'cursor-pointer hover:text-[#1E3A8A] transition-colors'
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key
                    ? sortDir === 'asc'
                      ? <ChevronUpIcon className="w-3 h-3" />
                      : <ChevronDownIcon className="w-3 h-3" />
                    : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-[#9CA3AF] text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, delay: i * 0.025 }}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    'border-b border-[#F3F4F6] transition-colors duration-100',
                    onRowClick && 'cursor-pointer',
                    selectedId === row.id
                      ? 'bg-blue-50'
                      : 'hover:bg-[#F9FAFB]'
                  )}
                >
                  {columns.map(col => (
                    <td key={col.key} className={clsx(
                      'px-4 py-3 text-[#374151]',
                      selectedId === row.id && 'first:border-l-2 first:border-l-[#1E3A8A]'
                    )}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
