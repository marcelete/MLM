import { supabase } from './supabase'

// Registra una acción en audit_logs. No bloquea el flujo si falla.
// Uso típico:
//   logAction('cambiar_estado_orden', 'orden', orderId, { from: 'pending', to: 'shipped' })
export async function logAction(action, resourceType, resourceId, changes = null) {
  if (!supabase) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      resource_type: resourceType,
      resource_id: String(resourceId),
      changes,
    })
  } catch (e) {
    console.warn('[audit] log falló:', e?.message || e)
  }
}
