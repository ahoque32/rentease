#!/usr/bin/env node
/**
 * Script to run Supabase migrations via the REST API
 * Uses service role key for admin operations
 */

const SUPABASE_URL = 'https://ajzonxmgmeeolakgfwja.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqem9ueG1nbWVlb2xha2dmd2phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1MTM1MiwiZXhwIjoyMDg1ODI3MzUyfQ.eJxj316f1_QQIrMhNPGn1hV15qJH8YOD92RrZ46eQ1Y';

async function runMigration(sql, name) {
  console.log(`Running migration: ${name}...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Migration ${name} failed:`, error);
    throw new Error(error);
  }

  console.log(`✓ Migration ${name} completed successfully`);
  return true;
}

async function checkMigrationsTable() {
  // Check if migrations tracking table exists
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({ 
      query: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        );
      ` 
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create migrations table:', error);
    throw new Error(error);
  }
}

async function isMigrationApplied(name) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/schema_migrations?name=eq.${name}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
    },
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.length > 0;
}

async function recordMigration(name) {
  await fetch(`${SUPABASE_URL}/rest/v1/schema_migrations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ name }),
  });
}

// Main execution
async function main() {
  const fs = require('fs');
  const path = require('path');

  // Check if we can use the exec_sql RPC function
  console.log('Checking database connection...');
  
  // Try to create the exec_sql function first if it doesn't exist
  const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
    RETURNS VOID AS $$
    BEGIN
      EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
    },
  });

  if (!response.ok) {
    console.error('Failed to connect to Supabase');
    process.exit(1);
  }

  console.log('Connected to Supabase successfully');
  
  // For now, we'll output the SQL to run manually via Supabase Dashboard
  console.log('\n=== MIGRATION SQL ===\n');
  console.log('Please run the following SQL in the Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/ajzonxmgmeeolakgfwja/sql/new\n');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`\n-- === ${file} ===`);
      console.log(sql);
    }
  }
}

main().catch(console.error);
