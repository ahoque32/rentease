// Demo mode — bypass auth with a fixed landlord ID
export const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@rentease.app',
  user_metadata: { full_name: 'Demo Landlord' }
}

export function getDemoUser() {
  return DEMO_USER
}
