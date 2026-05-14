import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import Header from '../../components/store/Header'
import Footer from '../../components/store/Footer'
import CartDrawer from '../../components/store/CartDrawer'
import ProductCard from '../../components/store/ProductCard'
import ProductFilters from '../../components/store/ProductFilters'
import { useProducts } from '../../hooks/useProducts'
import { trackPageView, trackSearch } from '../../lib/analytics'

const SORT_OPTIONS = [
  { value: 'default', label: 'Relevancia' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'name', label: 'Nombre A-Z' },
]

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sort, setSort] = useState('default')
  const [searchQuery, setSearchQuery] = useState('')

  const categoryFromURL = searchParams.get('categoria') || ''

  const [filters, setFilters] = useState({
    category: categoryFromURL,
    color: '',
    size: '',
    model: '',
  })

  // Keep filters in sync with URL
  useEffect(() => {
    setFilters((f) => ({ ...f, category: categoryFromURL }))
  }, [categoryFromURL])

  const { data: allProducts, loading } = useProducts({ categorySlug: filters.category })

  useEffect(() => {
    trackPageView('/catalogo', 'Catálogo - Eureka Ropa de Trabajo')
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }

    // Color filter
    if (filters.color) {
      result = result.filter((p) => {
        if (p.hasVariants) {
          return p.variants?.some((v) => v.color === filters.color)
        }
        return p.color === filters.color
      })
    }

    // Size filter
    if (filters.size) {
      result = result.filter((p) => {
        if (p.hasVariants) {
          return p.variants?.some((v) => v.size === filters.size)
        }
        return true
      })
    }

    // Model filter
    if (filters.model) {
      result = result.filter((p) => {
        if (p.hasVariants) {
          return p.variants?.some((v) => v.model === filters.model)
        }
        return true
      })
    }

    // Sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.base_price - b.base_price)
        break
      case 'price-desc':
        result.sort((a, b) => b.base_price - a.base_price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return result
  }, [allProducts, filters, sort, searchQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      trackSearch(searchQuery, filteredProducts.length)
    }
  }

  const resetFilters = () => {
    setFilters({ category: '', color: '', size: '', model: '' })
    setSearchParams({})
    setSearchQuery('')
  }

  const categoryTitle = {
    ambos: 'Ambos Profesionales',
    delantales: 'Delantales',
    '': 'Todo el Catálogo',
  }[filters.category] || 'Catálogo'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-16 lg:pt-20">
        {/* Page header */}
        <div className="bg-brand-navy text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold">{categoryTitle}</h1>
            <p className="text-gray-300 mt-1">
              {loading ? '...' : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop sidebar filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <ProductFilters
                  filters={filters}
                  onChange={setFilters}
                  onReset={resetFilters}
                />
              </div>
            </aside>

            {/* Products area */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 min-w-48">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Buscar productos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                  </div>
                </form>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange text-gray-700"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                </button>
              </div>

              {/* Active filters pills */}
              {(filters.color || filters.size || filters.model) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filters.color && (
                    <span className="badge badge-blue flex items-center gap-1">
                      Color: {filters.color}
                      <button onClick={() => setFilters((f) => ({ ...f, color: '' }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.size && (
                    <span className="badge badge-blue flex items-center gap-1">
                      Talle: {filters.size}
                      <button onClick={() => setFilters((f) => ({ ...f, size: '' }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.model && (
                    <span className="badge badge-blue flex items-center gap-1">
                      Modelo: {filters.model}
                      <button onClick={() => setFilters((f) => ({ ...f, model: '' }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="rounded-xl overflow-hidden shadow-sm">
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
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg font-medium text-gray-600">No se encontraron productos</p>
                  <p className="text-sm mt-1">Probá con otros filtros o buscá otro término</p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 btn-outline text-sm px-5 py-2"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl overflow-y-auto animate-slide-in lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-brand-navy text-white">
              <h2 className="font-semibold">Filtros</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <ProductFilters
                filters={filters}
                onChange={(f) => { setFilters(f); setMobileFiltersOpen(false) }}
                onReset={() => { resetFilters(); setMobileFiltersOpen(false) }}
              />
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  )
}
