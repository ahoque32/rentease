/**
 * Single source of truth for status labels and badge styling. Pages previously
 * defined their own drifting copies of these maps.
 */

export type StatusKind =
  | 'maintenance'
  | 'urgency'
  | 'lease'
  | 'payment'
  | 'rent'
  | 'screening'
  | 'unit'

const STATUS_CLASSES: Record<StatusKind, Record<string, string>> = {
  maintenance: {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-700',
  },
  urgency: {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    emergency: 'bg-red-100 text-red-800',
  },
  lease: {
    draft: 'bg-gray-100 text-gray-700',
    pending_signatures: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    expiring: 'bg-orange-100 text-orange-800',
    expired: 'bg-red-100 text-red-800',
    terminated: 'bg-gray-100 text-gray-700',
  },
  payment: {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-700',
  },
  rent: {
    upcoming: 'bg-gray-100 text-gray-700',
    due: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800',
  },
  screening: {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  },
  unit: {
    vacant: 'bg-yellow-100 text-yellow-800',
    occupied: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800',
  },
}

const STATUS_LABELS: Partial<Record<string, string>> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending_signatures: 'Pending Signatures',
  under_review: 'Under Review',
}

const FALLBACK_CLASSES = 'bg-gray-100 text-gray-700'

export function statusClasses(kind: StatusKind, value: string | null | undefined): string {
  if (!value) return FALLBACK_CLASSES
  return STATUS_CLASSES[kind][value] ?? FALLBACK_CLASSES
}

/** "in_progress" -> "In Progress" */
export function statusLabel(value: string | null | undefined): string {
  if (!value) return 'Unknown'
  return (
    STATUS_LABELS[value] ??
    value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}
