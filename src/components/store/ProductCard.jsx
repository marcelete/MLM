import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { formatPrice, COLORS } from '../../data/products'
import { ColorSwatch } from './ColorSwatch'
import { useCart } from '../../contexts/CartContext'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [hoveredColor, setHoveredColor] = useState(null)

  // Get unique colors for this product (from variants or hardcoded)
  const productColors = product.hasVariants
    ? [...new Set(product.variants?.map((v) => v.color).filter(Boolean))]
    : product.color
    ? [product.color]
    : []

  const displayedImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80'

  const handleQuickAdd = (e) => {
    e.preventDefault()
    if (product.hasVariants) {
      // Navigate to product page for variant selection
      return
    }
    addItem(product, null, 1)
    toast.success(`${product.name} agregado al carrito`)
  }

  return (
    <Link to={`/producto/${product.slug}`} className="group block">
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="product-img-wrapper relative aspect-square bg-gray-100">
          <img
            src={displayedImage}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {product.featured && (
            <div className="absolute top-2 left-2">
              <span className="badge bg-brand-orange text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                <Star className="w-3 h-3" /> Destacado
              </span>
            </div>
          )}
          {/* Quick add button on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-brand-navy text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-navyLight transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.hasVariants ? 'Ver opciones' : 'Agregar al carrito'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Category badge */}
          {product.categories?.name && (
            <span className="text-xs text-brand-orange font-medium uppercase tracking-wide">
              {product.categories.name}
            </span>
          )}

          <h3 className="font-semibold text-gray-900 mt-1 group-hover:text-brand-navy transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.material && (
            <p className="text-xs text-gray-500 mt-0.5">Material: {product.material}</p>
          )}

          {/* Color swatches */}
          {productColors.length > 0 && (
            <div className="mt-3">
              <ColorSwatchRow
                colors={productColors}
                selectedColor={hoveredColor}
                maxShow={7}
              />
            </div>
          )}

          {/* Price */}
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-brand-navy">
                {formatPrice(product.base_price)}
              </span>
              <p className="text-xs text-gray-500">Efectivo / Transferencia</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function ColorSwatchRow({ colors, selectedColor, maxShow = 7 }) {
  const displayed = colors.slice(0, maxShow)
  const remaining = colors.length - maxShow

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {displayed.map((colorName) => (
        <ColorSwatch
          key={colorName}
          colorName={colorName}
          selected={selectedColor === colorName}
          size="sm"
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500">+{remaining}</span>
      )}
    </div>
  )
}
