// Supabase Edge Function: send-email
// Envía emails transaccionales vía Resend.dev
//
// Variables de entorno requeridas:
//   - RESEND_API_KEY: API key de https://resend.com/api-keys
//   - EMAIL_FROM: dirección remitente (ej: "MLM Ropa <pedidos@tudominio.com>"
//                 o "onboarding@resend.dev" si no verificaste dominio)
//
// Templates disponibles: compra_confirmada, pago_confirmado, orden_enviada, orden_entregada

// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const RESEND_API = 'https://api.resend.com/emails'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

const shortId = (id: string) => '#' + String(id).slice(-8).toUpperCase()

function renderTemplate(template: string, data: any): { subject: string; html: string } {
  const itemsHTML = (data.items || [])
    .map(
      (i: any) =>
        `<tr><td style="padding:6px 0">${i.product_name}${i.variant_desc ? ` <span style="color:#666">(${i.variant_desc})</span>` : ''} × ${i.quantity}</td><td style="text-align:right;padding:6px 0">${fmt(i.total_price)}</td></tr>`,
    )
    .join('')

  const wrap = (title: string, body: string) => `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#1a1a1a">
      <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #f97316">
        <h1 style="margin:0;font-size:22px;color:#0f172a">MLM Ropa de Trabajo</h1>
        <p style="margin:4px 0 0;color:#64748b;font-size:13px">Ambos, delantales y uniformes profesionales</p>
      </div>
      <div style="padding:20px 0">
        <h2 style="font-size:18px;margin-top:0">${title}</h2>
        ${body}
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:16px;font-size:12px;color:#94a3b8;text-align:center">
        Ante cualquier consulta, respondé este email o escribinos por WhatsApp.<br/>
        © MLM Ropa de Trabajo
      </div>
    </div>`

  const detalle = `
    <p>Número de pedido: <b>${shortId(data.order_id)}</b></p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <thead><tr style="border-bottom:1px solid #e2e8f0"><th style="text-align:left;padding:6px 0">Producto</th><th style="text-align:right;padding:6px 0">Subtotal</th></tr></thead>
      <tbody>${itemsHTML}</tbody>
      <tfoot><tr style="border-top:2px solid #1a1a1a"><td style="padding:10px 0;font-weight:bold">TOTAL</td><td style="text-align:right;padding:10px 0;font-weight:bold;font-size:16px">${fmt(data.total)}</td></tr></tfoot>
    </table>
    <p style="background:#fef3c7;padding:10px;border-radius:6px;margin:10px 0"><b>Método de pago:</b> ${data.payment_label || data.payment_method}</p>`

  switch (template) {
    case 'compra_confirmada':
      return {
        subject: `Recibimos tu pedido ${shortId(data.order_id)} - MLM`,
        html: wrap(
          `¡Hola ${data.customer_name?.split(' ')[0] || ''}! Gracias por tu compra 🎉`,
          `<p>Recibimos tu pedido y lo estamos procesando.</p>${detalle}${
            data.payment_method === 'transferencia'
              ? `<p>Para completar tu compra, transferí el monto total y avisanos por WhatsApp con el comprobante.</p>`
              : data.payment_method === 'efectivo'
                ? `<p>Te contactaremos a la brevedad para coordinar la entrega y el cobro en efectivo.</p>`
                : `<p>Estamos esperando la confirmación de tu pago. Te avisaremos apenas se acredite.</p>`
          }`,
        ),
      }
    case 'pago_confirmado':
      return {
        subject: `Pago confirmado - Pedido ${shortId(data.order_id)}`,
        html: wrap(
          `¡Pago confirmado! ✅`,
          `<p>Recibimos tu pago y ya estamos preparando tu pedido.</p>${detalle}<p>Te avisaremos cuando salga para envío.</p>`,
        ),
      }
    case 'orden_enviada':
      return {
        subject: `Tu pedido ${shortId(data.order_id)} está en camino 🚚`,
        html: wrap(
          `¡Tu pedido salió para envío! 📦`,
          `<p>Tu pedido <b>${shortId(data.order_id)}</b> ya está en camino.</p><p>Si elegiste entrega en CABA/GBA, te contactaremos antes de pasar para coordinar.</p>`,
        ),
      }
    case 'orden_entregada':
      return {
        subject: `¿Cómo te llegó tu pedido? - MLM`,
        html: wrap(
          `¡Pedido entregado! 🎉`,
          `<p>Esperamos que estés conforme con tu compra. Te invitamos a dejar una review para ayudar a otros clientes.</p><p style="text-align:center;margin:20px 0"><a href="${data.review_url || ''}" style="background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Dejar una opinión</a></p>`,
        ),
      }
    default:
      return { subject: 'Notificación MLM', html: wrap('Mensaje', `<p>${JSON.stringify(data)}</p>`) }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('EMAIL_FROM') || 'MLM Ropa <onboarding@resend.dev>'
    if (!apiKey) throw new Error('RESEND_API_KEY no configurado')

    const { to, template, data } = await req.json()
    if (!to || !template) throw new Error('Faltan campos: to, template')

    const { subject, html } = renderTemplate(template, data || {})

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Resend error')

    return new Response(JSON.stringify({ ok: true, id: json.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
