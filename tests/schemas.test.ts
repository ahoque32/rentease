import { describe, expect, it } from 'vitest'
import {
  commentSchema,
  insurancePolicySchema,
  leaseSchema,
  maintenanceRequestSchema,
  signatureSchema,
} from '@/lib/validation/schemas'

const UUID = '0b9fbc3e-7c1a-4f3e-9af0-1d2c3b4a5e6f'

describe('insurancePolicySchema', () => {
  it('accepts a minimal valid policy and applies defaults', () => {
    const result = insurancePolicySchema.parse({
      property_id: UUID,
      type: 'liability',
      provider_name: 'Acme Insurance',
    })
    expect(result.premium_frequency).toBe('annual')
    expect(result.coverage_amount).toBeNull()
    expect(result.notes).toBeNull()
  })

  it('coerces numeric strings from form inputs', () => {
    const result = insurancePolicySchema.parse({
      property_id: UUID,
      type: 'flood',
      provider_name: 'Acme',
      coverage_amount: '250000',
    })
    expect(result.coverage_amount).toBe(250000)
  })

  it('rejects unknown types and bad ids', () => {
    expect(() =>
      insurancePolicySchema.parse({ property_id: 'nope', type: 'liability', provider_name: 'A' })
    ).toThrow()
    expect(() =>
      insurancePolicySchema.parse({ property_id: UUID, type: 'umbrella', provider_name: 'A' })
    ).toThrow()
  })
})

describe('leaseSchema', () => {
  const base = {
    unit_id: UUID,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    monthly_rent: '1500',
  }

  it('parses a valid lease and applies defaults', () => {
    const result = leaseSchema.parse(base)
    expect(result.monthly_rent).toBe(1500)
    expect(result.grace_period_days).toBe(5)
    expect(result.rent_due_day).toBe(1)
    expect(result.late_fee_amount).toBe(0)
  })

  it('rejects an end date before the start date', () => {
    expect(() =>
      leaseSchema.parse({ ...base, start_date: '2026-12-31', end_date: '2026-01-01' })
    ).toThrow(/End date/)
  })

  it('rejects non-positive rent and out-of-range due days', () => {
    expect(() => leaseSchema.parse({ ...base, monthly_rent: 0 })).toThrow()
    expect(() => leaseSchema.parse({ ...base, rent_due_day: 31 })).toThrow()
  })
})

describe('maintenanceRequestSchema', () => {
  it('accepts tenant complaint categories added in migration 007', () => {
    const result = maintenanceRequestSchema.parse({
      unit_id: UUID,
      title: 'Loud neighbors',
      category: 'noise',
      urgency: 'low',
    })
    expect(result.tenant_id).toBeNull()
  })

  it('rejects empty titles and unknown urgency', () => {
    expect(() =>
      maintenanceRequestSchema.parse({ unit_id: UUID, title: '  ', category: 'other', urgency: 'low' })
    ).toThrow()
    expect(() =>
      maintenanceRequestSchema.parse({ unit_id: UUID, title: 'x', category: 'other', urgency: 'asap' })
    ).toThrow()
  })
})

describe('commentSchema / signatureSchema', () => {
  it('trims and rejects empty bodies', () => {
    expect(commentSchema.parse({ body: '  hi  ' }).body).toBe('hi')
    expect(() => commentSchema.parse({ body: '   ' })).toThrow()
  })

  it('requires a signer name', () => {
    expect(signatureSchema.parse({ signer_name: 'Jane Doe' }).signer_name).toBe('Jane Doe')
    expect(() => signatureSchema.parse({ signer_name: '' })).toThrow()
  })
})
