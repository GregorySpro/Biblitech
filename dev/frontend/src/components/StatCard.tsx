import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { ComponentType, SVGProps } from 'react'

type StatColor = 'blue' | 'green' | 'orange' | 'red'

interface StatCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: number | string
  trend?: { value: number; positive: boolean }
  color?: StatColor
  index?: number
}

const colorMap: Record<StatColor, { iconBg: string; iconColor: string; accent: string }> = {
  blue:   { iconBg: 'bg-blue-100',   iconColor: 'text-[#1E3A8A]',  accent: 'border-t-[#1E3A8A]' },
  green:  { iconBg: 'bg-green-100',  iconColor: 'text-[#16A34A]',  accent: 'border-t-[#16A34A]' },
  orange: { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', accent: 'border-t-orange-500' },
  red:    { iconBg: 'bg-red-100',    iconColor: 'text-red-600',    accent: 'border-t-red-500' },
}

export function StatCard({ icon: Icon, label, value, trend, color = 'blue', index = 0 }: StatCardProps) {
  const c = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      whileHover={{ y: -3, boxShadow: '0 10px 28px rgba(0,0,0,0.10)' }}
      className={clsx(
        'bg-white rounded-2xl p-5 flex items-center gap-4 border border-[#E5E7EB] border-t-4 shadow-sm',
        c.accent
      )}
    >
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.iconBg)}>
        <Icon className={clsx('w-6 h-6', c.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-bold text-[#111827] leading-none">{value}</p>
        <p className="text-sm text-[#6B7280] mt-1 truncate">{label}</p>
        {trend && (
          <p className={clsx('text-xs font-medium mt-1', trend.positive ? 'text-green-600' : 'text-red-500')}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% ce mois
          </p>
        )}
      </div>
    </motion.div>
  )
}
