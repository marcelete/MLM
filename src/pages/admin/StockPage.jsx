import React, { useState, useEffect } from 'react'
import { Search, AlertTriangle, Edit2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { products as staticProducts, COLORS } from '../../data/products'
import toast from 'react-hot-toast'

function buildDemoVariants() {
  const variants = []
  staticProducts.forEach((p) => {
    if (p.hasVariants && p.variants?.length > 0) {
      p.variants.slice(0, 10).forEach((v) => {
        variants.push({
          ...v,
          products: { name: p.name },
        })
      })
    }
  })
  return variants
}

export default function StockPage() {
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | low | out
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    loadVariants()
  }, [])

  async function loadVariants() {
    setLoading(true)
    if (supabase) {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*, products(name)')
        .order('stock', { ascending: true })
      if (!error) { setVariants(data || []); setLoading(false); return }
    }
    setVariants(buildDemoVariants())
    setLoading(false)
  }

  async function saveStock(variantId, newStock) {
    const qty = parseInt(newStock)
    if (isNaN(qty) || qty < 0) { toast.error('Cantidad inválida'); return }
    if (!supabase) {
      setVariants((vs) => vs.map((v) => v.id === variantId ? { ...v, stock: qty } : v))
      toast.success('Stock actualizado (demo)')
      setEditingId(null)
      return
    }
    const { error } = await supabase.from('product_variants').update({ stock: qty }).eq('id', variantId)
    if (error) { toast.error('Error al actualizar stock'); return }
    setVariants((vs) => vs.map((v) => v.id === variantId ? { ...v, stock: qty } : v))
    toast.success('Stock actualizado')
    setEditingId(null)
  }

  const getColorHex = (colorName) => {
    const c = COLORS.find((c) => c.name === colorName)
    return c?.hex || '#ccc'
  }

  const filtered = variants.filter((v) => {
    const matchSearch =
      !search ||
      v.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.sku?.toLowerCase().includes(search.toLowerCase()) ||
      v.color?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'low' && v.stock > 0 && v.stock <= 3) ||
      (filter === 'out' && v.stock === 0)
    return matchSearch && matchFilter
  })

  const outOfStock = variants.filter((v) => v.stock === 0).length
  const lowStockCount = variants.filter((v) => v.stock > 0 && v.stock <= 3).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-gray-500 text-sm mt-1">{variants.length} variantes en total</p>
        </div>
      </div>

      {/* Alert summary */}
      {(outOfStock > 0 || lowStockCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span><strong>{outOfStock}</strong> variantes sin stock</span>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span><strong>{lowStockCount}</strong> variantes con stock bajo (≤3)</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar por producto, SKU o color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'low', label: `Bajo (${lowStockCount})` },
            { value: 'out', label: `Sin stock (${outOfStock})` },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Variante</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">SKU</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No se encontraron variantes</td></tr>
              ) : (
                filtered.map((variant) => {
                  const isEditing = editingId === variant.id
                  const stockClass =
                    variant.stock === 0
                      ? 'text-red-600 bg-red-50'
                      : variant.stock <= 3
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-green-600 bg-green-50'

                  return (
                    <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{variant.products?.name}</p>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: getColorHex(variant.color) }}
                            title={variant.color}
                          />
                          <span className="text-gray-600 text-xs">
                            {[variant.size, variant.color, variant.model].filter(Boolean).join(' / ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                        {variant.sku}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
                              min="0"
                              autoFocus
                            />
                            <button onClick={() => saveStock(variant.id, editValue)} className="text-green-600 hover:text-green-800 p-1">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${stockClass}`}>
                            {variant.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {!isEditing && (
                          <button
                            onClick={() => { setEditingId(variant.id); setEditValue(String(variant.stock)) }}
                            className="p-1.5 text-gray-500 hover:text-brand-navy hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
