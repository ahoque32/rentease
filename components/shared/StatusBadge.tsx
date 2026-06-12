import { cn } from '@/lib/utils'
import { statusClasses, statusLabel, type StatusKind } from '@/lib/status'

interface StatusBadgeProps {
  kind: StatusKind
  value: string | null | undefined
  className?: string
}

/** Consistent status pill used across landlord and tenant pages. */
export function StatusBadge({ kind, value, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md',
        statusClasses(kind, value),
        className
      )}
    >
      {statusLabel(value)}
    </span>
  )
}
