import { jsPDF } from 'jspdf'
import { PAYMENT_LABELS } from '../data/products'

const BRAND_NAME = 'MLM ROPA DE TRABAJO'
const BRAND_SUBTITLE = 'Ambos, delantales y uniformes profesionales'

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n) || 0)
const shortId = (id) => '#' + String(id).slice(-8).toUpperCase()
const fechaCorta = (d) => new Date(d).toLocaleDateString('es-AR')
const fechaLarga = (d) => new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })

export function generarTicketPDF(order, items = [], customer = null) {
  const c = customer || order.customers || {}
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  let y = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(BRAND_NAME, W / 2, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(BRAND_SUBTITLE, W / 2, y, { align: 'center' })
  y += 8
  doc.setLineWidth(0.4)
  doc.line(15, y, W - 15, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`Ticket ${shortId(order.id)}`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Fecha: ${fechaLarga(order.created_at)}`, W - 15, y, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CLIENTE', 15, y); y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nombre: ${c.name || '-'}`, 15, y); y += 5
  doc.text(`Teléfono: ${c.phone || '-'}`, 15, y); y += 5
  doc.text(`Email: ${c.email || '-'}`, 15, y); y += 5
  if (c.address) { doc.text(`Dirección: ${c.address}`, 15, y); y += 5 }
  if (c.city) { doc.text(`Localidad: ${c.city}`, 15, y); y += 5 }
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('PRODUCTOS', 15, y); y += 5
  doc.setLineWidth(0.2)
  doc.line(15, y, W - 15, y); y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Producto', 15, y)
  doc.text('Cant.', 130, y, { align: 'right' })
  doc.text('Precio', 160, y, { align: 'right' })
  doc.text('Subtotal', W - 15, y, { align: 'right' })
  y += 4
  doc.line(15, y, W - 15, y); y += 4

  doc.setFont('helvetica', 'normal')
  if (!items.length) {
    doc.text('(Sin detalle de items)', 15, y); y += 5
  } else {
    items.forEach((it) => {
      if (y > 260) { doc.addPage(); y = 20 }
      const nombre = it.product_name || 'Producto'
      const variante = it.variant_desc ? ` (${it.variant_desc})` : ''
      const linea = nombre + variante
      const wrap = doc.splitTextToSize(linea, 110)
      doc.text(wrap, 15, y)
      doc.text(String(it.quantity), 130, y, { align: 'right' })
      doc.text(fmt(it.unit_price), 160, y, { align: 'right' })
      doc.text(fmt(it.total_price), W - 15, y, { align: 'right' })
      y += Math.max(5, wrap.length * 4.5)
    })
  }
  y += 2
  doc.line(15, y, W - 15, y); y += 6

  const tot = Number(order.total) || 0
  const sub = Number(order.subtotal) || tot
  const recargo = tot - sub
  doc.setFontSize(10)
  doc.text('Subtotal:', 140, y); doc.text(fmt(sub), W - 15, y, { align: 'right' }); y += 5
  if (recargo > 0.5) {
    doc.text(`Recargo (${order.payment_surcharge_pct || 0}%):`, 140, y)
    doc.text('+' + fmt(recargo), W - 15, y, { align: 'right' }); y += 5
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('TOTAL:', 140, y)
  doc.text(fmt(tot), W - 15, y, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Método de pago: ${PAYMENT_LABELS[order.payment_method] || order.payment_method}`, 15, y); y += 5
  doc.text(`Estado: ${order.status}`, 15, y); y += 5
  if (order.notes) {
    y += 3
    doc.setFont('helvetica', 'bold'); doc.text('Notas:', 15, y); y += 5
    doc.setFont('helvetica', 'normal')
    const wrap = doc.splitTextToSize(order.notes, W - 30)
    doc.text(wrap, 15, y)
    y += wrap.length * 5
  }

  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Este ticket debe acompañar el pedido. Gracias por tu compra.', W / 2, 285, { align: 'center' })

  doc.save(`ticket-${shortId(order.id).replace('#', '')}.pdf`)
}

export function generarEtiquetaPDF(order, customer = null) {
  const c = customer || order.customers || {}
  // Etiqueta 10x15 cm (formato típico de impresora de etiquetas)
  const doc = new jsPDF({ unit: 'mm', format: [100, 150], orientation: 'portrait' })
  const W = 100
  let y = 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(BRAND_NAME, W / 2, y, { align: 'center' })
  y += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Etiqueta de envío', W / 2, y, { align: 'center' })
  y += 4
  doc.setLineWidth(0.5)
  doc.line(5, y, W - 5, y)
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TICKET:', 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(shortId(order.id), 25, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('FECHA:', 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(fechaCorta(order.created_at), 25, y)
  y += 8

  doc.setLineWidth(0.3)
  doc.line(5, y, W - 5, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('ENVIAR A:', 5, y); y += 6
  doc.setFontSize(13)
  doc.text(c.name || '-', 5, y); y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  if (c.phone) { doc.text(`Tel: ${c.phone}`, 5, y); y += 6 }
  if (c.address) {
    const wrap = doc.splitTextToSize(c.address, W - 10)
    doc.text(wrap, 5, y); y += wrap.length * 6
  }
  if (c.city) { doc.text(c.city, 5, y); y += 6 }
  y += 4

  doc.setLineWidth(0.3)
  doc.line(5, y, W - 5, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Método de pago: ${PAYMENT_LABELS[order.payment_method] || order.payment_method}`, 5, y)
  y += 5
  doc.text(`Total: ${fmt(order.total)}`, 5, y)
  y += 8

  // Checkboxes Frágil / Urgente
  doc.setLineWidth(0.4)
  doc.rect(8, y, 4, 4)
  doc.setFont('helvetica', 'normal')
  doc.text('Frágil', 14, y + 3.2)
  doc.rect(40, y, 4, 4)
  doc.text('Urgente', 46, y + 3.2)

  doc.save(`etiqueta-${shortId(order.id).replace('#', '')}.pdf`)
}
