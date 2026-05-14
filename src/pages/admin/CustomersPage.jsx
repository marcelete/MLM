import React, { useState, useEffect } from 'react'
import { Search, User, Phone, Mail, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DEMO_CUSTOMERS = [
  { id: 'c1', name: 'María González', email: 'maria@gmail.com', phone: '1134567890', address: 'Av. Corrientes 1234, CABA', city: 'CABA', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'c2', name: 'Carlos Rodríguez', email: 'carlos@gmail.com', phone: '1156781234', address: 'Pringles 456, CABA', city: 'CABA', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'c3', name: 'Laura Martínez', email: 'laura@gmail.com', phone: '1145678901', address: 'Thames 789, CABA', city: 'CABA', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'c4', name: 'Juan Pérez', email: 'juan@gmail.com', phone: '1167890123', address: 'Palermo 321, CABA', city: 'CABA', created_at: new Date().toISOString() },
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) { setCustomers(data || []); setLoading(false); return }
    }
    setCustomers(DEMO_CUSTOMERS)
    setLoading(false)
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 text-sm mt-1">{customers.length} clientes registrados</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Teléfono</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Dirección</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No se encontraron clientes</td></tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {customer.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">{customer.phone || '-'}</td>
                    <td className="px-5 py-4 text-gray-600 hidden md:table-cell text-xs max-w-xs truncate">{customer.address || '-'}</td>
                    <td className="px-5 py-4 text-gray-500 hidden lg:table-cell text-xs">
                      {new Date(customer.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
