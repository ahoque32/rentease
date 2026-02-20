'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function DeleteMaintenanceButton({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/maintenance')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete request')
        setDeleting(false)
        setConfirming(false)
      }
    } catch {
      alert('Something went wrong')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={deleting}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirming(true)}>
      <Trash2 className="w-4 h-4 mr-2" />
      Delete
    </Button>
  )
}
