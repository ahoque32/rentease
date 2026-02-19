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

## Sprint 2 Status

### Database
- [x] Migration files created (001_initial_schema.sql, 002_rls_policies.sql)
- [ ] Run migrations against Supabase production

### Property CRUD
- [x] Property list page
- [x] Property create page
- [ ] Property detail page (full implementation)
- [ ] Property edit functionality
- [ ] Property archive functionality

### Unit CRUD
- [ ] Unit list (nested under property)
- [ ] Unit create
- [ ] Unit edit
- [ ] Unit status management

### Tenant CRUD
- [ ] Tenant list page
- [ ] Tenant create page
- [ ] Tenant detail page
- [ ] Tenant edit functionality
- [ ] GHL contact sync on create/update

### Lease CRUD
- [ ] Lease list page
- [ ] Lease create with tenant assignment
- [ ] Lease detail page
- [ ] Lease PDF upload
- [ ] Auto-generate rent schedule

### Property Systems
- [ ] Systems registry (HVAC, septic, roof, etc.)
- [ ] Add/edit systems per property
- [ ] Service history tracking

### Insurance
- [ ] Insurance policy CRUD
- [ ] Add/edit/delete per property
- [ ] Renewal tracking

### Property Taxes
- [ ] Tax tracking per property
- [ ] Due date management
- [ ] Payment status tracking

### Recurring Maintenance
- [ ] Create recurring schedules
- [ ] Mark tasks complete
- [ ] Auto-advance next_due dates

### Payments
- [ ] Manual payment recording
- [ ] Payment history view
- [ ] Rent roll view
