'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface InviteTenantButtonProps {
  tenantId: string
}

export function InviteTenantButton({ tenantId }: InviteTenantButtonProps) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite() {
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/tenants/${tenantId}/invite`, {
      method: 'POST',
    })
    const data = await response.json()

    setLoading(false)

    if (!response.ok) {
      setError(data.error || 'Failed to send invite')
      return
    }

    setSent(true)
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleInvite} variant={sent ? 'secondary' : 'outline'} disabled={loading || sent}>
        {sent ? 'Invite Sent' : loading ? 'Sending...' : 'Send Invite'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
