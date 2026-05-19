import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Users, CreditCard, Banknote, Smartphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../data/products'

// ──────────────────────────────────────────────────────────────
// Demo data (used when Supabase is not configured)
// ──────────────────────────────────────────────────────────────

const DEMO_ORDERS = [
  { id: 'ord-001', created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), total: 140000, payment_method: 'efectivo', status: 'confirmed' },
  { id: 'ord-002', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), total: 77000, payment_method: 'debito', status: 'pending' },
  { id: 'ord-003', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), total: 210000, payment_method: 'credito', status: 'shipped' },
  { id: 'ord-004', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), total: 84000, payment_method: 'transferencia', status: 'delivered' },
  { id: 'ord-005', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), total: 56000, payment_method: 'efectivo', status: 'delivered' },
  { id: 'ord-006', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), total: 126000, payment_method: 'transferencia', status: 'confirmed' },
  { id: 'ord-007', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), total: 42000, payment_method: 'debito', status: 'cancelled' },
  { id: 'ord-008', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), total: 280000, payment_method: 'credito', status: 'delivered' },
  { id: 'ord-009', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), total: 70000, payment_method: 'efectivo', status: 'delivered' },
  { id: 'ord-010', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), total: 154000, payment_method: 'transferencia', status: 'confirmed' },
]

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function calcStats(orders) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const nonCancelled = orders.filter((o) => o.status !== 'cancelled')

  const todayRevenue = nonCancelled
    .filter((o) => new Date(o.created_at) >= todayStart)
    .reduce((s, o) => s + Number(o.total), 0)

  const weekRevenue = nonCancelled
    .filter((o) => new Date(o.created_at) >= weekStart)
    .reduce((s, o) => s + Number(o.total), 0)

  const monthRevenue = nonCancelled
    .filter((o) => new Date(o.created_at) >= monthStart)
    .reduce((s, o) => s + Number(o.total), 0)

  const allRevenue = nonCancelled.reduce((s, o) => s + Number(o.total), 0)

  const avgOrderValue = nonCancelled.length > 0 ? allRevenue / nonCancelled.length : 0

  // Revenue by payment method
  const methodTotals = {}
  nonCancelled.forEach((o) => {
    methodTotals[o.payment_method] = (methodTotals[o.payment_method] || 0) + Number(o.total)
  })

  // Orders by status
  const statusCounts = {}
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })

  return { todayRevenue, weekRevenue, monthRevenue, allRevenue, avgOrderValue, methodTotals, statusCounts }
}

const METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito / QR',
  credito: 'Tarjeta crédito',
}

const METHOD_ICONS = {
  efectivo: Banknote,
  transferencia: Banknote,
  debito: Smartphone,
  credito: CreditCard,
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function KPICard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function FinancesPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    async function fetchOrders() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('id, created_at, total, payment_method, status')
            .order('created_at', { ascending: false })
            .limit(200)

          if (!error && data && data.length > 0) {
            setOrders(data)
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn('FinancesPage: Supabase error, using demo data', e)
        }
      }
      setOrders(DEMO_ORDERS)
      setIsDemo(true)
      setLoading(false)
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  const { todayRevenue, weekRevenue, monthRevenue, allRevenue, avgOrderValue, methodTotals, statusCounts } = calcStats(orders)

  const maxMethodTotal = Math.max(...Object.values(methodTotals), 1)

  const recentOrders = [...orders].slice(0, 10)

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Resumen de ingresos y transacciones</p>
        </div>
        {isDemo && (
          <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-3 py-1.5 rounded-full border border-yellow-200">
            Datos de demostración
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="Hoy"
          value={formatPrice(todayRevenue)}
          sub="Ingresos del día"
          color="bg-brand-orange"
        />
        <KPICard
          icon={TrendingUp}
          label="Esta semana"
          value={formatPrice(weekRevenue)}
          sub="Últimos 7 días"
          color="bg-blue-500"
        />
        <KPICard
          icon={TrendingUp}
          label="Este mes"
          value={formatPrice(monthRevenue)}
          sub="Mes en curso"
          color="bg-indigo-500"
        />
        <KPICard
          icon={ShoppingBag}
          label="Total acumulado"
          value={formatPrice(allRevenue)}
          sub={`Ticket promedio: ${formatPrice(avgOrderValue)}`}
          color="bg-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by payment method */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Ingresos por método de pago</h2>
          <div className="space-y-4">
            {Object.entries(methodTotals).length === 0 ? (
              <p className="text-gray-400 text-sm">Sin datos</p>
            ) : (
              Object.entries(methodTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([method, total]) => {
                  const Icon = METHOD_ICONS[method] || Banknote
                  const pct = Math.round((total / maxMethodTotal) * 100)
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Icon className="w-4 h-4 text-gray-400" />
                          {METHOD_LABELS[method] || method}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-brand-orange h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Pedidos por estado</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).length === 0 ? (
              <p className="text-gray-400 text-sm">Sin datos</p>
            ) : (
              Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-brand-navy h-1.5 rounded-full"
                          style={{ width: `${Math.round((count / orders.length) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transacciones recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedido</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Método</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {METHOD_LABELS[order.payment_method] || order.payment_method}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {formatPrice(Number(order.total))}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No hay transacciones aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
