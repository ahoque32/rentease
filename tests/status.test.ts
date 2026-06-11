import { describe, expect, it } from 'vitest'
import { statusClasses, statusLabel } from '@/lib/status'

describe('statusLabel', () => {
  it('humanizes snake_case statuses', () => {
    expect(statusLabel('in_progress')).toBe('In Progress')
    expect(statusLabel('pending_signatures')).toBe('Pending Signatures')
    expect(statusLabel('new')).toBe('New')
  })

  it('handles missing values', () => {
    expect(statusLabel(null)).toBe('Unknown')
    expect(statusLabel(undefined)).toBe('Unknown')
  })
})

describe('statusClasses', () => {
  it('returns distinct classes for known statuses', () => {
    expect(statusClasses('maintenance', 'new')).toContain('blue')
    expect(statusClasses('maintenance', 'completed')).toContain('green')
    expect(statusClasses('urgency', 'emergency')).toContain('red')
    expect(statusClasses('lease', 'active')).toContain('green')
    expect(statusClasses('payment', 'failed')).toContain('red')
    expect(statusClasses('rent', 'overdue')).toContain('red')
  })

  it('falls back to gray for unknown or missing values', () => {
    expect(statusClasses('maintenance', 'bogus')).toContain('gray')
    expect(statusClasses('lease', null)).toContain('gray')
  })
})
