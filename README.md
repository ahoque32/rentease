# RentEase

A mobile-first property management SaaS for small landlords (1-20 units). Built with Next.js 14, Supabase, and Stripe Connect.

## Features

- **Property Management**: Track properties, units, and leases
- **Rent Collection**: Online ACH and card payments via Stripe Connect
- **Maintenance Requests**: Tenant portal for submitting and tracking repairs
- **Tenant Screening**: Integrated background checks (coming soon)
- **Insurance & Tax Tracking**: Manage policies and property taxes
- **Recurring Maintenance**: Automated reminders for HVAC, septic, etc.
- **Depreciation Tracking**: Calculate asset depreciation for taxes
- **AI-Powered Queries**: Natural language questions about your portfolio
- **GHL Integration**: Sync with GoHighLevel CRM for SMS workflows

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Payments**: Stripe Connect (ACH + Card)
- **Notifications**: Resend (email), GHL (SMS)
- **AI**: OpenAI GPT-4 for natural language queries
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- GHL account (optional, for SMS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ahoque32/rentease.git
cd rentease
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_ghl_location_id
RESEND_API_KEY=re_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run database migrations:
```bash
npx supabase db push
```

6. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses 18 tables:

- `landlords` - User profiles extending Supabase auth
- `properties` - Rental properties
- `units` - Individual units within properties
- `tenants` - Tenant information
- `leases` - Lease agreements
- `lease_tenants` - Many-to-many relationship
- `payments` - Payment records
- `rent_schedule` - Expected rent payments
- `maintenance_requests` - Maintenance tracking
- `maintenance_photos` - Photos for requests
- `insurance_policies` - Property insurance
- `property_taxes` - Tax records
- `property_systems` - HVAC, septic, roof, etc.
- `recurring_maintenance` - Scheduled maintenance
- `depreciation` - Asset depreciation tracking
- `capital_improvements` - Major improvements
- `screenings` - Tenant screening results
- `notifications` - Notification log
- `documents` - File storage

## Architecture

```
┌─────────────────────────────────────────┐
│           Vercel (Next.js)              │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ Landlord │  │  Tenant  │  │  API   │ │
│  │   App    │  │  Portal  │  │ Routes │ │
│  └─────────┘  └──────────┘  └────────┘ │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼───────┐    ┌───────▼────────┐
│   Supabase    │    │    Stripe      │
│  ┌──────────┐ │    │   Connect      │
│  │ Postgres │ │    │  (Payments)    │
│  │   Auth   │ │    └───────┬────────┘
│  │ Storage  │ │            │
│  │Edge Funcs│◄─────────────┘ (webhooks)
│  └──────────┘ │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
┌──▼──┐  ┌──▼───┐
│Resend│  │  GHL  │
│(Email)│ │ (SMS) │
└──────┘  └───────┘
```

## Development

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- Feature branches: `feature/description`
- Bug fixes: `fix/description`

### Commit Convention

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## Deployment

### Staging

1. Push to `develop` branch
2. Vercel automatically deploys to staging

### Production

1. Create PR from `develop` to `main`
2. Merge PR
3. Vercel automatically deploys to production

## Pricing

| Plan | Price | Units | Features |
|------|-------|-------|----------|
| Starter | $29/mo | 5 | ACH, basic maintenance, email |
| Standard | $59/mo | 15 | ACH + Card, SMS, 5GB storage |
| Pro | $99/mo | 30 | Everything + priority support |

## License

MIT License - See LICENSE file

## Support

For support, email support@rentease.app or open an issue on GitHub.
