import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message?: string | null
}

/**
 * Renders an error banner for server-action forms that redirect back with
 * `?error=...`. Renders nothing when there is no message.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
