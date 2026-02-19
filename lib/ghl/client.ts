const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_KEY = process.env.GHL_API_KEY!
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!

interface GHLRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  body?: Record<string, unknown>
  params?: Record<string, string>
}

export async function ghlRequest<T>({ method, path, body, params }: GHLRequestOptions): Promise<T> {
  const url = new URL(`${GHL_API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GHL API error ${res.status}: ${err}`)
  }

  return res.json()
}

// Custom fields configuration for RentEase
export const RENTEASE_CUSTOM_FIELDS = [
  { name: 'rentease_tenant_id', fieldKey: 'rentease_tenant_id', dataType: 'TEXT' },
  { name: 'rentease_unit', fieldKey: 'rentease_unit', dataType: 'TEXT' },
  { name: 'rentease_property', fieldKey: 'rentease_property', dataType: 'TEXT' },
  { name: 'rentease_monthly_rent', fieldKey: 'rentease_monthly_rent', dataType: 'MONETARY' },
  { name: 'rentease_lease_end', fieldKey: 'rentease_lease_end', dataType: 'DATE' },
  { name: 'rentease_payment_status', fieldKey: 'rentease_payment_status', dataType: 'TEXT' },
  { name: 'rentease_portal_link', fieldKey: 'rentease_portal_link', dataType: 'TEXT' },
]

export async function setupCustomFields() {
  for (const field of RENTEASE_CUSTOM_FIELDS) {
    try {
      await ghlRequest({
        method: 'POST',
        path: `/locations/${GHL_LOCATION_ID}/customFields`,
        body: field,
      })
    } catch (error) {
      // Field might already exist, continue
      console.log(`Custom field ${field.fieldKey} may already exist`)
    }
  }
}

// Find contact by email
export async function findContactByEmail(email: string) {
  try {
    const response = await ghlRequest<{
      contacts: Array<{
        id: string
        email: string
        firstName: string
        lastName: string
      }>
    }>({
      method: 'GET',
      path: '/contacts/',
      params: { query: email, locationId: GHL_LOCATION_ID },
    })
    return response.contacts?.[0] || null
  } catch (error) {
    return null
  }
}

// Create or update contact
export async function syncContact(contactData: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  tags?: string[]
  customFields?: Record<string, string | number | undefined>
}) {
  const existingContact = await findContactByEmail(contactData.email)

  const body = {
    locationId: GHL_LOCATION_ID,
    firstName: contactData.firstName,
    lastName: contactData.lastName,
    email: contactData.email,
    phone: contactData.phone,
    tags: contactData.tags || [],
    customFields: contactData.customFields || {},
  }

  if (existingContact) {
    return ghlRequest({
      method: 'PUT',
      path: `/contacts/${existingContact.id}`,
      body,
    })
  } else {
    return ghlRequest({
      method: 'POST',
      path: '/contacts/',
      body,
    })
  }
}

// Add tag to contact (triggers workflows)
export async function addTagToContact(contactId: string, tags: string[]) {
  return ghlRequest({
    method: 'POST',
    path: `/contacts/${contactId}/tags`,
    body: { tags },
  })
}

// Remove tag from contact
export async function removeTagFromContact(contactId: string, tags: string[]) {
  return ghlRequest({
    method: 'DELETE',
    path: `/contacts/${contactId}/tags`,
    body: { tags },
  })
}
