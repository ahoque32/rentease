-- Migration: 005_lease_signatures.sql
-- Description: Add signatures table and update lease status for e-signing flow

-- Update lease status enum to include pending_signatures
ALTER TABLE leases DROP CONSTRAINT IF EXISTS leases_status_check;
ALTER TABLE leases ADD CONSTRAINT leases_status_check 
  CHECK (status IN ('draft', 'pending_signatures', 'active', 'expiring', 'expired', 'terminated'));

-- Create signatures table
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  signer_role TEXT NOT NULL CHECK (signer_role IN ('landlord', 'tenant')),
  signer_id UUID NOT NULL,
  signer_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_signatures_lease ON signatures(lease_id);
CREATE INDEX idx_signatures_signer ON signatures(signer_id);
CREATE UNIQUE INDEX idx_signatures_unique ON signatures(lease_id, signer_role, signer_id);

-- Add comment explaining the table
COMMENT ON TABLE signatures IS 'Stores digital signatures for lease agreements';
