import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Shield } from 'lucide-react'

export default async function InsurancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: policies } = await supabase
    .from('insurance_policies')
    .select(`
      *,
      properties(name)
    `)
    .eq('landlord_id', user!.id)
    .order('renewal_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance</h1>
          <p className="text-gray-600">Manage insurance policies and track renewals</p>
        </div>
        <Button asChild>
          <Link href="/insurance/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Policy
          </Link>
        </Button>
      </div>

      {policies?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insurance policies</h3>
            <p className="text-gray-600 mb-6">Add your first insurance policy</p>
            <Button asChild>
              <Link href="/insurance/new">Add Policy</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {policies?.map((policy) => (
            <Link key={policy.id} href={`/insurance/${policy.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{policy.provider_name}</h3>
                      <p className="text-gray-600">{(policy as any).properties?.name}</p>
                      <p className="text-sm text-gray-500">
                        {policy.type} • ${policy.coverage_amount?.toLocaleString()} coverage
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${policy.premium_amount}/{policy.premium_frequency}</p>
                      {policy.renewal_date && (
                        <p className="text-sm text-gray-500">
                          Renews {new Date(policy.renewal_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
