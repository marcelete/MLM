import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import StatCard from '../../components/admin/StatCard'
import { supabase } from '../../lib/supabase'
import { products as staticProducts } from '../../data/products'
import { formatPrice } from '../../data/products'

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'badge-yellow', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'badge-blue', icon: CheckCircle },
  shipped: { label: 'Enviado', color: 'badge-blue', icon: Truck },
  delivered: { label: 'Entregado', color: 'badge-green', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'badge-red', icon: AlertTriangle },
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    salesToday: 0,
    salesWeek: 0,
    salesMonth: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalCustomers: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    if (!supabase) {
      // Demo data when Supabase not available
      setStats({
        salesToday: 140000,
        salesWeek: 890000,
        salesMonth: 3200000,
        pendingOrders: 4,
        totalOrders: 28,
        totalCustomers: 19,
      })
      setRecentOrders([
        { id: 'demo-1', created_at: new Date().toISOString(), status: 'pending', total: 70000, customers: { name: 'María González' }, payment_method: 'efectivo' },
        { id: 'demo-2', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'confirmed', total: 114000, customers: { name: 'Carlos Rodríguez' }, payment_method: 'credito' },
        { id: 'demo-3', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'shipped', total: 22000, customers: { name: 'Laura Martínez' }, payment_method: 'transferencia' },
      ])
      setLowStock([
        { id: 'var-1', sku: 'SKU-AMBO-M-AZUL-H', size: 'M', color: 'Azul', model: 'Hombre', stock: 1, products: { name: 'Ambo Completo' } },
        { id: 'var-2', sku: 'SKU-AMBO-S-NEGRO-M', size: 'S', color: 'Negro', model: 'Mujer', stock: 2, products: { name: 'Ambo - Solo Pantalón' } },
      ])
      setLoading(false)
      return
    }

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekStart = new Date(now - 7 * 86400000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [ordersToday, ordersWeek, ordersMonth, pendingResult, customersResult, recentResult, lowStockResult] = await Promise.all([
        supabase.from('orders').select('total').gte('created_at', todayStart).neq('status', 'cancelled'),
        supabase.from('orders').select('total').gte('created_at', weekStart).neq('status', 'cancelled'),
        supabase.from('orders').select('total').gte('created_at', monthStart).neq('status', 'cancelled'),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, created_at, status, total, payment_method, customers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('product_variants').select('id, sku, size, color, model, stock, products(name)').lte('stock', 3).gt('stock', 0).order('stock'),
      ])

      setStats({
        salesToday: ordersToday.data?.reduce((s, o) => s + Number(o.total), 0) || 0,
        salesWeek: ordersWeek.data?.reduce((s, o) => s + Number(o.total), 0) || 0,
        salesMonth: ordersMonth.data?.reduce((s, o) => s + Number(o.total), 0) || 0,
        pendingOrders: pendingResult.count || 0,
        totalOrders: (ordersMonth.data?.length) || 0,
        totalCustomers: customersResult.count || 0,
      })
      setRecentOrders(recentResult.data || [])
      setLowStock(lowStockResult.data || [])
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de actividad de la tienda</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="xl:col-span-2">
          <StatCard
            title="Ventas hoy"
            value={formatPrice(stats.salesToday)}
            icon={TrendingUp}
            color="orange"
            subtitle="Efectivo + digital"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Ventas esta semana"
            value={formatPrice(stats.salesWeek)}
            icon={BarChart3}
            color="navy"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Ventas este mes"
            value={formatPrice(stats.salesMonth)}
            icon={TrendingUp}
            color="green"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Pedidos pendientes"
            value={stats.pendingOrders}
            icon={ShoppingCart}
            color="red"
            subtitle="Requieren atención"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Pedidos este mes"
            value={stats.totalOrders}
            icon={Package}
            color="blue"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            title="Clientes registrados"
            value={stats.totalCustomers}
            icon={Users}
            color="purple"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pedidos recientes</h2>
            <Link
              to="/admin/pedidos"
              className="text-sm text-brand-orange hover:text-brand-orangeDark flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="p-6 text-center text-gray-500 text-sm">No hay pedidos recientes</p>
            ) : (
              recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                return (
                  <div key={order.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.customers?.name || 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-AR')} • {order.payment_method}
                      </p>
                    </div>
                    <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stock bajo
            </h2>
            <Link
              to="/admin/stock"
              className="text-sm text-brand-orange hover:text-brand-orangeDark flex items-center gap-1 transition-colors"
            >
              Ver stock <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto" />
              </div>
            ) : lowStock.length === 0 ? (
              <p className="p-6 text-center text-gray-500 text-sm">Sin alertas de stock</p>
            ) : (
              lowStock.map((v) => (
                <div key={v.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{v.products?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {v.size} / {v.color} / {v.model}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{v.sku}</span>
                    <span className={`text-xs font-bold ${v.stock <= 1 ? 'text-red-600' : 'text-amber-600'}`}>
                      {v.stock} en stock
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
