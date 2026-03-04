-- Add tenant-facing fields to maintenance_requests
ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS submitted_by_tenant UUID REFERENCES tenants(id);

-- Replace legacy category constraint so tenant complaint categories are accepted
ALTER TABLE maintenance_requests
  DROP CONSTRAINT IF EXISTS maintenance_requests_category_check;

ALTER TABLE maintenance_requests
  ADD CONSTRAINT maintenance_requests_category_check
  CHECK (category IN (
    'plumbing',
    'electrical',
    'hvac',
    'appliance',
    'structural',
    'pest',
    'maintenance',
    'noise',
    'billing',
    'other'
  ));

-- Comment threads on maintenance requests
CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  author_type TEXT CHECK (author_type IN ('owner', 'tenant')) NOT NULL,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_request ON complaint_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON complaint_comments(request_id, created_at);
