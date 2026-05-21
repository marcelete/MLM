// Supabase Edge Function: mercadopago-webhook
// Recibe los webhooks de Mercado Pago y actualiza el estado de la orden.
//
// Variables de entorno requeridas:
//   - MP_ACCESS_TOKEN: access token de Mercado Pago (Producción)
//   - SUPABASE_URL: ya viene cargado por Supabase
//   - SUPABASE_SERVICE_ROLE_KEY: ya viene cargado por Supabase
//
// Configuración en MP:
//   En https://www.mercadopago.com.ar/developers → tu app → Webhooks
//   URL = https://<tu-proyecto>.supabase.co/functions/v1/mercadopago-webhook
//   Eventos = payment

// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_API = 'https://api.mercadopago.com'

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('ok')
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json()
    // MP envía: { id, topic, type, data: { id }, action }
    const topic = body.topic || body.type
    const paymentId = body.data?.id || body.resource?.split('/').pop()

    if (topic !== 'payment' || !paymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }))
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN no configurado')

    // 1. Pedir info del pago a MP
    const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })
    if (!mpRes.ok) throw new Error('Error consultando MP: ' + mpRes.status)
    const payment: any = await mpRes.json()

    // external_reference debería ser el order_id que pusimos al crear la preferencia
    const orderId = payment.external_reference
    const status = payment.status // approved, pending, rejected, refunded, cancelled

    // 2. Mapear a nuestro estado
    let nuevoEstado: string | null = null
    if (status === 'approved') nuevoEstado = 'confirmed'
    else if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'cancelled'
    // pending/in_process: dejamos como está

    // 3. Conectar a Supabase con service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (orderId && nuevoEstado) {
      await supabase
        .from('orders')
        .update({ status: nuevoEstado, mp_payment_id: String(paymentId) })
        .eq('id', orderId)
    }

    // 4. Log del evento (si existe la tabla mercadopago_eventos)
    await supabase.from('mercadopago_eventos').insert({
      orden_id: orderId,
      evento_tipo: `payment.${status}`,
      datos_evento: payment,
    }).then(() => {}, () => {}) // silencioso si tabla no existe

    return new Response(JSON.stringify({ ok: true, order_id: orderId, status }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('Webhook error:', e)
    // Devolvemos 200 igual para que MP no reintente eternamente
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
