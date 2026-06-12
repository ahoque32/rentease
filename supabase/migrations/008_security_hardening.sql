-- Migration: 008_security_hardening.sql
-- Description: Fix cross-tenant data exposure in the AI query RPC, add missing RLS
-- policies for tables created after migration 002, repair tenant policies that relied
-- on JWT app_metadata the app never sets, and add missing indexes.

-- ============================================
-- 1. AI QUERY RPC — enforce caller scoping
-- ============================================
-- The previous version was SECURITY DEFINER and ignored p_landlord_id, letting any
-- authenticated user read every landlord's data. SECURITY INVOKER makes the query run
-- as the caller, so the caller's own RLS policies scope every row it can see.
DROP FUNCTION IF EXISTS execute_readonly_query(TEXT, UUID);

CREATE FUNCTION execute_readonly_query(query_sql TEXT, p_landlord_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
SET statement_timeout = '5s'
AS $$
DECLARE
  result JSONB;
  lower_sql TEXT;
BEGIN
  -- The caller may only query on their own behalf
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_landlord_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  lower_sql := LOWER(TRIM(query_sql));

  IF NOT (lower_sql LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Single statement only: no statement separators or SQL comments
  IF position(';' IN query_sql) > 0 OR query_sql ~ '(--|/\*)' THEN
    RAISE EXCEPTION 'Multiple statements and comments are not allowed';
  END IF;

  IF lower_sql ~ '\m(insert|update|delete|drop|alter|create|truncate|grant|revoke|execute|exec|copy|do|call|set|listen|notify)\M' THEN
    RAISE EXCEPTION 'Modification queries are not allowed';
  END IF;

  -- Block system catalogs and other schemas
  IF lower_sql ~ '\m(auth|storage|extensions|pg_catalog|information_schema)\s*\.' OR lower_sql ~ '\mpg_[a-z_]+' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    query_sql
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION execute_readonly_query(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT, UUID) TO authenticated;

-- ============================================
-- 2. RLS FOR TABLES ADDED AFTER MIGRATION 002
-- ============================================

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;

-- Signatures: visible to the lease's landlord and its tenants
CREATE POLICY "signatures_lease_parties_select" ON signatures
  FOR SELECT USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN units u ON u.id = l.unit_id
      JOIN properties p ON p.id = u.property_id
      WHERE p.landlord_id = auth.uid()
    )
    OR lease_id IN (
      SELECT lt.lease_id FROM lease_tenants lt
      JOIN tenants t ON t.id = lt.tenant_id
      WHERE t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "signatures_lease_parties_insert" ON signatures
  FOR INSERT WITH CHECK (
    (
      signer_role = 'landlord'
      AND signer_id = auth.uid()
      AND lease_id IN (
        SELECT l.id FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE p.landlord_id = auth.uid()
      )
    )
    OR (
      signer_role = 'tenant'
      AND signer_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())
      AND lease_id IN (
        SELECT lt.lease_id FROM lease_tenants lt
        JOIN tenants t ON t.id = lt.tenant_id
        WHERE t.auth_user_id = auth.uid()
      )
    )
  );

-- Screening surveys: landlords manage their own
CREATE POLICY "screening_surveys_landlord_all" ON screening_surveys
  FOR ALL USING (landlord_id = auth.uid());

-- Screening responses: landlords manage responses to their own surveys
-- (public submissions are inserted server-side with the service role)
CREATE POLICY "screening_responses_landlord_all" ON screening_responses
  FOR ALL USING (
    survey_id IN (SELECT id FROM screening_surveys WHERE landlord_id = auth.uid())
  );

-- Complaint comments: visible/writable by the request's landlord and tenant
CREATE POLICY "complaint_comments_parties_select" ON complaint_comments
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM maintenance_requests WHERE landlord_id = auth.uid()
    )
    OR request_id IN (
      SELECT mr.id FROM maintenance_requests mr
      JOIN tenants t ON t.id = mr.tenant_id
      WHERE t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "complaint_comments_parties_insert" ON complaint_comments
  FOR INSERT WITH CHECK (
    (
      author_type = 'owner'
      AND author_id = auth.uid()
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE landlord_id = auth.uid()
      )
    )
    OR (
      author_type = 'tenant'
      AND author_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())
      AND request_id IN (
        SELECT mr.id FROM maintenance_requests mr
        JOIN tenants t ON t.id = mr.tenant_id
        WHERE t.auth_user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 3. FIX TENANT POLICIES THAT RELIED ON UNSET JWT METADATA
-- ============================================
-- Migration 002's tenant policies check auth.jwt()->'app_metadata'->>'tenant_id',
-- which the app never sets. Tenant accounts are linked via tenants.auth_user_id, so
-- add policies keyed on that (policies are permissive, so these OR with the old ones).

CREATE POLICY "tenants_view_leases_via_auth" ON leases
  FOR SELECT USING (
    id IN (
      SELECT lt.lease_id FROM lease_tenants lt
      JOIN tenants t ON t.id = lt.tenant_id
      WHERE t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tenants_view_payments_via_auth" ON payments
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenants_view_rent_schedule_via_auth" ON rent_schedule
  FOR SELECT USING (
    lease_id IN (
      SELECT lt.lease_id FROM lease_tenants lt
      JOIN tenants t ON t.id = lt.tenant_id
      WHERE t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "tenants_view_maintenance_via_auth" ON maintenance_requests
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenants_create_maintenance_via_auth" ON maintenance_requests
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenants_view_lease_tenants_via_auth" ON lease_tenants
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- 4. MISSING INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tenants_auth_user ON tenants(auth_user_id)
  WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_landlord_created
  ON notifications(landlord_id, created_at DESC);
-- Support the tenant-side RLS subqueries added above
CREATE INDEX IF NOT EXISTS idx_lease_tenants_tenant ON lease_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id)
  WHERE tenant_id IS NOT NULL;
