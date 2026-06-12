import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate } from '@/lib/format'

describe('formatCurrency', () => {
  it('formats numbers as USD', () => {
    expect(formatCurrency(1500)).toBe('$1,500.00')
    expect(formatCurrency(0.5)).toBe('$0.50')
  })

  it('accepts numeric strings', () => {
    expect(formatCurrency('1234.56')).toBe('$1,234.56')
  })

  it('falls back to $0.00 for null, undefined, and garbage', () => {
    expect(formatCurrency(null)).toBe('$0.00')
    expect(formatCurrency(undefined)).toBe('$0.00')
    expect(formatCurrency('not a number')).toBe('$0.00')
    expect(formatCurrency(Infinity)).toBe('$0.00')
  })
})

describe('formatDate', () => {
  it('formats ISO dates', () => {
    expect(formatDate('2026-01-15T12:00:00Z')).toBe('Jan 15, 2026')
  })

  it('returns N/A for empty and invalid values', () => {
    expect(formatDate(null)).toBe('N/A')
    expect(formatDate('')).toBe('N/A')
    expect(formatDate('not-a-date')).toBe('N/A')
  })

  it('includes the time when requested', () => {
    const result = formatDate('2026-01-15T15:30:00Z', { includeTime: true })
    expect(result).toContain('Jan 15, 2026')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})
