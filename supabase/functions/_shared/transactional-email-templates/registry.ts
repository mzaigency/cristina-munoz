/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: any) => string)
}

import { template as bookingConfirmation } from './booking-confirmation.tsx'
import { template as bookingReminder24h } from './booking-reminder-24h.tsx'
import { template as tenantWelcome } from './tenant-welcome.tsx'
import { template as bookingCancelled } from './booking-cancelled.tsx'
import { template as bookingUpdated } from './booking-updated.tsx'
import { template as waitlistSlotAvailable } from './waitlist-slot-available.tsx'
import { template as subscriptionPaymentIssue } from './subscription-payment-issue.tsx'
import { template as clientWelcome } from './client-welcome.tsx'
import { template as bookingOtp } from './booking-otp.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'booking-reminder-24h': bookingReminder24h,
  'tenant-welcome': tenantWelcome,
  'booking-cancelled': bookingCancelled,
  'booking-updated': bookingUpdated,
  'waitlist-slot-available': waitlistSlotAvailable,
  'subscription-payment-issue': subscriptionPaymentIssue,
  'client-welcome': clientWelcome,
  'booking-otp': bookingOtp,
}
