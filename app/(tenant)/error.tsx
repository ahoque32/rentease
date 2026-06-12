'use client'

import { SegmentError } from '@/components/shared/SegmentError'

export default function TenantError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SegmentError {...props} homeHref="/portal" homeLabel="Portal Home" />
}
