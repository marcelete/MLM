import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Truck, MessageCircle, Star, Stethoscope, UtensilsCrossed, GraduationCap } from 'lucide-react'
import Header from '../../components/store/Header'
import Footer from '../../components/store/Footer'
import ProductCard from '../../components/store/ProductCard'
import CartDrawer from '../../components/store/CartDrawer'
import { useProducts } from '../../hooks/useProducts'
import { trackPageView } from '../../lib/analytics'
import { formatPrice } from '../../data/products'

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000'

const USP_ITEMS = [
  {
    icon: Truck,
    title: 'Envíos a CABA y GBA',
    desc: 'Despacho dentro de las 48hs hábiles de confirmado el pago.',
  },
  {
    icon: ShieldCheck,
    title: 'Calidad garantizada',
    desc: 'Materiales seleccionados, costuras reforzadas para uso profesional.',
  },
  {
    icon: MessageCircle,
    title: 'Atención por WhatsApp',
    desc: 'Respondemos consultas de lunes a sábado de 9 a 20hs.',
  },
]

const CATEGORY_CARDS = [
  {
    to: '/catalogo?categoria=ambos',
    icon: Stethoscope,
    title: 'Ambos Profesionales',
    desc: 'Salud, limpieza y empresas. Arciel, 8 colores, tallas XS-XXXL.',
    color: 'bg-blue-600',
  },
  {
    to: '/catalogo?categoria=delantales',
    icon: UtensilsCrossed,
    title: 'Delantales de Cocina',
    desc: 'Resistentes y prácticos para gastronomía profesional.',
    color: 'bg-orange-500',
  },
  {
    to: '/catalogo?categoria=delantales',
    icon: GraduationCap,
    title: 'Delantales Docentes',
    desc: 'Para nivel inicial y primario, diseño clásico.',
    color: 'bg-teal-600',
  },
]

export default function HomePage() {
  const { data: featured, loading } = useProducts({ featured: true })

  useEffect(() => {
    trackPageView('/', 'Inicio - Eureka Ropa de Trabajo')
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className="relative bg-brand-navy text-white overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
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
                Ropa profesional para Argentina 🇦🇷
              </span>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-balance">
                Uniformes de trabajo
                <span className="block text-brand-orange">para profesionales</span>
              </h1>
              <p className="mt-5 text-lg text-gray-300 leading-relaxed max-w-xl">
                Ambos para salud y limpieza, delantales docentes y de cocina. Alta calidad, precios accesibles y envíos a toda CABA y GBA.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/catalogo" className="btn-primary inline-flex items-center justify-center gap-2">
                  Ver catálogo <ArrowRight className="w-4 h-4" />
                </Link>
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
          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full h-8 lg:h-12 fill-white" preserveAspectRatio="none">
              <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" />
            </svg>
          </div>
        </section>

        {/* USP Bar */}
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

        {/* Category Cards */}
        <section className="py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy text-center mb-2">
              Nuestras categorías
            </h2>
            <p className="text-gray-500 text-center mb-8">
              Encontrá la prenda ideal para cada industria y rol
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CATEGORY_CARDS.map(({ to, icon: Icon, title, desc, color }) => (
                <Link
                  key={title}
                  to={to}
                  className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow bg-white"
                >
                  <div className={`${color} h-32 flex items-center justify-center`}>
                    <Icon className="w-14 h-14 text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 group-hover:text-brand-navy transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{desc}</p>
                    <span className="text-brand-orange text-sm font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver productos <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy">
                  Productos destacados
                </h2>
                <p className="text-gray-500 mt-1">Los más buscados por nuestros clientes</p>
              </div>
              <Link
                to="/catalogo"
                className="hidden sm:flex items-center gap-1 text-brand-orange font-semibold hover:text-brand-orangeDark transition-colors text-sm"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link to="/catalogo" className="btn-outline inline-flex items-center gap-2">
                Ver todo el catálogo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing highlight */}
        <section className="py-14 bg-brand-navy text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">
              Precios transparentes según tu forma de pago
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Los precios publicados son para efectivo y transferencia. Conocé los valores para cada método.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Efectivo / Transferencia', pct: 'Sin recargo', highlight: true },
                { label: 'Débito / QR MercadoPago', pct: '+10%', highlight: false },
                { label: 'Crédito 3 cuotas s/i', pct: '+20%', highlight: false },
              ].map(({ label, pct, highlight }) => (
                <div
                  key={label}
                  className={`rounded-xl p-5 ${
                    highlight ? 'bg-brand-orange' : 'bg-white/10'
                  }`}
                >
                  <p className="font-bold text-xl">{pct}</p>
                  <p className="text-sm mt-1 text-white/80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-navy text-center mb-8">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'María González',
                  role: 'Enfermera, Hospital Italiano',
                  text: 'Excelente calidad en los ambos. El Arciel es muy cómodo para trabajar largas jornadas. Lo recomiendo 100%.',
                },
                {
                  name: 'Carlos Rodríguez',
                  role: 'Chef, Restaurante BA',
                  text: 'Los delantales de cocina son resistentes y fáciles de lavar. Compré 5 para todo mi equipo y quedamos muy conformes.',
                },
                {
                  name: 'Laura Martínez',
                  role: 'Maestra jardinera, CABA',
                  text: 'El delantal docente es hermoso, bien cortado y el azul es muy lindo. Llegó rápido y bien embalado.',
                },
              ].map(({ name, role, text }) => (
                <div key={name} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed italic">"{text}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-bold">
                      {name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-brand-orange">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h2 className="text-2xl lg:text-3xl font-bold">¿Necesitás uniforme para tu equipo?</h2>
            <p className="mt-3 text-orange-100 text-lg">
              Cotizá pedidos mayoristas y uniformes personalizados para tu empresa o institución.
            </p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Hola! Quiero consultar sobre pedidos mayoristas de uniformes`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-white text-brand-orange font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Consultar por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
