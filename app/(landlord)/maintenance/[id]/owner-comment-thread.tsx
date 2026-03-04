'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CommentItem {
  id: string
  author_type: 'owner' | 'tenant'
  body: string
  created_at: string
}

interface OwnerCommentThreadProps {
  requestId: string
  initialComments: CommentItem[]
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function OwnerCommentThread({ requestId, initialComments }: OwnerCommentThreadProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const body = newComment.trim()
    if (!body) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/maintenance/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add comment')
        setLoading(false)
        return
      }

      setComments((prev) => [...prev, data.comment])
      setNewComment('')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-600">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">
                  {comment.author_type === 'owner' ? 'You' : 'Tenant'}
                </p>
                <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add a comment for the tenant..."
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Add Comment'}
        </Button>
      </form>
    </div>
  )
}
