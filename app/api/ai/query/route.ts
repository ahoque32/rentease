import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MINIMAX_API_URL = 'https://api.minimax.io/anthropic'
const MINIMAX_MODEL = 'MiniMax-M1-80k'

const SYSTEM_PROMPT = `You are an AI assistant for RentEase, a property management platform. 
You help landlords query their data using natural language.

Available tables and their key columns:
- properties: id, landlord_id, name, address_line1, city, state, zip, type
- units: id, property_id, name, bedrooms, bathrooms, sqft, status
- tenants: id, landlord_id, first_name, last_name, email, phone, status
- leases: id, unit_id, landlord_id, status, start_date, end_date, monthly_rent, security_deposit
- lease_tenants: lease_id, tenant_id, is_primary
- payments: id, lease_id, tenant_id, amount, type, method, status, for_month, paid_at
- rent_schedule: id, lease_id, due_date, amount_due, amount_paid, late_fee_applied, status
- maintenance_requests: id, unit_id, tenant_id, landlord_id, title, category, urgency, status, estimated_cost, actual_cost
- insurance_policies: id, property_id, landlord_id, type, provider_name, coverage_amount, premium_amount, renewal_date
- property_taxes: id, property_id, landlord_id, tax_year, annual_amount, payment_status

IMPORTANT RULES:
1. Generate ONLY SELECT queries. Never INSERT, UPDATE, DELETE, DROP, etc.
2. ALWAYS filter by landlord_id = '{landlord_id}' for tables that have landlord_id.
3. For tables without landlord_id (units, lease_tenants), JOIN through parent tables that do.
4. Use proper PostgreSQL syntax.
5. Return ONLY the SQL query, no explanation, no markdown, no backticks.
6. Use meaningful column aliases for readability.
7. Format dates nicely when possible.`

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app' }

    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const apiKey = process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    // Step 1: Generate SQL from natural language
    const systemPrompt = SYSTEM_PROMPT.replace('{landlord_id}', user.id)

    const aiResponse = await fetch(`${MINIMAX_API_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: question },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const err = await aiResponse.text()
      console.error('MiniMax API error:', err)
      return NextResponse.json({ error: 'AI query failed' }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    const sql = aiData.content?.[0]?.text?.trim()

    if (!sql) {
      return NextResponse.json({ error: 'No SQL generated' }, { status: 500 })
    }

    // Step 2: Validate SQL is SELECT-only
    const lowerSql = sql.toLowerCase()
    if (!lowerSql.startsWith('select')) {
      return NextResponse.json({ error: 'Only SELECT queries are allowed' }, { status: 400 })
    }

    const blocked = /(insert|update|delete|drop|alter|create|truncate|grant|revoke)\s/i
    if (blocked.test(sql)) {
      return NextResponse.json({ error: 'Modification queries are not allowed' }, { status: 400 })
    }

    // Step 3: Execute via Supabase RPC
    const { data: result, error: rpcError } = await supabase.rpc('execute_readonly_query', {
      query_sql: sql,
      p_landlord_id: user.id,
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      return NextResponse.json({
        error: 'Query execution failed',
        details: rpcError.message,
        sql,
      }, { status: 400 })
    }

    // Step 4: Format the result with AI
    const formatResponse = await fetch(`${MINIMAX_API_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        max_tokens: 2048,
        system: 'You are a helpful assistant. Format the following database query results into a clear, readable answer for the user. Use natural language. If the data contains numbers/money, format them nicely. Be concise.',
        messages: [
          {
            role: 'user',
            content: `Question: ${question}\n\nQuery Results:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      }),
    })

    let formattedAnswer = JSON.stringify(result, null, 2)
    if (formatResponse.ok) {
      const formatData = await formatResponse.json()
      formattedAnswer = formatData.content?.[0]?.text || formattedAnswer
    }

    return NextResponse.json({
      answer: formattedAnswer,
      sql,
      rawData: result,
    })
  } catch (error: any) {
    console.error('AI query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
