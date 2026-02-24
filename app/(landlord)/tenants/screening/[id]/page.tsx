import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import ResponseDetailModal from './response-detail-modal'
import CopyButton from '@/components/shared/copy-button'

interface PageProps {
  params: { id: string }
}

export default async function SurveyDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: survey } = await supabase
    .from('screening_surveys')
    .select(`
      *,
      properties(id, name),
      units(id, name)
    `)
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!survey) redirect('/tenants/screening')

  const { data: responses } = await supabase
    .from('screening_responses')
    .select('*')
    .eq('survey_id', params.id)
    .order('submitted_at', { ascending: false })

  const applyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/tenants/screening/apply/${params.id}`

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/tenants/screening">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Surveys
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <Badge variant={survey.status === 'active' ? 'default' : survey.status === 'draft' ? 'secondary' : 'outline'}>
              {survey.status}
            </Badge>
          </div>
          {survey.description && <p className="text-gray-600">{survey.description}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">Share this link with prospective tenants to collect applications:</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={applyUrl}
              readOnly
              aria-label="Public application link"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
            />
            <CopyButton value={applyUrl} label="Copy Link" size="default" className="sm:w-auto w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Applications ({responses?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!responses || responses.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No applications yet. Share the link above to start collecting responses.</div>
          ) : (
            <div className="space-y-3">
              {responses.map((response) => (
                <ResponseDetailModal key={response.id} response={response}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(response.status)}
                      <div>
                        <p className="font-medium">{response.applicant_name}</p>
                        <p className="text-sm text-gray-600">{response.applicant_email}</p>
                        <p className="text-xs text-gray-500">Submitted {new Date(response.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {response.compatibility_score !== null && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Compatibility Score</p>
                          <p className={`text-xl font-bold ${getScoreColor(response.compatibility_score)}`}>
                            {response.compatibility_score}%
                          </p>
                        </div>
                      )}
                      <Badge variant={response.status === 'approved' ? 'default' : response.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {response.status}
                      </Badge>
                    </div>
                  </div>
                </ResponseDetailModal>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
