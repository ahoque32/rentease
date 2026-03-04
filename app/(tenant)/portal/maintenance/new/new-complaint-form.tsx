'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface NewComplaintFormProps {
  token?: string
}

export default function NewComplaintForm({ token }: NewComplaintFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('maintenance')
  const [severity, setSeverity] = useState('medium')

  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()

    if (!title || !description) {
      setError('Title and description are required.')
      toast.error('Title and description are required.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/tenant/maintenance${tokenQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, severity, title, description }),
      })
      const data = await res.json()

      if (!res.ok) {
        const message = data.error || 'Failed to create request'
        setError(message)
        toast.error(message)
        setLoading(false)
        return
      }

      const nextHref = token
        ? `/portal/maintenance/${data.id}?token=${encodeURIComponent(token)}`
        : `/portal/maintenance/${data.id}`
      toast.success('Maintenance request submitted.')
      router.push(nextHref)
      router.refresh()
    } catch (err: any) {
      const message = err.message || 'Something went wrong'
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Request</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="noise">Noise</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Brief summary of the issue" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Include details that help your landlord resolve this quickly."
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/portal/maintenance${tokenQuery}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
