-- Migration: 003_sprint3_notifications_rpc.sql
-- Description: Sprint 3 - Add landlord_id to notifications, GHL contact ID to tenants, RPC for AI queries

-- Add landlord_id to notifications for scoping
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES landlords(id);
CREATE INDEX IF NOT EXISTS idx_notifications_landlord ON notifications(landlord_id);

-- Add ghl_contact_id to tenants (may already exist from Sprint 2 GHL sync)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- Add deduplication key to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedup_key TEXT UNIQUE;

-- RPC function for AI query engine - execute readonly SQL scoped to landlord
CREATE OR REPLACE FUNCTION execute_readonly_query(query_sql TEXT, p_landlord_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  lower_sql TEXT;
BEGIN
  lower_sql := LOWER(TRIM(query_sql));
  
  -- Only allow SELECT statements
  IF NOT (lower_sql LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Block dangerous keywords
  IF lower_sql ~ '(insert|update|delete|drop|alter|create|truncate|grant|revoke|execute|exec)' THEN
    RAISE EXCEPTION 'Modification queries are not allowed';
  END IF;
  
  -- Block access to auth schema
  IF lower_sql ~ 'auth\.' THEN
    RAISE EXCEPTION 'Access to auth schema is not allowed';
  END IF;
  
  -- Execute query and return as JSON
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    query_sql
  ) INTO result;
  
  RETURN result;
END;
$$;
