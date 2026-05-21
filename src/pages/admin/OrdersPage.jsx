import React, { useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, Eye, X, FileText, Tag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatPrice, PAYMENT_LABELS } from '../../data/products'
import { generarTicketPDF, generarEtiquetaPDF } from '../../lib/pdf'
import { sendEmail } from '../../lib/email'
import { logAction } from '../../lib/audit'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const STATUS_COLORS = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  shipped: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const DEMO_ORDERS = [
  { id: 'demo-001', created_at: new Date().toISOString(), status: 'pending', total: 70000, subtotal: 70000, payment_method: 'efectivo', payment_surcharge_pct: 0, customers: { name: 'María González', email: 'maria@gmail.com', phone: '1134567890' }, notes: '' },
  { id: 'demo-002', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'confirmed', total: 114000, subtotal: 95000, payment_method: 'credito', payment_surcharge_pct: 20, customers: { name: 'Carlos Rodríguez', email: 'carlos@gmail.com', phone: '1156781234' }, notes: 'Dejar en portería' },
  { id: 'demo-003', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'shipped', total: 22000, subtotal: 22000, payment_method: 'transferencia', payment_surcharge_pct: 0, customers: { name: 'Laura Martínez', email: 'laura@gmail.com', phone: '1145678901' }, notes: '' },
  { id: 'demo-004', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'delivered', total: 38000, subtotal: 38000, payment_method: 'efectivo', payment_surcharge_pct: 0, customers: { name: 'Juan Pérez', email: 'juan@gmail.com', phone: '1167890123' }, notes: '' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [viewItems, setViewItems] = useState([])

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    if (!viewOrder) { setViewItems([]); return }
    if (!supabase || String(viewOrder.id).startsWith('demo-')) {
      setViewItems([
        { product_name: 'Ambo profesional', variant_desc: 'Talle M · Azul', quantity: 1, unit_price: viewOrder.subtotal || viewOrder.total, total_price: viewOrder.subtotal || viewOrder.total },
      ])
      return
    }
    supabase.from('order_items').select('*').eq('order_id', viewOrder.id).then(({ data }) => {
      setViewItems(data || [])
    })
  }, [viewOrder])

  async function imprimirTicket() {
    if (!viewOrder) return
    generarTicketPDF(viewOrder, viewItems, viewOrder.customers)
  }

  async function imprimirEtiqueta() {
    if (!viewOrder) return
    if (!viewOrder.customers?.address) {
      toast.error('Este cliente no tiene dirección cargada')
      return
    }
    generarEtiquetaPDF(viewOrder, viewOrder.customers)
  }

  async function loadOrders() {
    setLoading(true)
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, email, phone)')
        .order('created_at', { ascending: false })
      if (!error) { setOrders(data || []); setLoading(false); return }
    }
    setOrders(DEMO_ORDERS)
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    if (!supabase) { toast.error('Supabase no configurado'); return }
    const prev = orders.find((o) => o.id === orderId)
    const prevStatus = prev?.status
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) { toast.error('Error al actualizar'); return }
    setOrders((os) => os.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
    if (viewOrder?.id === orderId) setViewOrder((o) => ({ ...o, status: newStatus }))
    toast.success(`Estado actualizado a: ${STATUS_LABELS[newStatus]}`)

    // Audit
    logAction('cambiar_estado_orden', 'orden', orderId, { from: prevStatus, to: newStatus })

    // Email al cliente si el cambio lo amerita
    const email = prev?.customers?.email
    if (email) {
      const tplMap = { confirmed: 'pago_confirmado', shipped: 'orden_enviada', delivered: 'orden_entregada' }
      const template = tplMap[newStatus]
      if (template) {
        sendEmail({
          to: email,
          template,
          data: { order_id: orderId, customer_name: prev?.customers?.name, total: prev?.total },
        })
      }
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} pedidos en total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar por cliente o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange text-gray-700"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pago</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No se encontraron pedidos</td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{order.customers?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{order.customers?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden md:table-cell capitalize">
                      {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`badge ${STATUS_COLORS[order.status]} border-0 cursor-pointer text-xs py-1 px-2 rounded-full font-medium`}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="p-1.5 text-gray-500 hover:text-brand-navy hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-lg">
                Pedido #{viewOrder.id.slice(-8).toUpperCase()}
              </h2>
              <button onClick={() => setViewOrder(null)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-medium">{viewOrder.customers?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`badge ${STATUS_COLORS[viewOrder.status]}`}>{STATUS_LABELS[viewOrder.status]}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p>{viewOrder.customers?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p>{viewOrder.customers?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Método de pago</p>
                  <p>{PAYMENT_LABELS[viewOrder.payment_method] || viewOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p>{new Date(viewOrder.created_at).toLocaleString('es-AR')}</p>
                </div>
              </div>
              {viewOrder.notes && (
                <div>
                  <p className="text-xs text-gray-500">Notas</p>
                  <p className="bg-gray-50 rounded p-2 mt-1">{viewOrder.notes}</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(viewOrder.subtotal)}</span>
                </div>
                {viewOrder.payment_surcharge_pct > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Recargo ({viewOrder.payment_surcharge_pct}%)</span>
                    <span>+{formatPrice(viewOrder.total - viewOrder.subtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-1 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(viewOrder.total)}</span>
                </div>
              </div>
              {viewItems.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Productos</p>
                  <div className="space-y-1.5">
                    {viewItems.map((it, i) => (
                      <div key={i} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                        <div>
                          <p className="font-medium">{it.product_name}</p>
                          {it.variant_desc && <p className="text-xs text-gray-500">{it.variant_desc}</p>}
                        </div>
                        <div className="text-right">
                          <p>x{it.quantity}</p>
                          <p className="text-xs text-gray-500">{formatPrice(it.total_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Cambiar estado</p>
                <select
                  value={viewOrder.status}
                  onChange={(e) => updateStatus(viewOrder.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={imprimirTicket}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Imprimir ticket
                </button>
                <button
                  onClick={imprimirEtiqueta}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 text-sm font-medium transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  Imprimir etiqueta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
