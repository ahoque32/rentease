import { Resend } from 'resend'

const FROM_EMAIL = 'RentEase <noreply@rentease.app>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Resend error:', error)
      throw new Error(error.message)
    }
    return data
  } catch (err) {
    console.error('Failed to send email:', err)
    throw err
  }
}

export function rentReminderEmail(tenantName: string, amount: number, dueDate: string, paymentLink: string) {
  return {
    subject: `Rent Reminder - $${amount} due on ${dueDate}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Rent Reminder</h2>
        <p>Hi ${tenantName},</p>
        <p>This is a reminder that your rent payment of <strong>$${amount.toFixed(2)}</strong> is due on <strong>${dueDate}</strong>.</p>
        <a href="${paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Pay Now</a>
        <p style="color: #6b7280; font-size: 14px;">Thank you for being a great tenant!</p>
      </div>
    `,
  }
}

export function paymentReceiptEmail(tenantName: string, amount: number, date: string, propertyName: string) {
  return {
    subject: `Payment Receipt - $${amount} received`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Received</h2>
        <p>Hi ${tenantName},</p>
        <p>We've received your payment of <strong>$${amount.toFixed(2)}</strong> on ${date}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Property</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${propertyName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${date}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">This is your receipt. No further action needed.</p>
      </div>
    `,
  }
}

export function leaseExpiryEmail(tenantName: string, propertyName: string, endDate: string) {
  return {
    subject: `Lease Expiry Reminder - ${propertyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Lease Expiry Notice</h2>
        <p>Hi ${tenantName},</p>
        <p>Your lease for <strong>${propertyName}</strong> is set to expire on <strong>${endDate}</strong>.</p>
        <p>Please contact your landlord to discuss renewal options.</p>
        <p style="color: #6b7280; font-size: 14px;">— RentEase</p>
      </div>
    `,
  }
}

export function overdueRentEmail(tenantName: string, amount: number, dueDate: string, paymentLink: string) {
  return {
    subject: `⚠️ Overdue Rent - $${amount} was due on ${dueDate}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Overdue Rent Notice</h2>
        <p>Hi ${tenantName},</p>
        <p>Your rent payment of <strong>$${amount.toFixed(2)}</strong> was due on <strong>${dueDate}</strong> and has not been received.</p>
        <p>Please make your payment as soon as possible to avoid late fees.</p>
        <a href="${paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Pay Now</a>
        <p style="color: #6b7280; font-size: 14px;">If you've already made this payment, please disregard this notice.</p>
      </div>
    `,
  }
}
