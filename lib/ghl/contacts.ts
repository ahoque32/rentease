import { syncContact, addTagToContact } from './client'

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  portal_token?: string
}

interface Lease {
  monthly_rent: number
  end_date: string
}

interface Unit {
  name: string
}

interface Property {
  name: string
}

export async function syncTenantToGHL(
  tenant: Tenant,
  lease?: Lease,
  unit?: Unit,
  property?: Property
) {
  const portalLink = tenant.portal_token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/portal?token=${tenant.portal_token}`
    : undefined

  return syncContact({
    firstName: tenant.first_name,
    lastName: tenant.last_name,
    email: tenant.email,
    phone: tenant.phone,
    tags: ['rentease-tenant', property?.name ? `property:${property.name}` : undefined].filter(Boolean) as string[],
    customFields: {
      rentease_tenant_id: tenant.id,
      rentease_unit: unit?.name,
      rentease_property: property?.name,
      rentease_monthly_rent: lease?.monthly_rent,
      rentease_lease_end: lease?.end_date,
      rentease_payment_status: 'current',
      rentease_portal_link: portalLink,
    },
  })
}

export async function triggerRentReminder(
  contactId: string,
  eventData: {
    tenantName: string
    amount: number
    dueDate: string
    paymentLink: string
    reminderType: 'upcoming' | 'due_today' | 'overdue_1d' | 'overdue_3d' | 'overdue_7d'
  }
) {
  // Add tag to trigger GHL workflow
  await addTagToContact(contactId, [`rent-reminder:${eventData.reminderType}`])
}

export async function triggerMaintenanceAlert(
  contactId: string,
  eventData: {
    requestTitle: string
    urgency: string
    unit: string
  }
) {
  await addTagToContact(contactId, [`maintenance:${eventData.urgency}`])
}

export async function triggerInsuranceReminder(
  contactId: string,
  daysUntilExpiry: number
) {
  const tag = daysUntilExpiry <= 7 ? 'insurance:expiring_7d' : 
              daysUntilExpiry <= 30 ? 'insurance:expiring_30d' : 
              'insurance:expiring_60d'
  await addTagToContact(contactId, [tag])
}
