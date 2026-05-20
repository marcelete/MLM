import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Package, ShoppingBag, LogOut, ChevronRight, Calendar, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Header from '../../components/store/Header'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchOrders()
  }, [user])

  async function fetchOrders() {
    setLoadingOrders(true)
    if (!supabase || !user?.email) {
      setLoadingOrders(false)
      return
    }
    try {
      // Find customer by email
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!customer) {
        setOrders([])
        setLoadingOrders(false)
        return
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id, status, total, created_at,
          order_items(product_name, quantity, unit_price)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
    } catch {
      setOrders([])
    }
    setLoadingOrders(false)
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 lg:pt-24">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Greeting */}
          <div className="bg-brand-navy rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Bienvenido/a de nuevo</p>
              <h1 className="text-2xl font-bold text-white mt-1">Hola, {user.name}!</h1>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            </div>
            <div className="w-14 h-14 bg-brand-orange rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xl font-bold">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link
              to="/catalogo"
              className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Catálogo</p>
                <p className="text-xs text-gray-500">Ver productos</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-left"
            >
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Cerrar sesión</p>
                <p className="text-xs text-gray-500">Salir de mi cuenta</p>
              </div>
            </button>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-orange" />
              <h2 className="text-lg font-bold text-gray-900">Mis pedidos</h2>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
              </div>
            ) : !supabase ? (
              <div className="py-16 text-center px-6">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Sin historial disponible</p>
                <p className="text-gray-400 text-sm mt-1">
                  El historial de pedidos requiere Supabase configurado.
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center px-6">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Todavía no hiciste pedidos</p>
                <p className="text-gray-400 text-sm mt-2">
                  Explorá el catálogo y hacé tu primer pedido.
                </p>
                <Link
                  to="/catalogo"
                  className="inline-block mt-4 bg-brand-orange text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-orangeDark transition-colors"
                >
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono text-gray-500">#{order.id.slice(0, 8)}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.created_at)}
                        </div>
                        {order.order_items && order.order_items.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {order.order_items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'ítem' : 'ítems'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
