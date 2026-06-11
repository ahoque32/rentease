# RentEase Improvement Plan

## Current State of the App

RentEase is a property-management SaaS for small landlords built on Next.js 14 (App
Router), Supabase (Postgres + Auth), Stripe Connect, Resend, and a GHL (GoHighLevel)
integration. It has two user surfaces:

- **Landlord app** (`app/(landlord)`) — dashboard, properties/units, tenants, leases
  (with e-signatures), payments/rent roll, maintenance with comment threads,
  insurance/taxes, tenant screening surveys, settings with Stripe Connect onboarding,
  and an AI query assistant.
- **Tenant portal** (`app/(tenant)`) — dashboard, rent payment via Stripe Checkout,
  payment history/receipts, lease view + signing, maintenance requests with comments,
  and a public screening-application form.

The UI recently received a "liquid glass" design pass and is visually consistent on the
main pages. The database has 20+ tables across 7 migrations, with RLS policies for the
core tables in migration 002.

## Major Issues Identified

### Critical security issues

1. **`execute_readonly_query` RPC is a cross-tenant data leak.** It is
   `SECURITY DEFINER`, executes arbitrary `SELECT` SQL, and never uses its
   `p_landlord_id` parameter. Any authenticated user can read *every* landlord's data
   (and most of the database) by calling the RPC directly or by prompting the AI chat.
2. **No RLS on tables added after migration 002.** `signatures`,
   `screening_surveys`, `screening_responses`, and `complaint_comments` have no RLS at
   all — readable/writable by any authenticated user through the Supabase API.
3. **IDOR on `GET /api/leases/[id]/signatures`** — returns signatures for any lease ID
   with no ownership check (compounded by missing RLS on `signatures`).
4. **Secrets committed in `.env.example`** — a real-looking GHL API key and location ID.
5. **GHL webhook accepts unauthenticated POSTs** (currently log-only, but a footgun).

### High-priority issues

6. **DB error messages leak to clients** in many API routes (`error.message` from
   Postgres returned verbatim).
7. **No input validation layer** — routes hand-roll `if (!body.x)` checks; `zod` is a
   dependency but unused in API routes.
8. **Admin (service-role) client used for routine user-scoped mutations** across most
   API routes and server actions, bypassing RLS unnecessarily.
9. **No error boundaries anywhere** — no `error.tsx`, `not-found.tsx`, or
   `global-error.tsx`; a thrown error yields the default unstyled crash page.
10. **Missing loading states** for all detail pages and the entire tenant portal.

### Code-quality issues

11. Status/urgency badge color maps are duplicated in 6+ files with drifting values.
12. Empty-state and stat-card markup duplicated across list/detail pages.
13. Settings page uses raw `<input>` elements instead of the `Input` component, and
    its profile form gives no success/error feedback.
14. Form server actions redirect with `?error=` query params that several pages never
    display.
15. No tests of any kind; no test runner configured.

## Improvements by Area

### Security & reliability
- Migration `008_security_hardening.sql`:
  - Rewrite `execute_readonly_query` as `SECURITY INVOKER` with `search_path` pinned,
    a statement timeout, single-statement enforcement, and system-catalog blocking —
    so the caller's own RLS policies scope every AI query.
  - Enable RLS + policies for `signatures`, `screening_surveys`, `screening_responses`,
    and `complaint_comments` (landlord ownership chains + tenant access where
    appropriate; public read of *active* surveys for the application flow).
  - Add missing indexes: `tenants(auth_user_id)`, `notifications(landlord_id, created_at)`,
    partial index on `payments(stripe_payment_intent_id)`, `complaint_comments` author.
- Add ownership verification to `GET /api/leases/[id]/signatures`.
- Introduce `lib/api/respond.ts` (uniform JSON error helper that logs server-side and
  returns sanitized messages) and `lib/validation/schemas.ts` (zod schemas), and apply
  them to the insurance, lease, maintenance, comment, and signature routes.
- Require a shared secret on the GHL webhook when `GHL_WEBHOOK_SECRET` is configured.
- Scrub real credentials from `.env.example`.

### UI / UX
- Add `app/error.tsx`, `app/not-found.tsx`, and `app/global-error.tsx` styled to match
  the design system, plus segment error boundaries for the landlord and tenant areas.
- Add `loading.tsx` skeletons for landlord detail routes (properties, leases, tenants,
  maintenance, insurance) and tenant portal routes.
- Rebuild the Settings profile form with `Input`/`Label` components and a visible
  success/error banner; stop using the admin client for the profile update.
- Display `?error=` feedback on the new-property / new-tenant / edit forms that
  currently swallow it (shared `FormError` component).

### Functionality
- AI query route: harden SQL guardrails (single statement, no comments, no
  catalog access) to defense-in-depth alongside the RPC fix.
- Signature flow: keep lease activation logic but make the GET endpoint safe.

### Database / schema
- Covered by migration 008 above (RLS, indexes). Existing schema is otherwise sound —
  FKs, CHECK constraints, and `updated_at` triggers are in place.

### Code quality & architecture
- `lib/status.ts` — single source of truth for status/urgency/payment badge styling and
  labels; refactor the maintenance, lease, and payment pages to use it.
- `components/shared/EmptyState.tsx` and `components/shared/StatCard.tsx` — replace
  duplicated markup in list/detail pages.
- `components/shared/FormError.tsx` — render `searchParams.error` consistently.

### Testing
- Add Vitest (`npm test`) with unit tests for `lib/format.ts`, `lib/status.ts`, and the
  new zod schemas in `lib/validation/schemas.ts`.

## Implementation Order

1. **Security migration + RPC fix** (008 migration, AI route guardrails).
2. **API hardening** — error helper, zod schemas, signatures GET ownership check,
   GHL webhook secret, `.env.example` scrub.
3. **Shared utilities/components** — `lib/status.ts`, `EmptyState`, `StatCard`,
   `FormError`; refactor pages to use them.
4. **UX layer** — error/not-found boundaries, loading skeletons, settings form rebuild,
   form error display.
5. **Tests + verification** — Vitest setup, unit tests, `npm run lint`,
   `npm run build` green.

Non-goals for this pass: replacing the GHL/Zillow integrations, redesigning the visual
language (recent glass UI is kept), or rewriting working flows.

## Implementation Status

All phases above are implemented in this branch:

- ✅ `supabase/migrations/008_security_hardening.sql` — RPC rewritten as
  `SECURITY INVOKER` with hardened guards; RLS enabled with policies for `signatures`,
  `screening_surveys`, `screening_responses`, `complaint_comments`; working
  `auth_user_id`-based tenant policies added for leases/payments/rent
  schedule/maintenance/lease_tenants; missing indexes added.
- ✅ `lib/api/respond.ts` + `lib/validation/schemas.ts`; zod validation and ownership
  checks on the insurance/lease/maintenance/signature POST routes (the lease and
  maintenance routes previously accepted other landlords' unit IDs); sanitized error
  responses across all 20+ API routes; GET signatures IDOR fixed; lease activation made
  idempotent; GHL webhook now requires `GHL_WEBHOOK_SECRET`; `.env.example` credentials
  scrubbed (⚠️ the previously committed GHL API key should be rotated — it remains in
  git history).
- ✅ `lib/status.ts`, `StatusBadge`, `EmptyState`, `StatCard`, `FormError`,
  `SegmentError` shared components; 13 pages refactored off duplicated local maps.
- ✅ `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`, segment error
  boundaries for landlord/tenant areas, tenant portal `loading.tsx`; settings profile
  form rebuilt (proper inputs, success/error feedback, no admin client); form error
  banners on new/edit property and tenant pages; property/tenant edit actions moved to
  RLS-scoped client.
- ✅ Vitest (`npm test`) with 20 unit tests covering `lib/format`, `lib/status`, and the
  validation schemas; `npm run lint` and `npm run build` pass.

Note: `execute_readonly_query` is now `SECURITY INVOKER`, so AI queries see exactly what
the signed-in landlord's RLS allows — apply migration 008 before relying on the AI chat.
