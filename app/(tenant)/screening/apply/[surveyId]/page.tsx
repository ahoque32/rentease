'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Home, Building2, Loader2, CheckCircle } from 'lucide-react'

interface Survey {
  id: string
  title: string
  description: string | null
  properties: {
    id: string
    name: string
    address_line1: string
    city: string
    state: string
  } | null
  units: {
    id: string
    name: string
  } | null
}

export default function ScreeningApplicationPage() {
  const params = useParams()
  const surveyId = params.surveyId as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    employment_status: '',
    employer_name: '',
    employer_phone: '',
    job_title: '',
    years_employed: '',
    monthly_income: '',
    income_source: '',
    current_address: '',
    current_rent: '',
    current_landlord_name: '',
    current_landlord_phone: '',
    reason_for_moving: '',
    previous_address: '',
    previous_landlord_name: '',
    previous_landlord_phone: '',
    reference1_name: '',
    reference1_relationship: '',
    reference1_phone: '',
    reference2_name: '',
    reference2_relationship: '',
    reference2_phone: '',
    has_pets: false,
    pet_details: '',
    has_criminal_record: false,
    criminal_record_details: '',
    num_occupants: '1',
    desired_move_in_date: '',
    additional_comments: '',
  })

  useEffect(() => {
    async function fetchSurvey() {
      try {
        const res = await fetch(`/api/screening/apply/${surveyId}`)
        if (!res.ok) {
          throw new Error('Survey not found or not active')
        }
        const data = await res.json()
        setSurvey(data.survey)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSurvey()
  }, [surveyId])

  function handleChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/screening/apply/${surveyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
          current_rent: formData.current_rent ? parseFloat(formData.current_rent) : null,
          years_employed: formData.years_employed ? parseFloat(formData.years_employed) : null,
          num_occupants: parseInt(formData.num_occupants) || 1,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600">This screening survey is not available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your application. The landlord will review it and contact you soon.
            </p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>{survey?.title}</CardTitle>
                {survey?.properties && (
                  <p className="text-sm text-gray-600">
                    {survey.properties.name} - {survey.properties.address_line1}, {survey.properties.city}, {survey.properties.state}
                  </p>
                )}
              </div>
            </div>
            {survey?.description && (
              <p className="text-gray-600">{survey.description}</p>
            )}
          </CardHeader>
        </Card>

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicant_name">Full Name *</Label>
                    <Input
                      id="applicant_name"
                      value={formData.applicant_name}
                      onChange={(e) => handleChange('applicant_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicant_email">Email Address *</Label>
                    <Input
                      id="applicant_email"
                      type="email"
                      value={formData.applicant_email}
                      onChange={(e) => handleChange('applicant_email', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicant_phone">Phone Number</Label>
                  <Input
                    id="applicant_phone"
                    type="tel"
                    value={formData.applicant_phone}
                    onChange={(e) => handleChange('applicant_phone', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num_occupants">Number of Occupants</Label>
                    <Input
                      id="num_occupants"
                      type="number"
                      min="1"
                      value={formData.num_occupants}
                      onChange={(e) => handleChange('num_occupants', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desired_move_in_date">Desired Move-in Date</Label>
                    <Input
                      id="desired_move_in_date"
                      type="date"
                      value={formData.desired_move_in_date}
                      onChange={(e) => handleChange('desired_move_in_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employment Status</Label>
                    <Select 
                      value={formData.employment_status} 
                      onValueChange={(v) => handleChange('employment_status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self_employed">Self-Employed</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_income">Monthly Income ($)</Label>
                    <Input
                      id="monthly_income"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_income}
                      onChange={(e) => handleChange('monthly_income', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employer_name">Employer Name</Label>
                    <Input
                      id="employer_name"
                      value={formData.employer_name}
                      onChange={(e) => handleChange('employer_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleChange('job_title', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years_employed">Years at Current Job</Label>
                    <Input
                      id="years_employed"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.years_employed}
                      onChange={(e) => handleChange('years_employed', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employer_phone">Employer Phone</Label>
                    <Input
                      id="employer_phone"
                      type="tel"
                      value={formData.employer_phone}
                      onChange={(e) => handleChange('employer_phone', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rental History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <Input
                    id="current_address"
                    value={formData.current_address}
                    onChange={(e) => handleChange('current_address', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_rent">Current Monthly Rent ($)</Label>
                    <Input
                      id="current_rent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.current_rent}
                      onChange={(e) => handleChange('current_rent', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason_for_moving">Reason for Moving</Label>
                    <Input
                      id="reason_for_moving"
                      value={formData.reason_for_moving}
                      onChange={(e) => handleChange('reason_for_moving', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_landlord_name">Current Landlord Name</Label>
                    <Input
                      id="current_landlord_name"
                      value={formData.current_landlord_name}
                      onChange={(e) => handleChange('current_landlord_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_landlord_phone">Current Landlord Phone</Label>
                    <Input
                      id="current_landlord_phone"
                      type="tel"
                      value={formData.current_landlord_phone}
                      onChange={(e) => handleChange('current_landlord_phone', e.target.value)}
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <p className="text-sm text-gray-500 mb-4">Previous Residence (Optional)</p>
                <div className="space-y-2">
                  <Label htmlFor="previous_address">Previous Address</Label>
                  <Input
                    id="previous_address"
                    value={formData.previous_address}
                    onChange={(e) => handleChange('previous_address', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previous_landlord_name">Previous Landlord Name</Label>
                    <Input
                      id="previous_landlord_name"
                      value={formData.previous_landlord_name}
                      onChange={(e) => handleChange('previous_landlord_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previous_landlord_phone">Previous Landlord Phone</Label>
                    <Input
                      id="previous_landlord_phone"
                      type="tel"
                      value={formData.previous_landlord_phone}
                      onChange={(e) => handleChange('previous_landlord_phone', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">References</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">Reference 1</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference1_name">Name</Label>
                    <Input
                      id="reference1_name"
                      value={formData.reference1_name}
                      onChange={(e) => handleChange('reference1_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference1_relationship">Relationship</Label>
                    <Input
                      id="reference1_relationship"
                      value={formData.reference1_relationship}
                      onChange={(e) => handleChange('reference1_relationship', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference1_phone">Phone</Label>
                    <Input
                      id="reference1_phone"
                      type="tel"
                      value={formData.reference1_phone}
                      onChange={(e) => handleChange('reference1_phone', e.target.value)}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">Reference 2</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference2_name">Name</Label>
                    <Input
                      id="reference2_name"
                      value={formData.reference2_name}
                      onChange={(e) => handleChange('reference2_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference2_relationship">Relationship</Label>
                    <Input
                      id="reference2_relationship"
                      value={formData.reference2_relationship}
                      onChange={(e) => handleChange('reference2_relationship', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference2_phone">Phone</Label>
                    <Input
                      id="reference2_phone"
                      type="tel"
                      value={formData.reference2_phone}
                      onChange={(e) => handleChange('reference2_phone', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pets & Background */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pets & Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="has_pets"
                    checked={formData.has_pets}
                    onCheckedChange={(checked) => handleChange('has_pets', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="has_pets" className="font-normal cursor-pointer">
                      I have pet(s)
                    </Label>
                    <p className="text-sm text-gray-500">Check this box if you have any pets</p>
                  </div>
                </div>
                
                {formData.has_pets && (
                  <div className="space-y-2 pl-7">
                    <Label htmlFor="pet_details">Pet Details (type, breed, weight, etc.)</Label>
                    <Input
                      id="pet_details"
                      value={formData.pet_details}
                      onChange={(e) => handleChange('pet_details', e.target.value)}
                      placeholder="e.g., 1 dog - Golden Retriever, 65 lbs"
                    />
                  </div>
                )}

                <hr className="my-4" />

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="has_criminal_record"
                    checked={formData.has_criminal_record}
                    onCheckedChange={(checked) => handleChange('has_criminal_record', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="has_criminal_record" className="font-normal cursor-pointer">
                      I have a criminal record
                    </Label>
                    <p className="text-sm text-gray-500">Please disclose any criminal history. This will not automatically disqualify you.</p>
                  </div>
                </div>
                
                {formData.has_criminal_record && (
                  <div className="space-y-2 pl-7">
                    <Label htmlFor="criminal_record_details">Please provide details</Label>
                    <textarea
                      id="criminal_record_details"
                      value={formData.criminal_record_details}
                      onChange={(e) => handleChange('criminal_record_details', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="additional_comments">Additional Comments (Optional)</Label>
                  <textarea
                    id="additional_comments"
                    value={formData.additional_comments}
                    onChange={(e) => handleChange('additional_comments', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}