import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, MessageCircle, CreditCard, Banknote, Smartphone, AlertCircle } from 'lucide-react'
import Header from '../../components/store/Header'
import Footer from '../../components/store/Footer'
import CartDrawer from '../../components/store/CartDrawer'
import PricingTable from '../../components/store/PricingTable'
import { useCart } from '../../contexts/CartContext'
import { trackPageView, trackCheckoutStarted, trackCheckoutCompleted, markCheckoutStarted, markCheckoutCompleted } from '../../lib/analytics'
import { formatPrice, PAYMENT_LABELS, PAYMENT_SURCHARGES, getPriceForMethod } from '../../data/products'
import { generateWhatsAppURL } from '../../lib/mercadopago'
import { supabase } from '../../lib/supabase'
import { sendEmail } from '../../lib/email'
import toast from 'react-hot-toast'

const STEPS = ['Datos', 'Pago', 'Confirmar']

function validateForm(data) {
  const errors = {}
  if (!data.name?.trim()) errors.name = 'El nombre es requerido'
  if (!data.email?.trim() || !/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Email inválido'
  if (!data.phone?.trim()) errors.phone = 'El teléfono es requerido'
  if (!data.address?.trim()) errors.address = 'La dirección es requerida'
  return errors
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, subtotal, clearCart, getItemVariantDesc, formatPrice: cartFormatPrice } = useCart()

  const [step, setStep] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const total = getPriceForMethod(subtotal, paymentMethod)
  const surcharge = PAYMENT_SURCHARGES[paymentMethod]

  useEffect(() => {
    trackPageView('/checkout', 'Checkout - MLM Ropa de Trabajo')
    if (items.length > 0) {
      trackCheckoutStarted(items, subtotal)
      markCheckoutStarted(items)
    }
  }, [])

  // Handle MercadoPago return
  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success') {
      setOrderComplete(true)
      markCheckoutCompleted()
      clearCart()
      toast.success('¡Pago exitoso! Gracias por tu compra.')
    } else if (status === 'failure') {
      toast.error('El pago no se pudo procesar. Intentá de nuevo.')
    }
  }, [])

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />
        <main className="flex-1 pt-20 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
            <Link to="/catalogo" className="btn-primary inline-flex items-center gap-2 mt-4">
              Ver catálogo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">¡Pedido confirmado!</h1>
            {orderId && <p className="text-gray-500 mt-1">Pedido #{orderId.slice(-8).toUpperCase()}</p>}
            <p className="text-gray-600 mt-3">
              Te enviaremos los detalles a tu email. Ante cualquier consulta, contactanos por WhatsApp.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="btn-primary">
                Volver al inicio
              </Link>
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }))
  }

  const handleNextStep = () => {
    if (step === 0) {
      const errs = validateForm(form)
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handlePlaceOrder = async () => {
    setSubmitting(true)
    try {
      // Build order items
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        product_name: item.product.name,
        variant_desc: getItemVariantDesc(item),
        quantity: item.quantity,
        unit_price: getPriceForMethod(item.product.base_price, paymentMethod),
        total_price: getPriceForMethod(item.product.base_price * item.quantity, paymentMethod),
      }))

      if (supabase) {
        // 1. Upsert customer
        let customerId = null
        const { data: customer, error: custErr } = await supabase
          .from('customers')
          .upsert(
            { name: form.name, email: form.email, phone: form.phone, address: form.address, city: 'CABA' },
            { onConflict: 'email' }
          )
          .select('id')
          .single()

        if (!custErr && customer) customerId = customer.id

        // 2. Create order
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            status: 'pending',
            subtotal,
            payment_method: paymentMethod,
            payment_surcharge_pct: surcharge * 100,
            total,
            notes: form.notes,
          })
          .select('id')
          .single()

        if (orderErr) throw orderErr

        // 3. Create order items
        const { error: itemsErr } = await supabase.from('order_items').insert(
          orderItems.map((oi) => ({ ...oi, order_id: order.id }))
        )
        if (itemsErr) throw itemsErr

        // Decrement stock for each item
        for (const item of items) {
          if (item.variant?.id) {
            await supabase.rpc('decrement_stock', {
              variant_id: item.variant.id,
              qty: item.quantity,
            })
          }
        }

        setOrderId(order.id)
        trackCheckoutCompleted(order.id, total, paymentMethod)

        // Email de confirmación (no bloquea el flujo si falla)
        sendEmail({
          to: form.email,
          template: 'compra_confirmada',
          data: {
            order_id: order.id,
            customer_name: form.name,
            items: orderItems,
            total,
            payment_method: paymentMethod,
            payment_label: PAYMENT_LABELS[paymentMethod],
          },
        })
      } else {
        // No Supabase - just generate a local ID
        const localId = `LOCAL-${Date.now()}`
        setOrderId(localId)
        trackCheckoutCompleted(localId, total, paymentMethod)
      }

      // For cash/transfer: redirect to WhatsApp
      if (paymentMethod === 'efectivo' || paymentMethod === 'transferencia') {
        const waURL = generateWhatsAppURL({
          items: orderItems,
          customer: form,
          total,
          paymentLabel: PAYMENT_LABELS[paymentMethod],
        })
        markCheckoutCompleted()
        clearCart()
        setOrderComplete(true)
        window.open(waURL, '_blank')
      } else {
        // For card/debit: would redirect to MercadoPago
        // For now, show success
        markCheckoutCompleted()
        clearCart()
        setOrderComplete(true)
        toast.success('¡Pedido creado! Serás redirigido a MercadoPago.')
      }
    } catch (e) {
      console.error('Checkout error:', e)
      toast.error('Error al procesar el pedido. Por favor contactanos por WhatsApp.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Header */}
        <div className="bg-brand-navy text-white py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h1 className="text-xl font-bold mb-4">Checkout</h1>
            {/* Steps */}
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        i < step
                          ? 'bg-green-500 text-white'
                          : i === step
                          ? 'bg-brand-orange text-white'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {i < step ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        i === step ? 'text-white' : 'text-white/60'
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-500' : 'bg-white/20'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main form area */}
            <div className="lg:col-span-2">
              {/* Step 0: Customer info */}
              {step === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-5">Datos de entrega</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="Ej: María González"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleFormChange}
                          className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                          placeholder="tu@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleFormChange}
                          className={`input-field ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                          placeholder="11 XXXX-XXXX"
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección de entrega (CABA) *
                      </label>
                      <input
                        name="address"
                        value={form.address}
                        onChange={handleFormChange}
                        className={`input-field ${errors.address ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="Calle, número, piso/depto"
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      <p className="text-xs text-gray-500 mt-1">Envíos disponibles a CABA y GBA</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleFormChange}
                        rows={2}
                        className="input-field resize-none"
                        placeholder="Indicaciones de entrega, referencias, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Payment method */}
              {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-bold text-lg text-gray-900 mb-5">Método de pago</h2>
                  <PricingTable
                    basePrice={subtotal}
                    selectedMethod={paymentMethod}
                    onSelect={setPaymentMethod}
                  />
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Efectivo / Transferencia:</strong> Al confirmar el pedido, te enviaremos un mensaje por WhatsApp con los datos para el pago.
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Débito / Crédito:</strong> Serás redirigido a MercadoPago para completar el pago de forma segura.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Confirm */}
              {step === 2 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                  <h2 className="font-bold text-lg text-gray-900">Confirmar pedido</h2>

                  {/* Customer details */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
                    <p className="font-semibold text-gray-700 mb-2">Datos de entrega</p>
                    <p><span className="text-gray-500">Nombre:</span> {form.name}</p>
                    <p><span className="text-gray-500">Email:</span> {form.email}</p>
                    <p><span className="text-gray-500">Teléfono:</span> {form.phone}</p>
                    <p><span className="text-gray-500">Dirección:</span> {form.address}</p>
                    {form.notes && <p><span className="text-gray-500">Notas:</span> {form.notes}</p>}
                  </div>

                  {/* Payment method */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-gray-700 mb-1">Método de pago</p>
                    <p>{PAYMENT_LABELS[paymentMethod]}</p>
                    {surcharge > 0 && (
                      <p className="text-orange-600 text-xs mt-0.5">
                        Recargo del {(surcharge * 100).toFixed(0)}% aplicado
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="font-semibold text-gray-700 text-sm mb-2">Productos</p>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const varDesc = getItemVariantDesc(item)
                        return (
                          <div key={item.key} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.product.name} {varDesc && `(${varDesc})`} ×{item.quantity}
                            </span>
                            <span className="font-medium">
                              {formatPrice(getPriceForMethod(item.product.base_price * item.quantity, paymentMethod))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="font-bold text-2xl text-brand-navy">{formatPrice(total)}</span>
                  </div>

                  {(paymentMethod === 'efectivo' || paymentMethod === 'transferencia') && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                      <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Al confirmar, te abriremos WhatsApp con el resumen del pedido para coordinar el pago.</span>
                    </div>
                  )}

                  {(paymentMethod === 'debito' || paymentMethod === 'credito') && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Al confirmar, serás redirigido a MercadoPago para completar el pago.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-4">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="btn-outline flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="btn-primary flex items-center gap-2 ml-auto"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (paymentMethod === 'efectivo' || paymentMethod === 'transferencia') ? (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Confirmar por WhatsApp
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pagar con MercadoPago
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Tu pedido</h3>
                <div className="space-y-3">
                  {items.map((item) => {
                    const varDesc = getItemVariantDesc(item)
                    return (
                      <div key={item.key} className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=100&q=60'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{item.product.name}</p>
                          {varDesc && <p className="text-xs text-gray-500 mt-0.5">{varDesc}</p>}
                          <p className="text-xs text-brand-navy font-bold mt-0.5">
                            {formatPrice(item.product.base_price)} ×{item.quantity}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {surcharge > 0 && (
                    <div className="flex justify-between text-orange-600 text-xs">
                      <span>Recargo {PAYMENT_LABELS[paymentMethod]}</span>
                      <span>+{formatPrice(total - subtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 text-base mt-1 pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
