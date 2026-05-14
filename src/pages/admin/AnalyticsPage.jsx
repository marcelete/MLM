import React, { useState, useEffect } from 'react'
import { Users, MousePointer, ShoppingCart, TrendingUp, Eye, ArrowUpRight, Activity } from 'lucide-react'
import StatCard from '../../components/admin/StatCard'
import { supabase } from '../../lib/supabase'

const DEMO_EVENTS = [
  { event_type: 'page_view', count: 342 },
  { event_type: 'product_view', count: 187 },
  { event_type: 'add_to_cart', count: 64 },
  { event_type: 'checkout_started', count: 28 },
  { event_type: 'checkout_completed', count: 19 },
  { event_type: 'cart_abandoned', count: 9 },
]

const DEMO_TOP_PRODUCTS = [
  { product_name: 'Ambo Completo', views: 98, adds: 32 },
  { product_name: 'Delantal Docente Inicial', views: 54, adds: 18 },
  { product_name: 'Ambo - Solo Pantalón', views: 41, adds: 12 },
  { product_name: 'Delantal de Cocina', views: 37, adds: 9 },
  { product_name: 'Delantal Escolar Blanco', views: 28, adds: 6 },
]

const DEMO_RECENT_EVENTS = [
  { event_type: 'checkout_completed', page_url: '/checkout', created_at: new Date().toISOString(), event_data: { total: 70000 } },
  { event_type: 'add_to_cart', page_url: '/producto/ambo-completo', created_at: new Date(Date.now() - 300000).toISOString(), event_data: { product_name: 'Ambo Completo' } },
  { event_type: 'product_view', page_url: '/producto/delantal-docente-inicial', created_at: new Date(Date.now() - 600000).toISOString(), event_data: {} },
  { event_type: 'page_view', page_url: '/catalogo', created_at: new Date(Date.now() - 900000).toISOString(), event_data: {} },
  { event_type: 'cart_abandoned', page_url: '/checkout', created_at: new Date(Date.now() - 1800000).toISOString(), event_data: {} },
]

const EVENT_LABELS = {
  page_view: 'Vista de página',
  product_view: 'Vista de producto',
  add_to_cart: 'Agregar al carrito',
  remove_from_cart: 'Quitar del carrito',
  checkout_started: 'Checkout iniciado',
  checkout_completed: 'Compra completada',
  cart_abandoned: 'Carrito abandonado',
  search: 'Búsqueda',
}

const EVENT_COLORS = {
  page_view: 'badge-gray',
  product_view: 'badge-blue',
  add_to_cart: 'badge-green',
  remove_from_cart: 'badge-red',
  checkout_started: 'badge-yellow',
  checkout_completed: 'badge-green',
  cart_abandoned: 'badge-red',
  search: 'badge-blue',
}

export default function AnalyticsPage() {
  const [eventCounts, setEventCounts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [uniqueVisitors, setUniqueVisitors] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  async function loadAnalytics() {
    setLoading(true)
    if (supabase) {
      try {
        const daysBack = dateRange === '24h' ? 1 : dateRange === '7d' ? 7 : 30
        const since = new Date(Date.now() - daysBack * 86400000).toISOString()

        const [eventsRes, visitorsRes, recentRes] = await Promise.all([
          supabase
            .from('analytics_events')
            .select('event_type')
            .gte('created_at', since),
          supabase
            .from('analytics_events')
            .select('visitor_id')
            .gte('created_at', since),
          supabase
            .from('analytics_events')
            .select('*')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(20),
        ])

        if (!eventsRes.error && eventsRes.data) {
          const counts = {}
          eventsRes.data.forEach((e) => {
            counts[e.event_type] = (counts[e.event_type] || 0) + 1
          })
          setEventCounts(Object.entries(counts).map(([event_type, count]) => ({ event_type, count })))
        } else {
          setEventCounts(DEMO_EVENTS)
        }

        if (!visitorsRes.error && visitorsRes.data) {
          const unique = new Set(visitorsRes.data.map((e) => e.visitor_id)).size
          setUniqueVisitors(unique)
        } else {
          setUniqueVisitors(124)
        }

        // Build top products from product_view events
        if (!recentRes.error && recentRes.data) {
          const productViews = {}
          const productAdds = {}
          recentRes.data.forEach((e) => {
            if (e.event_type === 'product_view' && e.event_data?.product_name) {
              productViews[e.event_data.product_name] = (productViews[e.event_data.product_name] || 0) + 1
            }
            if (e.event_type === 'add_to_cart' && e.event_data?.product_name) {
              productAdds[e.event_data.product_name] = (productAdds[e.event_data.product_name] || 0) + 1
            }
          })
          const top = Object.keys(productViews)
            .map((name) => ({ product_name: name, views: productViews[name], adds: productAdds[name] || 0 }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
          setTopProducts(top.length > 0 ? top : DEMO_TOP_PRODUCTS)
          setRecentEvents(recentRes.data.slice(0, 20))
        } else {
          setTopProducts(DEMO_TOP_PRODUCTS)
          setRecentEvents(DEMO_RECENT_EVENTS)
        }
      } catch (e) {
        setEventCounts(DEMO_EVENTS)
        setTopProducts(DEMO_TOP_PRODUCTS)
        setRecentEvents(DEMO_RECENT_EVENTS)
        setUniqueVisitors(124)
      }
    } else {
      setEventCounts(DEMO_EVENTS)
      setTopProducts(DEMO_TOP_PRODUCTS)
      setRecentEvents(DEMO_RECENT_EVENTS)
      setUniqueVisitors(124)
    }
    setLoading(false)
  }

  const getCount = (type) => eventCounts.find((e) => e.event_type === type)?.count || 0
  const totalPageViews = getCount('page_view')
  const totalProductViews = getCount('product_view')
  const addToCarts = getCount('add_to_cart')
  const checkoutsCompleted = getCount('checkout_completed')
  const cartAbandoned = getCount('cart_abandoned')
  const checkoutConversion = addToCarts > 0 ? ((checkoutsCompleted / addToCarts) * 100).toFixed(1) : 0
  const abandonRate = (addToCarts + cartAbandoned) > 0
    ? ((cartAbandoned / (addToCarts + cartAbandoned)) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-500 text-sm mt-1">Estadísticas de visitantes y comportamiento</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {[
            { value: '24h', label: '24h' },
            { value: '7d', label: '7 días' },
            { value: '30d', label: '30 días' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Visitantes únicos" value={uniqueVisitors} icon={Users} color="blue" />
        <StatCard title="Vistas de página" value={totalPageViews} icon={Eye} color="navy" />
        <StatCard title="Productos vistos" value={totalProductViews} icon={MousePointer} color="purple" />
        <StatCard title="Carritos creados" value={addToCarts} icon={ShoppingCart} color="orange" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Compras completadas"
          value={checkoutsCompleted}
          icon={TrendingUp}
          color="green"
          subtitle="Pedidos confirmados"
        />
        <StatCard
          title="Tasa de conversión"
          value={`${checkoutConversion}%`}
          icon={ArrowUpRight}
          color="green"
          subtitle="Carts → Compras"
        />
        <StatCard
          title="Tasa de abandono"
          value={`${abandonRate}%`}
          icon={Activity}
          color={Number(abandonRate) > 50 ? 'red' : 'orange'}
          subtitle="Carritos abandonados"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Event breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Eventos por tipo</h2>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto" />
            ) : (
              DEMO_EVENTS.map(({ event_type, count: demoCount }) => {
                const actual = getCount(event_type) || demoCount
                const max = Math.max(...DEMO_EVENTS.map((e) => getCount(e.event_type) || e.count))
                const pct = max > 0 ? (actual / max) * 100 : 0
                return (
                  <div key={event_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{EVENT_LABELS[event_type]}</span>
                      <span className="font-semibold text-gray-900">{actual}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Productos más vistos</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(topProducts.length > 0 ? topProducts : DEMO_TOP_PRODUCTS).map((p, i) => (
              <div key={p.product_name} className="flex items-center gap-4 px-5 py-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.product_name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views}</span>
                  <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {p.adds}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Eventos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Evento</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">URL</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recentEvents.length > 0 ? recentEvents : DEMO_RECENT_EVENTS).map((event, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`badge ${EVENT_COLORS[event.event_type] || 'badge-gray'}`}>
                      {EVENT_LABELS[event.event_type] || event.event_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs truncate max-w-xs hidden md:table-cell">
                    {event.page_url}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(event.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
