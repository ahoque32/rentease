'use client'

import { SegmentError } from '@/components/shared/SegmentError'

export default function LandlordError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SegmentError {...props} homeHref="/dashboard" homeLabel="Dashboard" />
}
