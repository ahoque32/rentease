'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentFormProps {
  rentScheduleId: string
  amount: number
  token?: string
  stripePublishableKey?: string
}

export function PaymentForm({ rentScheduleId, amount, token }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentScheduleId, token }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create payment')
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      setError('No checkout URL returned')
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Redirecting to Stripe...' : `Pay $${amount.toFixed(2)} Now`}
      </Button>
    </div>
  )
}
