'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function StripeConnectButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create Stripe connection')
      }
    } catch {
      alert('Failed to connect to Stripe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting...' : label}
    </Button>
  )
}
