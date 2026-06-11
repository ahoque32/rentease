import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // GHL doesn't sign webhooks, so require a shared secret configured on both
  // sides. Unconfigured environments reject all deliveries rather than
  // accepting anonymous POSTs.
  const secret = process.env.GHL_WEBHOOK_SECRET
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Handle GHL webhook events
  console.log('GHL webhook received:', payload)

  return NextResponse.json({ received: true })
}
