# RentEase TODO

## Deferred Features (Post-MVP)

### Payment Processing
- [ ] Stripe Connect integration for landlord onboarding
- [ ] ACH payment flow (tenant → landlord)
- [ ] Card payment support
- [ ] Stripe webhook handler for payment events
- [ ] Automatic late fee application

### Notifications
- [ ] Email notifications via Resend
  - [ ] Rent reminders
  - [ ] Payment receipts
  - [ ] Lease expiry reminders
  - [ ] Insurance renewal reminders
  - [ ] Maintenance alerts
- [ ] SMS notifications via Twilio/GHL
  - [ ] Rent due reminders
  - [ ] Overdue rent alerts
  - [ ] Emergency maintenance alerts

### Tenant Screening
- [ ] TransUnion integration
- [ ] Credit score retrieval
- [ ] Background check workflow
- [ ] Screening report storage

### AI Features
- [ ] Natural language query engine
- [ ] AI-powered property insights
- [ ] Automated rent pricing suggestions

### Tenant Portal
- [ ] Magic link authentication
- [ ] Tenant dashboard
- [ ] Online rent payment
- [ ] Payment history view
- [ ] Maintenance request submission
- [ ] Lease document access

### Advanced Features
- [ ] Multi-user access (property managers)
- [ ] Basic P&L accounting
- [ ] Vacancy listing syndication
- [ ] Document templates (leases, notices)
- [ ] Bulk operations (rent increases, notices)

## Sprint 2 Status - COMPLETED ✅

### Database
- [x] Migration files created (001_initial_schema.sql, 002_rls_policies.sql)
- [ ] Run migrations against Supabase production (needs to be done via SQL Editor)

### Property CRUD ✅
- [x] Property list page
- [x] Property create page
- [x] Property detail page (full implementation with tabs)
- [x] Property edit functionality
- [x] Property archive functionality

### Unit CRUD ✅
- [x] Unit list (nested under property detail)
- [x] Unit create
- [x] Unit edit
- [x] Unit status management

### Tenant CRUD ✅
- [x] Tenant list page
- [x] Tenant create page
- [x] Tenant detail page
- [x] Tenant edit functionality
- [x] GHL contact sync on create/update

### Lease CRUD ✅
- [x] Lease list page
- [x] Lease create with tenant assignment
- [x] Lease detail page with rent schedule
- [ ] Lease PDF upload (placeholder exists)
- [x] Auto-generate rent schedule (via DB trigger)

### Property Systems ✅
- [x] Systems registry (HVAC, septic, roof, etc.)
- [x] Add systems per property
- [x] Edit systems

### Insurance ✅
- [x] Insurance policy CRUD
- [x] Add/edit per property
- [x] Renewal tracking display

### Property Taxes ✅
- [x] Tax tracking per property
- [x] Due date management
- [x] Payment status tracking

### Recurring Maintenance (Partial)
- [ ] Create recurring schedules (DB supports it)
- [ ] Mark tasks complete
- [ ] Auto-advance next_due dates (DB trigger exists)

### Payments ✅
- [x] Manual payment recording
- [x] Payment history view on tenant detail
- [x] Rent roll view on payments page

## Next Steps for Sprint 3
1. Run database migrations in Supabase SQL Editor
2. Set up Stripe Connect for payments
3. Implement email notifications via Resend
4. Build tenant portal with magic link auth
5. Add recurring maintenance UI
