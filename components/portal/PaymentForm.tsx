'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { loadStripe } from '@stripe/stripe-js'

interface PaymentFormProps {
  rentScheduleId: string
  amount: number
  stripePublishableKey: string
}

export function PaymentForm({ rentScheduleId, amount, stripePublishableKey }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'ach' | 'card'>('ach')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handlePay() {
    setLoading(true)
    setError('')

    try {
      // Create payment intent
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentScheduleId, paymentMethod }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create payment')
        return
      }

      // Load Stripe and confirm payment
      const stripe = await loadStripe(stripePublishableKey)
      if (!stripe) {
        setError('Failed to load payment processor')
        return
      }

      if (paymentMethod === 'ach') {
        // For ACH, use the Financial Connections flow which collects bank details via Stripe's UI
        const { error: stripeError } = await stripe.confirmUsBankAccountPayment(
          data.clientSecret
        )
        if (stripeError) {
          setError(stripeError.message || 'Payment failed')
          return
        }
      } else {
        // For card payments, redirect to Stripe Checkout-like flow
        const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: {
              // Stripe Elements would be used in production
              // For now this triggers the payment sheet
            } as any,
          },
        })
        if (stripeError) {
          setError(stripeError.message || 'Payment failed')
          return
        }
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-green-600 font-medium text-lg">✅ Payment submitted!</div>
        <p className="text-sm text-gray-500 mt-1">You&apos;ll receive a receipt by email.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setPaymentMethod('ach')}
          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            paymentMethod === 'ach'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          🏦 Bank Transfer (ACH)
        </button>
        <button
          onClick={() => setPaymentMethod('card')}
          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            paymentMethod === 'card'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          💳 Card
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)} via ${paymentMethod === 'ach' ? 'ACH' : 'Card'}`}
      </Button>

      {paymentMethod === 'ach' && (
        <p className="text-xs text-gray-400 text-center">ACH transfers typically take 3-5 business days</p>
      )}
    </div>
  )
}
