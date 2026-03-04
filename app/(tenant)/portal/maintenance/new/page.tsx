import Link from 'next/link'
import { Button } from '@/components/ui/button'
import NewComplaintForm from './new-complaint-form'

interface PageProps {
  searchParams: { token?: string }
}

export default function NewTenantMaintenancePage({ searchParams }: PageProps) {
  const token = searchParams.token
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Maintenance Request</h1>
          <p className="text-gray-600">Tell your landlord what needs attention.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/portal/maintenance${tokenQuery}`}>Back to Requests</Link>
        </Button>
      </div>

      <NewComplaintForm token={token} />
    </div>
  )
}
