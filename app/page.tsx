import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  DollarSign, 
  Wrench, 
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: DollarSign,
      title: 'Rent Collection',
      description: 'Accept ACH and card payments online. Automatic reminders and late fee calculation.',
    },
    {
      icon: Wrench,
      title: 'Maintenance Tracking',
      description: 'Tenants submit requests with photos. Track status from submission to completion.',
    },
    {
      icon: Building2,
      title: 'Property Management',
      description: 'Organize properties, units, and leases. Track insurance, taxes, and depreciation.',
    },
    {
      icon: Users,
      title: 'Tenant Portal',
      description: 'Simple web portal for tenants to pay rent and submit maintenance requests.',
    },
  ]

  const pricing = [
    {
      name: 'Starter',
      price: '$29',
      description: 'For landlords with up to 5 units',
      features: [
        'Up to 5 units',
        'Online rent collection (ACH)',
        'Maintenance requests',
        'Tenant portal',
        'Email reminders',
        '1 GB document storage',
      ],
    },
    {
      name: 'Standard',
      price: '$59',
      description: 'For landlords with up to 15 units',
      features: [
        'Up to 15 units',
        'ACH + Card payments',
        'Maintenance requests',
        'Tenant portal',
        'Email + SMS reminders',
        '5 GB document storage',
        '2 team members',
      ],
      popular: true,
    },
    {
      name: 'Pro',
      price: '$99',
      description: 'For landlords with up to 30 units',
      features: [
        'Up to 30 units',
        'ACH + Card payments',
        'Maintenance requests',
        'Tenant portal',
        'Email + SMS reminders',
        '20 GB document storage',
        '5 team members',
        'Priority support',
      ],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RentEase</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Property management made simple
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            RentEase helps small landlords collect rent, track maintenance, and manage tenants 
            — all from your phone. No training required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">14-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built for small landlords who want to spend less time on paperwork and more time growing their portfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-gray-50">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, flat pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              No per-unit fees. No hidden costs. Choose the plan that fits your portfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={plan.popular ? 'text-blue-100' : 'text-gray-500'}>/month</span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-blue-50' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'secondary' : 'default'}
                  size="lg"
                  asChild
                >
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-gray-900">RentEase</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 RentEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
