'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, PenLine, AlertCircle, Loader2 } from 'lucide-react'

interface Signature {
  id: string
  signer_role: 'landlord' | 'tenant'
  signer_id: string
  signer_name: string
  signed_at: string
}

interface SignaturePanelProps {
  leaseId: string
  signatures: Signature[]
  isLandlord: boolean
  isTenant: boolean
  tenantId?: string
  leaseStatus: string
}

export default function SignaturePanel({
  leaseId,
  signatures: initialSignatures,
  isLandlord,
  isTenant,
  tenantId,
  leaseStatus,
}: SignaturePanelProps) {
  const [signatures, setSignatures] = useState(initialSignatures)
  const [signerName, setSignerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const landlordSignature = signatures.find(s => s.signer_role === 'landlord')
  const tenantSignature = signatures.find(s => s.signer_role === 'tenant')
  
  const canSign = (isLandlord && !landlordSignature) || (isTenant && !tenantSignature)
  const hasSigned = (isLandlord && !!landlordSignature) || (isTenant && !!tenantSignature)
  const signedCount = useMemo(() => signatures.filter(s => s.signer_role === 'landlord' || s.signer_role === 'tenant').length, [signatures])

  async function handleSign() {
    if (!signerName.trim()) {
      setError('Please enter your full name to sign')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/leases/${leaseId}/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_name: signerName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign lease')
      }

      setSignatures([...signatures, data.signature])
      setSuccess(data.lease_activated 
        ? 'Lease signed successfully! The lease is now active.' 
        : 'Lease signed successfully! Waiting for other party to sign.')
      setSignerName('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (leaseStatus) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'pending_signatures':
        return <Badge variant="secondary">Pending Signatures</Badge>
      case 'active':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      default:
        return <Badge variant="outline">{leaseStatus}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PenLine className="w-5 h-5" />
          Digital Signatures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Lease Status:</span>
          {getStatusBadge()}
        </div>

        <div className="space-y-2" aria-live="polite">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Signing progress</span>
            <span>{signedCount}/2 completed</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${(signedCount / 2) * 100}%` }} />
          </div>
        </div>

        {/* Signatures List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                landlordSignature ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
              }`}>
                {landlordSignature ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium">Landlord</p>
                {landlordSignature ? (
                  <p className="text-sm text-gray-600">
                    Signed by {landlordSignature.signer_name} on{' '}
                    {new Date(landlordSignature.signed_at).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Waiting for signature</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tenantSignature ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
              }`}>
                {tenantSignature ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium">Tenant</p>
                {tenantSignature ? (
                  <p className="text-sm text-gray-600">
                    Signed by {tenantSignature.signer_name} on{' '}
                    {new Date(tenantSignature.signed_at).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Waiting for signature</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sign Form */}
        {canSign && (
          <div className="border-t pt-4 space-y-4">
            <p className="text-sm text-gray-600">
              By typing your full name below, you agree to the terms of this lease and 
              digitally sign this agreement.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="signer_name">Type your full name to sign</Label>
              <Input
                id="signer_name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                {success}
              </div>
            )}

            <Button 
              onClick={handleSign} 
              disabled={loading || !signerName.trim()}
              className="w-full"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing...</> : 'Sign Lease Agreement'}
            </Button>
          </div>
        )}

        {hasSigned && !canSign && (
          <div className="border-t pt-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              You have signed this lease agreement.
            </div>
          </div>
        )}

        {!isLandlord && !isTenant && (
          <div className="border-t pt-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              Only the landlord and assigned tenant can sign this lease.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}