import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Home,
  Shield,
  Calendar,
  DollarSign,
  Edit,
} from 'lucide-react'
import DeleteInsuranceButton from './delete-button'

interface PageProps {
  params: { id: string }
}

export default async function InsuranceDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: policy } = await supabase
    .from('insurance_policies')
    .select(`
      *,
      properties(id, name)
    `)
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!policy) {
    redirect('/insurance')
  }

  const property = (policy as any).properties

  const typeLabels: Record<string, string> = {
    disaster: 'Disaster',
    repair: 'Repair',
    tax: 'Tax',
    home_warranty: 'Home Warranty',
    liability: 'Liability',
    flood: 'Flood',
    other: 'Other',
  }

  const frequencyLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
  }

  // Determine renewal status
  const isExpiringSoon = policy.renewal_date &&
    new Date(policy.renewal_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const isExpired = policy.renewal_date &&
    new Date(policy.renewal_date) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/insurance">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Insurance
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{policy.provider_name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabels[policy.type] || policy.type}</Badge>
            {isExpired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : isExpiringSoon ? (
              <Badge variant="secondary">Renewing Soon</Badge>
            ) : (
              <Badge variant="default">Active</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/insurance/${params.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DeleteInsuranceButton policyId={params.id} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {policy.coverage_amount ? `$${Number(policy.coverage_amount).toLocaleString()}` : 'N/A'}
            </div>
            <p className="text-sm text-gray-600">Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {policy.premium_amount ? `$${Number(policy.premium_amount).toLocaleString()}` : 'N/A'}
            </div>
            <p className="text-sm text-gray-600">Premium ({frequencyLabels[policy.premium_frequency] || policy.premium_frequency})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-sm text-gray-600">Start Date</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {policy.renewal_date ? new Date(policy.renewal_date).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-sm text-gray-600">Renewal Date</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Property */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/properties/${property?.id}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {property?.name}
            </Link>
          </CardContent>
        </Card>

        {/* Policy Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Policy Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{typeLabels[policy.type] || policy.type}</p>
            </div>
            {policy.policy_number && (
              <div>
                <p className="text-sm text-gray-500">Policy Number</p>
                <p className="font-medium">{policy.policy_number}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Coverage Amount</p>
              <p className="font-medium">
                {policy.coverage_amount ? `$${Number(policy.coverage_amount).toLocaleString()}` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Premium</p>
              <p className="font-medium">
                {policy.premium_amount
                  ? `$${Number(policy.premium_amount).toLocaleString()} / ${frequencyLabels[policy.premium_frequency] || policy.premium_frequency}`
                  : 'Not specified'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">
                {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Renewal Date</p>
              <p className="font-medium">
                {policy.renewal_date ? new Date(policy.renewal_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {policy.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{policy.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
