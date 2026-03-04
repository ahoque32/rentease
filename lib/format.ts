const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface FormatDateOptions {
  includeTime?: boolean
}

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0)
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function formatDate(value?: string | null, options?: FormatDateOptions): string {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  if (options?.includeTime) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
