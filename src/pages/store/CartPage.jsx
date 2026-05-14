import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'
import Header from '../../components/store/Header'
import Footer from '../../components/store/Footer'
import CartDrawer from '../../components/store/CartDrawer'
import { useCart } from '../../contexts/CartContext'
import { trackPageView } from '../../lib/analytics'
import { formatPrice } from '../../data/products'

export default function CartPage() {
  const { items, removeItem, updateQuantity, itemCount, subtotal, clearCart, getItemVariantDesc } = useCart()

  useEffect(() => {
    trackPageView('/carrito', 'Carrito - Eureka Ropa de Trabajo')
  }, [])

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />
        <main className="flex-1 pt-20 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
            <p className="text-gray-500 mt-2">Explorá nuestro catálogo y encontrá la ropa de trabajo ideal</p>
            <Link to="/catalogo" className="btn-primary inline-flex items-center gap-2 mt-6">
              Ver catálogo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-brand-navy">
              Carrito ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'})
            </h1>
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Vaciar carrito
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const variantDesc = getItemVariantDesc(item)
                const lineTotal = item.product.base_price * item.quantity

                return (
                  <div key={item.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4">
                    {/* Image */}
                    <Link to={`/producto/${item.product.slug}`} className="flex-shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=200&q=60'}
                          alt={item.product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/producto/${item.product.slug}`}
                          className="font-semibold text-gray-900 hover:text-brand-navy transition-colors text-sm sm:text-base"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {variantDesc && (
                        <p className="text-xs text-gray-500 mt-0.5 bg-gray-50 rounded px-2 py-0.5 inline-block mt-1">
                          {variantDesc}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        {/* Qty controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Reducir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="font-bold text-brand-navy">{formatPrice(lineTotal)}</span>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">{formatPrice(item.product.base_price)} c/u</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Link
                to="/catalogo"
                className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orangeDark transition-colors font-medium mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Continuar comprando
              </Link>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
                <h2 className="font-bold text-lg text-gray-900 mb-4">Resumen del pedido</h2>

                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.key} className="flex justify-between text-gray-600">
                      <span className="truncate pr-2">{item.product.name} ×{item.quantity}</span>
                      <span className="flex-shrink-0 font-medium">{formatPrice(item.product.base_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex justify-between items-center font-bold text-lg text-gray-900">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    * Los recargos según método de pago se calculan en el paso siguiente
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  <Link
                    to="/checkout"
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Ir al checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="text-xs text-gray-500 text-center">
                    Envíos a CABA y GBA • Pago seguro
                  </div>
                </div>

                {/* Payment methods mini */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Aceptamos</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Efectivo / Transferencia</span>
                      <span className="text-green-600 font-medium">Sin recargo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Débito / QR</span>
                      <span className="text-gray-500">+10%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crédito 3 cuotas</span>
                      <span className="text-gray-500">+20%</span>
                    </div>
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
