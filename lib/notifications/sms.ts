import { ghlRequest } from '@/lib/ghl/client'

interface SendSMSOptions {
  contactId: string
  message: string
}

export async function sendSMS({ contactId, message }: SendSMSOptions) {
  try {
    const response = await ghlRequest<{ messageId: string }>({
      method: 'POST',
      path: '/conversations/messages',
      body: {
        type: 'SMS',
        contactId,
        message,
      },
    })
    return response
  } catch (err) {
    console.error('Failed to send SMS via GHL:', err)
    throw err
  }
}

export function rentDueReminderSMS(tenantName: string, amount: number, dueDate: string) {
  return `Hi ${tenantName}, your rent of $${amount.toFixed(2)} is due on ${dueDate}. Pay online at your tenant portal. - RentEase`
}

export function overdueAlertSMS(tenantName: string, amount: number, dueDate: string) {
  return `Hi ${tenantName}, your rent of $${amount.toFixed(2)} was due on ${dueDate} and is now overdue. Please pay ASAP to avoid late fees. - RentEase`
}

export function emergencyMaintenanceSMS(tenantName: string, requestTitle: string) {
  return `Hi ${tenantName}, we received your emergency maintenance request: "${requestTitle}". We're working on it ASAP. - RentEase`
}
