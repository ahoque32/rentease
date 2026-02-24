import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/screening/surveys/[id] - Get survey details with responses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get survey
    const { data: survey, error: surveyError } = await supabase
      .from('screening_surveys')
      .select(`
        *,
        properties(id, name),
        units(id, name)
      `)
      .eq('id', params.id)
      .eq('landlord_id', user.id)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from('screening_responses')
      .select('*')
      .eq('survey_id', params.id)
      .order('submitted_at', { ascending: false })

    if (responsesError) {
      console.error('Fetch responses error:', responsesError)
    }

    return NextResponse.json({ 
      survey,
      responses: responses || []
    })
  } catch (error: any) {
    console.error('Survey detail API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/screening/surveys/[id] - Update survey status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Verify ownership
    const { data: existing } = await supabase
      .from('screening_surveys')
      .select('id')
      .eq('id', params.id)
      .eq('landlord_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const admin = createAdminClient()
    const { data: survey, error } = await admin
      .from('screening_surveys')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Update survey error:', error)
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
    }

    return NextResponse.json({ survey })
  } catch (error: any) {
    console.error('Update survey API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/screening/surveys/[id] - Delete survey
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('screening_surveys')
      .select('id')
      .eq('id', params.id)
      .eq('landlord_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('screening_surveys')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete survey error:', error)
      return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete survey API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}