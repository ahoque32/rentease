import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
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

    const updates = {
      full_name: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      company_name: formData.get('companyName') as string,
    }

    await supabase.from('landlords').update(updates).eq('id', user!.id)
    redirect('/settings')
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
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  name="fullName"
                  defaultValue={landlord?.full_name}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={landlord?.email}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={landlord?.phone || ''}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Company Name (Optional)</label>
                <input
                  name="companyName"
                  defaultValue={landlord?.company_name || ''}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
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
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <span>Connected to Stripe</span>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Stripe account to accept online rent payments.
              </p>
              <Button>Connect Stripe</Button>
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
