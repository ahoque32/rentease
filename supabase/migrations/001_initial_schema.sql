-- Migration: 001_initial_schema.sql
-- Description: Initial schema for RentEase - Property Management SaaS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- LANDLORDS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE landlords (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  type TEXT CHECK (type IN ('single_family', 'multi_family', 'condo', 'townhouse', 'other')),
  notes TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNITS TABLE
-- ============================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bedrooms SMALLINT,
  bathrooms NUMERIC(3,1),
  sqft INTEGER,
  status TEXT CHECK (status IN ('vacant', 'occupied', 'maintenance')) DEFAULT 'vacant',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT CHECK (status IN ('applicant', 'active', 'past')) DEFAULT 'applicant',
  portal_invite_sent_at TIMESTAMPTZ,
  portal_token TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEASES TABLE
-- ============================================
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  status TEXT CHECK (status IN ('draft', 'active', 'expiring', 'expired', 'terminated')) DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC(10,2) NOT NULL,
  security_deposit NUMERIC(10,2),
  late_fee_amount NUMERIC(10,2) DEFAULT 0,
  grace_period_days SMALLINT DEFAULT 5,
  rent_due_day SMALLINT DEFAULT 1,
  lease_document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEASE-TENANT JUNCTION TABLE
-- ============================================
CREATE TABLE lease_tenants (
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (lease_id, tenant_id)
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amount NUMERIC(10,2) NOT NULL,
  type TEXT CHECK (type IN ('rent', 'late_fee', 'security_deposit', 'other')) DEFAULT 'rent',
  method TEXT CHECK (method IN ('ach', 'card', 'cash', 'check', 'zelle', 'venmo', 'other')),
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  for_month DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RENT SCHEDULE TABLE
-- ============================================
CREATE TABLE rent_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  late_fee_applied NUMERIC(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('upcoming', 'due', 'paid', 'partial', 'overdue')) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE REQUESTS TABLE
-- ============================================
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  tenant_id UUID REFERENCES tenants(id),
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('new', 'in_progress', 'scheduled', 'completed', 'cancelled')) DEFAULT 'new',
  contractor_name TEXT,
  contractor_phone TEXT,
  contractor_email TEXT,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE PHOTOS TABLE
-- ============================================
CREATE TABLE maintenance_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by TEXT CHECK (uploaded_by IN ('tenant', 'landlord', 'contractor')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSURANCE POLICIES TABLE
-- ============================================
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  type TEXT CHECK (type IN ('disaster', 'repair', 'tax', 'home_warranty', 'liability', 'flood', 'other')) NOT NULL,
  provider_name TEXT NOT NULL,
  policy_number TEXT,
  coverage_amount NUMERIC(12,2),
  premium_amount NUMERIC(10,2),
  premium_frequency TEXT CHECK (premium_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')) DEFAULT 'annual',
  start_date DATE,
  renewal_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROPERTY TAXES TABLE
-- ============================================
CREATE TABLE property_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  tax_year INTEGER NOT NULL,
  annual_amount NUMERIC(10,2) NOT NULL,
  assessor_parcel_number TEXT,
  tax_authority TEXT,
  due_dates JSONB,
  payment_status TEXT CHECK (payment_status IN ('paid', 'due', 'overdue', 'partial')) DEFAULT 'due',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROPERTY SYSTEMS TABLE
-- ============================================
CREATE TABLE property_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  system_type TEXT CHECK (system_type IN ('hvac', 'septic', 'roof', 'electrical', 'plumbing', 'appliance', 'other')) NOT NULL,
  model TEXT,
  manufacturer TEXT,
  install_date DATE,
  condition TEXT CHECK (condition IN ('good', 'fair', 'poor', 'critical')) DEFAULT 'good',
  last_serviced_date DATE,
  next_service_due DATE,
  service_interval_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECURRING MAINTENANCE TABLE
-- ============================================
CREATE TABLE recurring_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES property_systems(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  task_name TEXT NOT NULL,
  interval_months INTEGER NOT NULL,
  last_completed DATE,
  next_due DATE NOT NULL,
  estimated_cost NUMERIC(10,2),
  contractor_name TEXT,
  contractor_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEPRECIATION TABLE
-- ============================================
CREATE TABLE depreciation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  purchase_price NUMERIC(12,2) NOT NULL,
  purchase_date DATE NOT NULL,
  land_value NUMERIC(12,2) DEFAULT 0,
  building_value NUMERIC(12,2),
  useful_life_years NUMERIC(4,1) DEFAULT 27.5,
  annual_depreciation NUMERIC(10,2),
  accumulated_depreciation NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAPITAL IMPROVEMENTS TABLE
-- ============================================
CREATE TABLE capital_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  date_completed DATE NOT NULL,
  useful_life_years NUMERIC(4,1),
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCREENINGS TABLE
-- ============================================
CREATE TABLE screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  tenant_id UUID REFERENCES tenants(id),
  applicant_email TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('invited', 'pending', 'completed', 'expired')) DEFAULT 'invited',
  provider TEXT DEFAULT 'transunion',
  provider_reference_id TEXT,
  report_data JSONB,
  credit_score INTEGER,
  recommendation TEXT CHECK (recommendation IN ('pass', 'caution', 'fail')),
  fee_amount NUMERIC(10,2),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT CHECK (recipient_type IN ('landlord', 'tenant', 'contractor')),
  recipient_id UUID,
  recipient_contact TEXT,
  channel TEXT CHECK (channel IN ('email', 'sms', 'push')),
  type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT CHECK (status IN ('queued', 'sent', 'failed')) DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  related_type TEXT,
  related_id UUID,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Auto-generate rent schedule when lease is created
CREATE OR REPLACE FUNCTION generate_rent_schedule()
RETURNS TRIGGER AS $$
DECLARE
  current_date DATE;
  due_date DATE;
  months_count INTEGER;
BEGIN
  current_date := NEW.start_date;
  months_count := 0;
  
  WHILE current_date <= NEW.end_date LOOP
    due_date := make_date(
      EXTRACT(YEAR FROM current_date)::int,
      EXTRACT(MONTH FROM current_date)::int,
      NEW.rent_due_day
    );
    
    -- Handle months with fewer days than rent_due_day
    IF due_date < current_date THEN
      due_date := due_date + INTERVAL '1 month';
    END IF;
    
    -- Only create schedule if due_date is within lease period
    IF due_date <= NEW.end_date THEN
      INSERT INTO rent_schedule (lease_id, due_date, amount_due, status)
      VALUES (
        NEW.id, 
        due_date, 
        NEW.monthly_rent,
        CASE 
          WHEN due_date > CURRENT_DATE THEN 'upcoming'
          WHEN due_date = CURRENT_DATE THEN 'due'
          ELSE 'overdue'
        END
      );
    END IF;
    
    current_date := current_date + INTERVAL '1 month';
    months_count := months_count + 1;
    
    -- Safety limit
    IF months_count > 120 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lease_schedule_trigger
  AFTER INSERT ON leases
  FOR EACH ROW EXECUTE FUNCTION generate_rent_schedule();

-- Auto-calculate depreciation on insert/update
CREATE OR REPLACE FUNCTION calculate_depreciation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.building_value := NEW.purchase_price - COALESCE(NEW.land_value, 0);
  NEW.annual_depreciation := NEW.building_value / NEW.useful_life_years;
  NEW.accumulated_depreciation := NEW.annual_depreciation *
    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.purchase_date)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER depreciation_calc_trigger
  BEFORE INSERT OR UPDATE ON depreciation
  FOR EACH ROW EXECUTE FUNCTION calculate_depreciation();

-- Auto-advance recurring maintenance next_due after completion
CREATE OR REPLACE FUNCTION advance_recurring_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_completed IS NOT NULL AND
     (OLD.last_completed IS NULL OR NEW.last_completed != OLD.last_completed) THEN
    NEW.next_due := NEW.last_completed + (NEW.interval_months || ' months')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recurring_maintenance_advance
  BEFORE UPDATE ON recurring_maintenance
  FOR EACH ROW EXECUTE FUNCTION advance_recurring_maintenance();

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables with updated_at
CREATE TRIGGER update_landlords_updated_at BEFORE UPDATE ON landlords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rent_schedule_updated_at BEFORE UPDATE ON rent_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_taxes_updated_at BEFORE UPDATE ON property_taxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_systems_updated_at BEFORE UPDATE ON property_systems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_maintenance_updated_at BEFORE UPDATE ON recurring_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depreciation_updated_at BEFORE UPDATE ON depreciation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_archived ON properties(archived) WHERE archived = FALSE;
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_tenants_landlord ON tenants(landlord_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_portal_token ON tenants(portal_token);
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_landlord ON leases(landlord_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date) WHERE status = 'active';
CREATE INDEX idx_payments_lease ON payments(lease_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_for_month ON payments(for_month);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
CREATE INDEX idx_rent_schedule_lease ON rent_schedule(lease_id);
CREATE INDEX idx_rent_schedule_due_date ON rent_schedule(due_date);
CREATE INDEX idx_rent_schedule_status ON rent_schedule(status);
CREATE INDEX idx_maintenance_landlord ON maintenance_requests(landlord_id);
CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_urgency ON maintenance_requests(urgency);
CREATE INDEX idx_maintenance_photos_request ON maintenance_photos(request_id);
CREATE INDEX idx_insurance_property ON insurance_policies(property_id);
CREATE INDEX idx_insurance_landlord ON insurance_policies(landlord_id);
CREATE INDEX idx_insurance_renewal ON insurance_policies(renewal_date);
CREATE INDEX idx_taxes_property ON property_taxes(property_id);
CREATE INDEX idx_taxes_landlord ON property_taxes(landlord_id);
CREATE INDEX idx_systems_property ON property_systems(property_id);
CREATE INDEX idx_recurring_system ON recurring_maintenance(system_id);
CREATE INDEX idx_recurring_property ON recurring_maintenance(property_id);
CREATE INDEX idx_recurring_landlord ON recurring_maintenance(landlord_id);
CREATE INDEX idx_recurring_next_due ON recurring_maintenance(next_due);
CREATE INDEX idx_depreciation_property ON depreciation(property_id);
CREATE INDEX idx_screenings_landlord ON screenings(landlord_id);
CREATE INDEX idx_screenings_tenant ON screenings(tenant_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'queued';
CREATE INDEX idx_documents_landlord ON documents(landlord_id);
CREATE INDEX idx_documents_related ON documents(related_type, related_id);
