import React from 'react'
import { Link } from 'react-router-dom'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, itemCount, subtotal, formatPrice, getItemVariantDesc } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 cart-backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-brand-navy text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-semibold text-lg">
              Carrito
              {itemCount > 0 && (
                <span className="ml-2 bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 py-16">
              <ShoppingBag className="w-16 h-16 opacity-30" />
              <div className="text-center">
                <p className="font-medium text-gray-600">Tu carrito está vacío</p>
                <p className="text-sm mt-1">Explorá nuestro catálogo</p>
              </div>
              <button
                onClick={closeCart}
                className="btn-primary text-sm px-6 py-2.5 mt-2"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="px-5 space-y-4">
              {items.map((item) => {
                const variantDesc = getItemVariantDesc(item)
                const itemTotal = item.product.base_price * item.quantity

                return (
                  <li key={item.key} className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
                    {/* Product image */}
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=200&q=60'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      {variantDesc && (
                        <p className="text-xs text-gray-500 mt-0.5">{variantDesc}</p>
                      )}
                      <p className="text-sm font-bold text-brand-navy mt-1">
                        {formatPrice(itemTotal)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'})</span>
              <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-500">Los recargos por método de pago se calculan en el checkout.</p>

            <Link
              to="/checkout"
              onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2 text-center"
            >
              Ir al checkout
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/carrito"
              onClick={closeCart}
              className="btn-outline w-full text-center text-sm block"
            >
              Ver carrito completo
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
