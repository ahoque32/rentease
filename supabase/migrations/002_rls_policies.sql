-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for RentEase

-- Enable RLS on all tables
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LANDLORD POLICIES (Full access to own data)
-- ============================================

-- Landlords can manage their own profile
CREATE POLICY "landlords_own_profile" ON landlords
  FOR ALL USING (id = auth.uid());

-- Landlords can manage their properties
CREATE POLICY "landlords_own_properties" ON properties
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage units of their properties
CREATE POLICY "landlords_own_units" ON units
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage their tenants
CREATE POLICY "landlords_own_tenants" ON tenants
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage leases for their units
CREATE POLICY "landlords_own_leases" ON leases
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage lease-tenant relationships
CREATE POLICY "landlords_own_lease_tenants" ON lease_tenants
  FOR ALL USING (
    lease_id IN (
      SELECT id FROM leases WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage payments for their leases
CREATE POLICY "landlords_own_payments" ON payments
  FOR ALL USING (
    lease_id IN (
      SELECT id FROM leases WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage rent schedules for their leases
CREATE POLICY "landlords_own_rent_schedule" ON rent_schedule
  FOR ALL USING (
    lease_id IN (
      SELECT id FROM leases WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage maintenance requests for their units
CREATE POLICY "landlords_own_maintenance" ON maintenance_requests
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage maintenance photos for their requests
CREATE POLICY "landlords_own_maintenance_photos" ON maintenance_photos
  FOR ALL USING (
    request_id IN (
      SELECT id FROM maintenance_requests WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage insurance policies
CREATE POLICY "landlords_own_insurance" ON insurance_policies
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage property taxes
CREATE POLICY "landlords_own_taxes" ON property_taxes
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage property systems
CREATE POLICY "landlords_own_systems" ON property_systems
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage recurring maintenance
CREATE POLICY "landlords_own_recurring" ON recurring_maintenance
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage depreciation records
CREATE POLICY "landlords_own_depreciation" ON depreciation
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can manage capital improvements
CREATE POLICY "landlords_own_improvements" ON capital_improvements
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Landlords can manage screenings
CREATE POLICY "landlords_own_screenings" ON screenings
  FOR ALL USING (landlord_id = auth.uid());

-- Landlords can view their notifications
CREATE POLICY "landlords_own_notifications" ON notifications
  FOR ALL USING (
    recipient_type = 'landlord' AND recipient_id = auth.uid()
  );

-- Landlords can manage their documents
CREATE POLICY "landlords_own_documents" ON documents
  FOR ALL USING (landlord_id = auth.uid());

-- ============================================
-- TENANT PORTAL POLICIES (Limited access via portal token)
-- ============================================

-- Tenants can view their own tenant record (via auth or portal)
CREATE POLICY "tenants_view_own" ON tenants
  FOR SELECT USING (
    auth.uid() = auth_user_id OR
    auth.jwt() -> 'app_metadata' ->> 'tenant_id' = id::text OR
    portal_token = (auth.jwt() -> 'app_metadata' ->> 'portal_token')
  );

-- Tenants can view their leases
CREATE POLICY "tenants_view_leases" ON leases
  FOR SELECT USING (
    id IN (
      SELECT lease_id FROM lease_tenants 
      WHERE tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    )
  );

-- Tenants can view their payments
CREATE POLICY "tenants_view_payments" ON payments
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- Tenants can view their rent schedule
CREATE POLICY "tenants_view_rent_schedule" ON rent_schedule
  FOR SELECT USING (
    lease_id IN (
      SELECT lease_id FROM lease_tenants 
      WHERE tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    )
  );

-- Tenants can create maintenance requests for their unit
CREATE POLICY "tenants_create_maintenance" ON maintenance_requests
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- Tenants can view their maintenance requests
CREATE POLICY "tenants_view_maintenance" ON maintenance_requests
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- Tenants can view maintenance photos for their requests
CREATE POLICY "tenants_view_maintenance_photos" ON maintenance_photos
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM maintenance_requests 
      WHERE tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    )
  );

-- Tenants can add photos to their maintenance requests
CREATE POLICY "tenants_add_maintenance_photos" ON maintenance_photos
  FOR INSERT WITH CHECK (
    request_id IN (
      SELECT id FROM maintenance_requests 
      WHERE tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
    )
  );

-- ============================================
-- SERVICE ROLE BYPASS (for server-side operations)
-- ============================================

-- Create a policy that allows service role to bypass RLS
-- This is handled automatically by Supabase when using service_role key
