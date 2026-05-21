import { supabase } from './supabase'

// Invoca la Edge Function `send-email` (Resend) en Supabase.
// No bloquea el flujo si falla — sólo loguea.
export async function sendEmail({ to, template, data }) {
  if (!supabase || !to) return { ok: false, skipped: true }
  try {
    const { data: res, error } = await supabase.functions.invoke('send-email', {
      body: { to, template, data },
    })
    if (error) throw error
    return res
  } catch (e) {
    console.warn('[email] enviar falló:', e?.message || e)
    return { ok: false, error: e?.message }
  }
}
