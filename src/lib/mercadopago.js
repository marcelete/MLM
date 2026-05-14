/**
 * MercadoPago Integration
 * Uses env vars: VITE_MP_PUBLIC_KEY
 * In production, preference creation should be done server-side (Supabase Edge Function)
 */

export const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || ''

export function isMercadoPagoAvailable() {
  return Boolean(MP_PUBLIC_KEY)
}

/**
 * Load the MercadoPago SDK script dynamically
 */
export function loadMercadoPagoSDK() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) {
      resolve(window.MercadoPago)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.onload = () => {
      if (window.MercadoPago) resolve(window.MercadoPago)
      else reject(new Error('MercadoPago SDK failed to load'))
    }
    script.onerror = () => reject(new Error('Failed to load MercadoPago script'))
    document.head.appendChild(script)
  })
}

/**
 * Initialize MercadoPago SDK
 */
export async function initMercadoPago() {
  if (!MP_PUBLIC_KEY) return null
  try {
    const MercadoPago = await loadMercadoPagoSDK()
    return new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' })
  } catch (e) {
    console.error('MercadoPago init error:', e)
    return null
  }
}

/**
 * Build a checkout preference payload
 * In production this should be called via an API / Edge Function that uses ACCESS_TOKEN
 */
export function buildPreferencePayload({ orderItems, customer, total, backUrls }) {
  return {
    items: orderItems.map((item) => ({
      title: `${item.product_name}${item.variant_desc ? ` (${item.variant_desc})` : ''}`,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: 'ARS',
    })),
    payer: {
      name: customer.name,
      email: customer.email,
      phone: { number: customer.phone },
    },
    back_urls: {
      success: backUrls?.success || `${window.location.origin}/checkout?status=success`,
      failure: backUrls?.failure || `${window.location.origin}/checkout?status=failure`,
      pending: backUrls?.pending || `${window.location.origin}/checkout?status=pending`,
    },
    auto_return: 'approved',
    statement_descriptor: 'EUREKA ROPA',
    external_reference: backUrls?.orderId || '',
  }
}

/**
 * Generate WhatsApp message URL for cash/transfer orders
 */
export function generateWhatsAppURL(orderDetails) {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000'

  const itemLines = orderDetails.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.product_name}${item.variant_desc ? ` (${item.variant_desc})` : ''} - $${item.unit_price.toLocaleString('es-AR')}`
    )
    .join('\n')

  const message = `Hola! Quiero realizar el siguiente pedido:\n\n${itemLines}\n\n*Método de pago:* ${orderDetails.paymentLabel}\n*Total:* $${orderDetails.total.toLocaleString('es-AR')}\n\n*Datos de entrega:*\nNombre: ${orderDetails.customer.name}\nTeléfono: ${orderDetails.customer.phone}\nDirección: ${orderDetails.customer.address}\n\nPor favor confirmen disponibilidad. Gracias!`

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
}
