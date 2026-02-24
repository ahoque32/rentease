import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Calculate compatibility score based on response data
function calculateCompatibilityScore(response: any): { score: number; breakdown: any } {
  let score = 50 // Start with neutral score
  const breakdown: any = {
    base_score: 50,
    employment_bonus: 0,
    income_bonus: 0,
    rental_history_bonus: 0,
    references_bonus: 0,
    pet_penalty: 0,
    criminal_penalty: 0,
    final_score: 0,
  }

  // Employment status (+10 for employed/self-employed)
  if (response.employment_status === 'employed' || response.employment_status === 'self_employed') {
    score += 10
    breakdown.employment_bonus = 10
  } else if (response.employment_status === 'student') {
    score += 5
    breakdown.employment_bonus = 5
  }

  // Income check (assuming 3x rent is ideal)
  if (response.monthly_income && response.monthly_income >= 3000) {
    score += 15
    breakdown.income_bonus = 15
  } else if (response.monthly_income && response.monthly_income >= 2000) {
    score += 10
    breakdown.income_bonus = 10
  } else if (response.monthly_income) {
    score += 5
    breakdown.income_bonus = 5
  }

  // Rental history (+10 for having previous landlord reference)
  if (response.current_landlord_name && response.current_landlord_phone) {
    score += 10
    breakdown.rental_history_bonus = 10
  }

  // References (+5 for each complete reference)
  let refBonus = 0
  if (response.reference1_name && response.reference1_phone) refBonus += 5
  if (response.reference2_name && response.reference2_phone) refBonus += 5
  score += refBonus
  breakdown.references_bonus = refBonus

  // Pet penalty (-5 if has pets, assuming some landlords prefer no pets)
  if (response.has_pets) {
    score -= 5
    breakdown.pet_penalty = -5
  }

  // Criminal record penalty (-20)
  if (response.has_criminal_record) {
    score -= 20
    breakdown.criminal_penalty = -20
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))
  breakdown.final_score = score

  return { score, breakdown }
}

// GET /api/screening/responses/[id] - Get response details
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

    // Get response with survey info to verify ownership
    const { data: response, error } = await supabase
      .from('screening_responses')
      .select(`
        *,
        screening_surveys!inner(landlord_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Verify landlord owns this survey
    const survey = Array.isArray(response.screening_surveys) ? response.screening_surveys[0] : response.screening_surveys
    if (survey?.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Response detail API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/screening/responses/[id] - Update response status and notes
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
    const { status, landlord_notes } = body

    // Verify ownership
    const { data: existing } = await supabase
      .from('screening_responses')
      .select(`
        id,
        screening_surveys!inner(landlord_id)
      `)
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    const existingSurvey = Array.isArray(existing.screening_surveys) ? existing.screening_surveys[0] : existing.screening_surveys
    if (existingSurvey?.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (landlord_notes !== undefined) updateData.landlord_notes = landlord_notes
    if (status && (status === 'approved' || status === 'rejected')) {
      updateData.reviewed_at = new Date().toISOString()
      updateData.reviewed_by = user.id
    }

    const admin = createAdminClient()
    const { data: response, error } = await admin
      .from('screening_responses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Update response error:', error)
      return NextResponse.json({ error: 'Failed to update response' }, { status: 500 })
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Update response API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/screening/responses/[id] - Submit new response (public endpoint)
// This is handled by a separate public route
