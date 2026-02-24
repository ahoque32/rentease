import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ClipboardList, ExternalLink } from 'lucide-react'

export default async function ScreeningListPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: surveys } = await supabase
    .from('screening_surveys')
    .select(`
      *,
      properties(id, name),
      units(id, name)
    `)
    .eq('landlord_id', user!.id)
    .order('created_at', { ascending: false })

  // Get response counts for each survey
  const surveyIds = surveys?.map(s => s.id) || []
  const { data: responseCounts } = await supabase
    .from('screening_responses')
    .select('survey_id, status')
    .in('survey_id', surveyIds)

  const countsBySurvey: Record<string, { total: number; pending: number }> = {}
  responseCounts?.forEach(r => {
    if (!countsBySurvey[r.survey_id]) {
      countsBySurvey[r.survey_id] = { total: 0, pending: 0 }
    }
    countsBySurvey[r.survey_id].total++
    if (r.status === 'pending') {
      countsBySurvey[r.survey_id].pending++
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Screening</h1>
          <p className="text-gray-600">Create screening surveys and review applications</p>
        </div>
        <Button asChild>
          <Link href="/tenants/screening/new">
            <Plus className="w-4 h-4 mr-2" />
            New Survey
          </Link>
        </Button>
      </div>

      {!surveys || surveys.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No screening surveys yet</h3>
            <p className="text-gray-600 mb-6">Create your first screening survey to start collecting applications</p>
            <Button asChild>
              <Link href="/tenants/screening/new">Create Survey</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {surveys?.map((survey) => {
            const counts = countsBySurvey[survey.id] || { total: 0, pending: 0 }
            const applyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/tenants/screening/apply/${survey.id}`
            
            return (
              <Link key={survey.id} href={`/tenants/screening/${survey.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
                          <Badge variant={
                            survey.status === 'active' ? 'default' :
                            survey.status === 'draft' ? 'secondary' :
                            'outline'
                          }>
                            {survey.status}
                          </Badge>
                        </div>
                        
                        {survey.description && (
                          <p className="text-gray-600 mb-2">{survey.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {survey.properties && (
                            <span>Property: {survey.properties.name}</span>
                          )}
                          {survey.units && (
                            <span>Unit: {survey.units.name}</span>
                          )}
                          <span>Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                        </div>

                        {counts.total > 0 && (
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm">
                              <span className="font-medium">{counts.total}</span> applications
                            </span>
                            {counts.pending > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {counts.pending} pending review
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigator.clipboard.writeText(applyUrl)
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}