-- Migration: 004_zillow_integration.sql
-- Description: Add Zillow URL field to properties table

-- Add zillow_url column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zillow_url TEXT;

-- Add index for faster lookups (though not strictly necessary for this field)
CREATE INDEX IF NOT EXISTS idx_properties_zillow_url ON properties(zillow_url) WHERE zillow_url IS NOT NULL;
