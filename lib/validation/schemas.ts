import { z } from 'zod'

/**
 * Shared zod schemas for API route input validation. Enum values mirror the CHECK
 * constraints in supabase/migrations so invalid input fails fast with a readable
 * message instead of a raw Postgres error.
 */

const uuid = z.string().uuid('Invalid ID')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date')
const money = z.coerce.number().nonnegative().max(100_000_000)
const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))

export const insurancePolicySchema = z.object({
  property_id: uuid,
  type: z.enum(['disaster', 'repair', 'tax', 'home_warranty', 'liability', 'flood', 'other']),
  provider_name: z.string().trim().min(1, 'Provider name is required').max(255),
  policy_number: optionalText,
  coverage_amount: money.optional().nullable().default(null),
  premium_amount: money.optional().nullable().default(null),
  premium_frequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']).default('annual'),
  start_date: isoDate.optional().nullable().default(null),
  renewal_date: isoDate.optional().nullable().default(null),
  notes: optionalText,
})

export const leaseSchema = z
  .object({
    unit_id: uuid,
    tenant_id: uuid.optional().nullable().default(null),
    start_date: isoDate,
    end_date: isoDate,
    monthly_rent: z.coerce.number().positive('Monthly rent must be greater than zero').max(1_000_000),
    security_deposit: money.optional().nullable().default(null),
    late_fee_amount: money.default(0),
    grace_period_days: z.coerce.number().int().min(0).max(31).default(5),
    rent_due_day: z.coerce.number().int().min(1).max(28).default(1),
    notes: optionalText,
  })
  .refine((data) => data.end_date > data.start_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  })

export const maintenanceRequestSchema = z.object({
  unit_id: uuid,
  tenant_id: uuid.optional().nullable().default(null),
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: optionalText,
  category: z.enum([
    'plumbing',
    'electrical',
    'hvac',
    'appliance',
    'structural',
    'pest',
    'maintenance',
    'noise',
    'billing',
    'other',
  ]),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  notes: optionalText,
})

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
})

export const signatureSchema = z.object({
  signer_name: z.string().trim().min(1, 'Signer name is required').max(255),
})
