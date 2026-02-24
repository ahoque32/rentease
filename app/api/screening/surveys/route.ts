import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/screening/surveys - List surveys for landlord
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: surveys, error } = await supabase
      .from('screening_surveys')
      .select(`
        *,
        properties(id, name),
        units(id, name)
      `)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch surveys error:', error)
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
    }

    return NextResponse.json({ surveys: surveys || [] })
  } catch (error: any) {
    console.error('Surveys API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/screening/surveys - Create new survey
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, property_id, unit_id } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: survey, error } = await admin
      .from('screening_surveys')
      .insert({
        landlord_id: user.id,
        title,
        description: description || null,
        property_id: property_id || null,
        unit_id: unit_id || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Create survey error:', error)
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 })
    }

    return NextResponse.json({ survey })
  } catch (error: any) {
    console.error('Create survey API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}