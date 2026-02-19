import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const payload = await request.json()
  
  // Handle GHL webhook events
  console.log('GHL webhook received:', payload)
  
  return NextResponse.json({ received: true })
}
