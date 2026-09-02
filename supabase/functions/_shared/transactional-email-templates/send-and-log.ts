import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './send-email.ts'

/**
 * Server-only. Sends a registered template through Lovable's managed email API
 * and records the outcome in `email_send_log` (app history — it never decides
 * the send result).
 */
export async function sendAndLogTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const logRow = async (status: string, errorMessage?: string) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: to,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('Failed to write email_send_log', { code: error.code, message: error.message })
    }
  }

  try {
    const result = await sendTemplateEmail(templateName, to, options)
    if (result.sent) {
      await logRow('sent')
    } else {
      await logRow('suppressed')
    }
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logRow('failed', message.slice(0, 1000))
    throw error
  }
}
