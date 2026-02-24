-- Migration: 006_tenant_screening.sql
-- Description: Create screening_surveys and screening_responses tables

-- Create screening_surveys table (landlord creates these)
CREATE TABLE screening_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create screening_responses table (tenant submissions)
CREATE TABLE screening_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES screening_surveys(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT,
  
  -- Employment Information
  employment_status TEXT CHECK (employment_status IN ('employed', 'self_employed', 'unemployed', 'student', 'retired')),
  employer_name TEXT,
  employer_phone TEXT,
  job_title TEXT,
  years_employed NUMERIC(3,1),
  
  -- Income Information
  monthly_income NUMERIC(10,2),
  income_source TEXT,
  
  -- Rental History
  current_address TEXT,
  current_rent NUMERIC(10,2),
  current_landlord_name TEXT,
  current_landlord_phone TEXT,
  reason_for_moving TEXT,
  previous_address TEXT,
  previous_landlord_name TEXT,
  previous_landlord_phone TEXT,
  
  -- References
  reference1_name TEXT,
  reference1_relationship TEXT,
  reference1_phone TEXT,
  reference2_name TEXT,
  reference2_relationship TEXT,
  reference2_phone TEXT,
  
  -- Pets
  has_pets BOOLEAN DEFAULT FALSE,
  pet_details TEXT, -- type, breed, weight, etc.
  
  -- Criminal Background (self-reported)
  has_criminal_record BOOLEAN DEFAULT FALSE,
  criminal_record_details TEXT,
  
  -- Additional Information
  num_occupants INTEGER DEFAULT 1,
  desired_move_in_date DATE,
  additional_comments TEXT,
  
  -- Scoring (calculated after submission)
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  score_breakdown JSONB,
  
  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES landlords(id),
  landlord_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_screening_surveys_landlord ON screening_surveys(landlord_id);
CREATE INDEX idx_screening_surveys_status ON screening_surveys(status);
CREATE INDEX idx_screening_responses_survey ON screening_responses(survey_id);
CREATE INDEX idx_screening_responses_tenant ON screening_responses(tenant_id);
CREATE INDEX idx_screening_responses_status ON screening_responses(status);
CREATE INDEX idx_screening_responses_score ON screening_responses(compatibility_score);

-- Add trigger for updated_at
CREATE TRIGGER update_screening_surveys_updated_at 
  BEFORE UPDATE ON screening_surveys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screening_responses_updated_at 
  BEFORE UPDATE ON screening_responses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE screening_surveys IS 'Survey templates created by landlords for tenant screening';
COMMENT ON TABLE screening_responses IS 'Tenant responses to screening surveys';
