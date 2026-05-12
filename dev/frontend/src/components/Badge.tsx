import clsx from 'clsx'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variants: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  danger:  'bg-red-100  text-red-700',
  info:    'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
}

export function Badge({ label, variant = 'neutral', dot = false }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant]
    )}>
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' ? 'bg-green-500' :
          variant === 'warning' ? 'bg-orange-500' :
          variant === 'danger'  ? 'bg-red-500' :
          variant === 'info'    ? 'bg-blue-500' :
          'bg-gray-400'
        )} />
      )}
      {label}
    </span>
  )
}
