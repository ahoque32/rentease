import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { handleRouteError } from '@/lib/api/respond'

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

  // Income check
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

  // Pet penalty
  if (response.has_pets) {
    score -= 5
    breakdown.pet_penalty = -5
  }

  // Criminal record penalty
  if (response.has_criminal_record) {
    score -= 20
    breakdown.criminal_penalty = -20
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))
  breakdown.final_score = score

  return { score, breakdown }
}

// GET /api/screening/apply/[surveyId] - Get survey for application (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const supabase = createClient()

    const { data: survey, error } = await supabase
      .from('screening_surveys')
      .select(`
        id,
        title,
        description,
        properties(id, name, address_line1, city, state),
        units(id, name)
      `)
      .eq('id', params.surveyId)
      .eq('status', 'active')
      .single()

    if (error || !survey) {
      return NextResponse.json({ error: 'Survey not found or not active' }, { status: 404 })
    }

    return NextResponse.json({ survey })
  } catch (error) {
    return handleRouteError('Get survey for apply API error', error)
  }
}

// POST /api/screening/apply/[surveyId] - Submit application (public)
export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const supabase = createClient()

    // Verify survey exists and is active
    const { data: survey, error: surveyError } = await supabase
      .from('screening_surveys')
      .select('id, status')
      .eq('id', params.surveyId)
      .eq('status', 'active')
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found or not active' }, { status: 404 })
    }

    const body = await request.json()
    const {
      applicant_name,
      applicant_email,
      applicant_phone,
      employment_status,
      employer_name,
      employer_phone,
      job_title,
      years_employed,
      monthly_income,
      income_source,
      current_address,
      current_rent,
      current_landlord_name,
      current_landlord_phone,
      reason_for_moving,
      previous_address,
      previous_landlord_name,
      previous_landlord_phone,
      reference1_name,
      reference1_relationship,
      reference1_phone,
      reference2_name,
      reference2_relationship,
      reference2_phone,
      has_pets,
      pet_details,
      has_criminal_record,
      criminal_record_details,
      num_occupants,
      desired_move_in_date,
      additional_comments,
    } = body

    // Validate required fields
    if (!applicant_name || !applicant_email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Calculate compatibility score
    const responseData = {
      employment_status,
      monthly_income,
      current_landlord_name,
      current_landlord_phone,
      reference1_name,
      reference1_phone,
      reference2_name,
      reference2_phone,
      has_pets,
      has_criminal_record,
    }
    const { score, breakdown } = calculateCompatibilityScore(responseData)

    const admin = createAdminClient()
    const { data: response, error } = await admin
      .from('screening_responses')
      .insert({
        survey_id: params.surveyId,
        applicant_name,
        applicant_email,
        applicant_phone: applicant_phone || null,
        employment_status: employment_status || null,
        employer_name: employer_name || null,
        employer_phone: employer_phone || null,
        job_title: job_title || null,
        years_employed: years_employed || null,
        monthly_income: monthly_income || null,
        income_source: income_source || null,
        current_address: current_address || null,
        current_rent: current_rent || null,
        current_landlord_name: current_landlord_name || null,
        current_landlord_phone: current_landlord_phone || null,
        reason_for_moving: reason_for_moving || null,
        previous_address: previous_address || null,
        previous_landlord_name: previous_landlord_name || null,
        previous_landlord_phone: previous_landlord_phone || null,
        reference1_name: reference1_name || null,
        reference1_relationship: reference1_relationship || null,
        reference1_phone: reference1_phone || null,
        reference2_name: reference2_name || null,
        reference2_relationship: reference2_relationship || null,
        reference2_phone: reference2_phone || null,
        has_pets: has_pets || false,
        pet_details: pet_details || null,
        has_criminal_record: has_criminal_record || false,
        criminal_record_details: criminal_record_details || null,
        num_occupants: num_occupants || 1,
        desired_move_in_date: desired_move_in_date || null,
        additional_comments: additional_comments || null,
        compatibility_score: score,
        score_breakdown: breakdown,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Create response error:', error)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      response: {
        id: response.id,
        applicant_name: response.applicant_name,
      }
    })
  } catch (error) {
    return handleRouteError('Submit application API error', error)
  }
}