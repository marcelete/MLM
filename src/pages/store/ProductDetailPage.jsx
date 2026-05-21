import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Check, ChevronLeft, ChevronRight, MessageCircle, Truck, Shield } from 'lucide-react'
import Header from '../../components/store/Header'
import Footer from '../../components/store/Footer'
import CartDrawer from '../../components/store/CartDrawer'
import PricingTable from '../../components/store/PricingTable'
import ProductReviews from '../../components/store/ProductReviews'
import { ColorSwatch } from '../../components/store/ColorSwatch'
import { useProduct } from '../../hooks/useProducts'
import { useCart } from '../../contexts/CartContext'
import { trackProductView } from '../../lib/analytics'
import { formatPrice, SIZES, COLORS } from '../../data/products'
import toast from 'react-hot-toast'

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { product, loading } = useProduct(slug)
  const { addItem } = useCart()

  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [currentImage, setCurrentImage] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('efectivo')

  useEffect(() => {
    if (product) {
      trackProductView(product)
      // Set first available color
      if (product.hasVariants) {
        const colors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean))]
        if (colors.length > 0) setSelectedColor(colors[0])
        setSelectedModel('Hombre')
      }
    }
  }, [product])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-orange border-t-transparent rounded-full" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
            <Link to="/catalogo" className="mt-4 btn-primary inline-block">
              Ver catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Get unique variants data
  const availableColors = product.hasVariants
    ? [...new Set(product.variants?.map((v) => v.color).filter(Boolean))]
    : []
  const availableSizes = product.hasVariants
    ? [...new Set(product.variants?.map((v) => v.size).filter(Boolean))]
    : []
  const availableModels = product.hasVariants
    ? [...new Set(product.variants?.map((v) => v.model).filter(Boolean))]
    : []

  // Find matching variant
  const selectedVariant = product.hasVariants
    ? product.variants?.find(
        (v) => v.color === selectedColor && v.size === selectedSize && v.model === selectedModel
      )
    : null

  const isVariantValid = !product.hasVariants || (selectedColor && selectedSize && selectedModel)
  const stockQty = selectedVariant?.stock ?? (product.hasVariants ? null : 99)

  const handleAddToCart = () => {
    if (product.hasVariants && !isVariantValid) {
      toast.error('Por favor seleccioná color, talle y modelo')
      return
    }
    addItem(product, selectedVariant, quantity)
    toast.success(`${product.name} agregado al carrito`)
  }

  const images = product.images?.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80'
  ]

  const basePrice = product.base_price

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-brand-navy transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/catalogo" className="hover:text-brand-navy transition-colors">Catálogo</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={images[currentImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        i === currentImage ? 'border-brand-orange' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="space-y-6">
              <div>
                {product.material && (
                  <p className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-1">
                    Material: {product.material}
                  </p>
                )}
                <h1 className="text-3xl font-bold text-brand-navy">{product.name}</h1>
                <p className="text-gray-600 mt-3 leading-relaxed">{product.description}</p>
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-brand-navy">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="text-gray-500 text-sm">Efectivo / Transferencia</span>
                </div>
                {stockQty !== null && stockQty > 0 && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {stockQty > 5 ? 'En stock' : `Últimas ${stockQty} unidades`}
                  </p>
                )}
                {stockQty === 0 && (
                  <p className="text-sm text-red-600 mt-1">Sin stock en esta combinación</p>
                )}
              </div>

              {/* Color selector */}
              {availableColors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Color:{' '}
                    {selectedColor && <span className="text-brand-navy font-bold">{selectedColor}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((colorName) => (
                      <ColorSwatch
                        key={colorName}
                        colorName={colorName}
                        selected={selectedColor === colorName}
                        onClick={() => setSelectedColor(colorName)}
                        size="lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Model selector */}
              {availableModels.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Modelo:</p>
                  <div className="flex gap-2">
                    {availableModels.map((model) => (
                      <button
                        key={model}
                        onClick={() => setSelectedModel(model)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          selectedModel === model
                            ? 'border-brand-navy bg-brand-navy text-white'
                            : 'border-gray-300 text-gray-700 hover:border-brand-navy'
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {availableSizes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Talle:</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.filter((s) => availableSizes.includes(s)).map((size) => {
                      const hasStock = product.variants?.some(
                        (v) =>
                          v.size === size &&
                          (selectedColor ? v.color === selectedColor : true) &&
                          (selectedModel ? v.model === selectedModel : true) &&
                          v.stock > 0
                      )
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          disabled={!hasStock}
                          className={`w-12 h-12 rounded-lg border-2 text-sm font-semibold transition-colors ${
                            selectedSize === size
                              ? 'border-brand-navy bg-brand-navy text-white'
                              : hasStock
                              ? 'border-gray-300 text-gray-700 hover:border-brand-navy'
                              : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                  {product.talle && (
                    <p className="text-sm text-gray-500 mt-1">{product.talle}</p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Cantidad:</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors font-bold"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={stockQty === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Agregar al carrito
                </button>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=Hola! Quiero consultar sobre: ${product.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline flex items-center justify-center gap-2 px-4"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Truck className="w-4 h-4 text-brand-orange" />
                  Envíos a CABA y GBA
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="w-4 h-4 text-brand-orange" />
                  Calidad garantizada
                </div>
              </div>

              {/* Pricing table */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Precios según forma de pago:</p>
                <PricingTable
                  basePrice={basePrice * quantity}
                  selectedMethod={paymentMethod}
                  onSelect={setPaymentMethod}
                />
              </div>
            </div>
          </div>

          <ProductReviews productId={product.id} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
