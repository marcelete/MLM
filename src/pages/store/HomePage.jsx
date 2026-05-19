import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  MessageCircle,
  Package,
  CheckCircle,
  Banknote,
  Smartphone,
  CreditCard,
  MapPin,
  Mail,
} from 'lucide-react'
import Header from '../../components/store/Header'
import Footer from '../../components/store/Footer'
import ProductCard from '../../components/store/ProductCard'
import CartDrawer from '../../components/store/CartDrawer'
import { useProducts } from '../../hooks/useProducts'
import { trackPageView } from '../../lib/analytics'
import { categories as staticCategories } from '../../data/products'

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000'

const USP_ITEMS = [
  {
    icon: Package,
    title: 'Directo del fabricante',
    desc: 'Sin intermediarios. Precios mayoristas para todos.',
  },
  {
    icon: CheckCircle,
    title: 'Sin stock mínimo',
    desc: 'Comprá desde una unidad, sin cantidad mínima.',
  },
  {
    icon: MapPin,
    title: 'Entrega en CABA',
    desc: 'Despacho dentro de las 48hs hábiles de confirmado el pago.',
  },
]

const PAYMENT_ROWS = [
  {
    icon: Banknote,
    label: 'Efectivo / Transferencia',
    surcharge: 'Precio base',
    highlight: true,
  },
  {
    icon: Smartphone,
    label: 'Débito / QR MercadoPago',
    surcharge: '+10%',
    highlight: false,
  },
  {
    icon: CreditCard,
    label: 'Tarjeta de crédito (3 cuotas s/i)',
    surcharge: '+20%',
    highlight: false,
  },
]

const HOW_TO_BUY = [
  {
    step: 1,
    title: 'Elegí tu producto',
    desc: 'Seleccioná el uniforme, talle y color que necesitás desde el catálogo.',
  },
  {
    step: 2,
    title: 'Consultanos o completá el pedido',
    desc: 'Escribinos por WhatsApp o hacé el pedido directamente desde la tienda.',
  },
  {
    step: 3,
    title: 'Coordinamos pago y entrega',
    desc: 'Te confirmamos el pago por el medio que prefieras y coordinamos el envío a tu domicilio.',
  },
]

export default function HomePage() {
  const { data: allProducts, loading } = useProducts({})
  const [activeCategory, setActiveCategory] = useState('todos')

  useEffect(() => {
    trackPageView('/', 'MLM | Uniformes y Ropa de Trabajo Profesional')
  }, [])

  const categoryFilters = [
    { slug: 'todos', label: 'Todos' },
    ...staticCategories.map((c) => ({ slug: c.slug, label: c.name })),
  ]

  const filteredProducts =
    activeCategory === 'todos'
      ? allProducts
      : allProducts.filter((p) => {
          // Support both Supabase (category_id = uuid) and static data (category_id = 'cat-ambos')
          if (p.categories?.slug) return p.categories.slug === activeCategory
          // static data: match via category_id
          const cat = staticCategories.find((c) => c.slug === activeCategory)
          return cat ? p.category_id === cat.id : true
        })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* ── HERO ── */}
        <section className="relative bg-brand-navy text-white overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1584515933487-779824d29309?w=1600&q=60')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="max-w-2xl">
              <span className="inline-block bg-brand-orange/20 text-brand-orange text-sm font-semibold px-3 py-1.5 rounded-full mb-4">
                Fabricante en Argentina
              </span>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
                Uniformes profesionales
                <span className="block text-brand-orange">directos del fabricante</span>
              </h1>
              <p className="mt-5 text-lg text-gray-300 leading-relaxed max-w-xl">
                Ambos, delantales y ropa de trabajo de calidad para salud, limpieza y gastronomía.
                Envíos a toda CABA.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="#productos"
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  Ver productos <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=Hola! Quiero consultar sobre los uniformes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand-navy transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full h-8 lg:h-12 fill-white" preserveAspectRatio="none">
              <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" />
            </svg>
          </div>
        </section>

        {/* ── USPs BAR ── */}
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {USP_ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-brand-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                    <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATALOG SECTION ── */}
        <section id="productos" className="py-14 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy">Nuestros productos</h2>
              <p className="text-gray-500 mt-1">Ropa de trabajo de calidad, sin stock mínimo</p>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeCategory === cat.slug
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-navy hover:text-brand-navy'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rounded-xl overflow-hidden">
                    <div className="skeleton aspect-square" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-4 rounded w-3/4" />
                      <div className="skeleton h-3 rounded w-1/2" />
                      <div className="skeleton h-6 rounded w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay productos en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── HOW TO BUY ── */}
        <section className="py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy mb-2">¿Cómo comprar?</h2>
            <p className="text-gray-500 mb-10">Simple y sin complicaciones</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {HOW_TO_BUY.map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-orange text-white text-xl font-extrabold flex items-center justify-center mb-4 shadow-md">
                    {step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PAYMENT METHODS ── */}
        <section className="py-14 bg-brand-navy text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-2">
              Formas de pago
            </h2>
            <p className="text-gray-300 text-center mb-8">
              Los precios publicados son para efectivo y transferencia.
            </p>
            <div className="space-y-3">
              {PAYMENT_ROWS.map(({ icon: Icon, label, surcharge, highlight }) => (
                <div
                  key={label}
                  className={`flex items-center gap-4 rounded-xl px-5 py-4 ${
                    highlight ? 'bg-brand-orange' : 'bg-white/10'
                  }`}
                >
                  <Icon className="w-6 h-6 flex-shrink-0 text-white" />
                  <span className="flex-1 font-medium text-white">{label}</span>
                  <span className="font-bold text-white text-lg">{surcharge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section className="py-14 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy mb-2">Contacto</h2>
            <p className="text-gray-500 mb-8">
              Hacemos envíos a toda CABA. Respondemos de lunes a sábado de 9 a 20hs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`https://wa.me/${WA_NUMBER}?text=Hola! Quiero consultar sobre los uniformes`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Escribir por WhatsApp
              </a>
              <a
                href="mailto:info@mlm.com.ar"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-navy font-semibold transition-colors"
              >
                <Mail className="w-5 h-5" />
                info@mlm.com.ar
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
              <MapPin className="w-4 h-4 text-brand-orange" />
              Ciudad Autónoma de Buenos Aires, Argentina
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
