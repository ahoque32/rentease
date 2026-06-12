import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { StripeConnectButton } from '@/components/settings/StripeConnectButton'
import { FormError } from '@/components/shared/FormError'
import { CheckCircle2 } from 'lucide-react'

interface SettingsPageProps {
  searchParams?: { saved?: string; error?: string }
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: landlord } = await supabase
    .from('landlords')
    .select('*')
    .eq('id', user!.id)
    .single()

  async function updateProfile(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const fullName = String(formData.get('fullName') ?? '').trim()
    if (!fullName) {
      redirect('/settings?error=' + encodeURIComponent('Full name is required'))
    }

    const updates = {
      full_name: fullName,
      phone: String(formData.get('phone') ?? '').trim() || null,
      company_name: String(formData.get('companyName') ?? '').trim() || null,
    }

    const { error } = await supabase.from('landlords').update(updates).eq('id', user.id)
    if (error) {
      console.error('Profile update failed:', error)
      redirect('/settings?error=' + encodeURIComponent('Could not save your profile. Please try again.'))
    }
    redirect('/settings?saved=1')
  }

  async function signOut() {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-4">
            <FormError message={searchParams?.error} />
            {searchParams?.saved && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/90 px-4 py-3 text-sm text-green-700"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Profile saved.
              </div>
            )}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={landlord?.full_name}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={landlord?.email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={landlord?.phone || ''}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  defaultValue={landlord?.company_name || ''}
                  className="mt-1"
                />
              </div>
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Stripe Connection</CardTitle>
        </CardHeader>
        <CardContent>
          {landlord?.stripe_onboarding_complete ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <span className="text-green-700 font-medium">Connected to Stripe</span>
                <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Account ID: {landlord.stripe_account_id}
              </p>
              <p className="text-sm text-gray-600">
                You can receive online rent payments from tenants via ACH bank transfer or card.
              </p>
            </div>
          ) : landlord?.stripe_account_id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-yellow-700 font-medium">Onboarding Incomplete</span>
              </div>
              <p className="text-gray-600 text-sm">
                Your Stripe account was created but onboarding isn&apos;t complete. Click below to continue.
              </p>
              <StripeConnectButton label="Continue Stripe Setup" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Stripe account to accept online rent payments from tenants via ACH bank transfer or card.
              </p>
              <StripeConnectButton label="Connect Stripe" />
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="destructive">Sign Out</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
