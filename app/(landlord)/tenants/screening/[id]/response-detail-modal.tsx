'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Briefcase, Home, Users, PawPrint, AlertTriangle } from 'lucide-react'

interface ScreeningResponse {
  id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  employment_status: string | null
  employer_name: string | null
  employer_phone: string | null
  job_title: string | null
  years_employed: number | null
  monthly_income: number | null
  income_source: string | null
  current_address: string | null
  current_rent: number | null
  current_landlord_name: string | null
  current_landlord_phone: string | null
  reason_for_moving: string | null
  previous_address: string | null
  previous_landlord_name: string | null
  previous_landlord_phone: string | null
  reference1_name: string | null
  reference1_relationship: string | null
  reference1_phone: string | null
  reference2_name: string | null
  reference2_relationship: string | null
  reference2_phone: string | null
  has_pets: boolean
  pet_details: string | null
  has_criminal_record: boolean
  criminal_record_details: string | null
  num_occupants: number
  desired_move_in_date: string | null
  additional_comments: string | null
  compatibility_score: number | null
  score_breakdown: any
  status: string
  landlord_notes: string | null
}

interface ResponseDetailModalProps {
  response: ScreeningResponse
  children: React.ReactNode
}

export default function ResponseDetailModal({ response, children }: ResponseDetailModalProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(response.status)
  const [notes, setNotes] = useState(response.landlord_notes || '')
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/screening/responses/${response.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, landlord_notes: notes }),
      })

      if (res.ok) {
        setStatus(newStatus)
      }
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{response.applicant_name}</h3>
              <p className="text-gray-600">{response.applicant_email}</p>
              {response.applicant_phone && <p className="text-gray-600">{response.applicant_phone}</p>}
            </div>
            <div className="text-right">
              {response.compatibility_score !== null && (
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Compatibility Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(response.compatibility_score)}`}>
                    {response.compatibility_score}%
                  </p>
                </div>
              )}
              <Badge variant={
                status === 'approved' ? 'default' :
                status === 'rejected' ? 'destructive' :
                'secondary'
              }>
                {status}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="rental">Rental History</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Employment</span>
                  </div>
                  <p className="text-sm capitalize">{response.employment_status || 'Not provided'}</p>
                  {response.employer_name && <p className="text-sm text-gray-600">{response.employer_name}</p>}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Current Address</span>
                  </div>
                  <p className="text-sm">{response.current_address || 'Not provided'}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Occupants</span>
                  </div>
                  <p className="text-sm">{response.num_occupants} person(s)</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Pets</span>
                  </div>
                  <p className="text-sm">{response.has_pets ? `Yes - ${response.pet_details}` : 'No pets'}</p>
                </div>
              </div>

              {response.desired_move_in_date && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Desired Move-in Date</p>
                  <p>{new Date(response.desired_move_in_date).toLocaleDateString()}</p>
                </div>
              )}

              {response.additional_comments && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">Additional Comments</p>
                  <p className="text-sm">{response.additional_comments}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employment Status</p>
                  <p className="font-medium capitalize">{response.employment_status || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="font-medium">{response.monthly_income ? `$${response.monthly_income.toLocaleString()}` : 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employer</p>
                  <p className="font-medium">{response.employer_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Title</p>
                  <p className="font-medium">{response.job_title || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years Employed</p>
                  <p className="font-medium">{response.years_employed || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Income Source</p>
                  <p className="font-medium">{response.income_source || 'Not provided'}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rental" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Current Residence</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Address: </span>{response.current_address || 'N/A'}</div>
                    <div><span className="text-gray-500">Rent: </span>{response.current_rent ? `$${response.current_rent}` : 'N/A'}</div>
                    <div><span className="text-gray-500">Landlord: </span>{response.current_landlord_name || 'N/A'}</div>
                    <div><span className="text-gray-500">Phone: </span>{response.current_landlord_phone || 'N/A'}</div>
                  </div>
                  {response.reason_for_moving && (
                    <p className="mt-2 text-sm"><span className="text-gray-500">Reason for moving: </span>{response.reason_for_moving}</p>
                  )}
                </div>

                {response.previous_address && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Previous Residence</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Address: </span>{response.previous_address}</div>
                      <div><span className="text-gray-500">Landlord: </span>{response.previous_landlord_name || 'N/A'}</div>
                      <div><span className="text-gray-500">Phone: </span>{response.previous_landlord_phone || 'N/A'}</div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">References</h4>
                  <div className="space-y-2">
                    {response.reference1_name && (
                      <div className="text-sm">
                        <p><span className="text-gray-500">1. </span>{response.reference1_name} ({response.reference1_relationship})</p>
                        <p className="text-gray-600">{response.reference1_phone}</p>
                      </div>
                    )}
                    {response.reference2_name && (
                      <div className="text-sm">
                        <p><span className="text-gray-500">2. </span>{response.reference2_name} ({response.reference2_relationship})</p>
                        <p className="text-gray-600">{response.reference2_phone}</p>
                      </div>
                    )}
                    {!response.reference1_name && !response.reference2_name && (
                      <p className="text-sm text-gray-500">No references provided</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <div className={`p-4 rounded-lg ${response.has_criminal_record ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${response.has_criminal_record ? 'text-red-600' : 'text-green-600'}`} />
                  <span className="font-medium">Criminal Background</span>
                </div>
                <p className="text-sm">
                  {response.has_criminal_record 
                    ? `Yes - ${response.criminal_record_details || 'Details not provided'}` 
                    : 'No criminal record declared'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Score Breakdown</p>
                {response.score_breakdown ? (
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Base Score:</span><span>{response.score_breakdown.base_score}</span></div>
                    <div className="flex justify-between"><span>Employment:</span><span>+{response.score_breakdown.employment_bonus}</span></div>
                    <div className="flex justify-between"><span>Income:</span><span>+{response.score_breakdown.income_bonus}</span></div>
                    <div className="flex justify-between"><span>Rental History:</span><span>+{response.score_breakdown.rental_history_bonus}</span></div>
                    <div className="flex justify-between"><span>References:</span><span>+{response.score_breakdown.references_bonus}</span></div>
                    {response.score_breakdown.pet_penalty !== 0 && (
                      <div className="flex justify-between"><span>Pets:</span><span>{response.score_breakdown.pet_penalty}</span></div>
                    )}
                    {response.score_breakdown.criminal_penalty !== 0 && (
                      <div className="flex justify-between text-red-600"><span>Criminal Record:</span><span>{response.score_breakdown.criminal_penalty}</span></div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t"><span>Final Score:</span><span>{response.score_breakdown.final_score}</span></div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Score breakdown not available</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Landlord Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Add your notes about this applicant..."
              />
            </div>

            <div className="flex gap-2">
              {status !== 'approved' && (
                <Button 
                  onClick={() => updateStatus('approved')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}
              {status !== 'rejected' && (
                <Button 
                  onClick={() => updateStatus('rejected')}
                  disabled={loading}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
              {status !== 'pending' && (
                <Button 
                  onClick={() => updateStatus('pending')}
                  disabled={loading}
                  variant="outline"
                >
                  Mark as Pending
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}