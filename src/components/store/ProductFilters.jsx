import React from 'react'
import { Filter, X } from 'lucide-react'
import { COLORS, SIZES } from '../../data/products'

const CATEGORIES = [
  { value: '', label: 'Todo' },
  { value: 'ambos', label: 'Ambos' },
  { value: 'delantales', label: 'Delantales' },
]

export default function ProductFilters({ filters, onChange, onReset }) {
  const hasActiveFilters =
    filters.category || filters.color || filters.size || filters.model

  function update(key, value) {
    onChange({ ...filters, [key]: value === filters[key] ? '' : value })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-orange" />
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-brand-orange hover:text-brand-orangeDark flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Categoría
        </p>
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onChange({ ...filters, category: cat.value })}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                filters.category === cat.value
                  ? 'bg-brand-navy text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modelo (only for ambos) */}
      {(!filters.category || filters.category === 'ambos') && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Modelo
          </p>
          <div className="flex gap-2 flex-wrap">
            {['Hombre', 'Mujer'].map((m) => (
              <button
                key={m}
                onClick={() => update('model', m)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  filters.model === m
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'border-gray-300 text-gray-700 hover:border-brand-navy'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes (only for ambos) */}
      {(!filters.category || filters.category === 'ambos') && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Talle
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => update('size', size)}
                className={`w-10 h-10 text-xs font-semibold rounded-lg border transition-colors ${
                  filters.size === size
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'border-gray-300 text-gray-700 hover:border-brand-navy'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Color
        </p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => update('color', c.name)}
              className={`w-8 h-8 rounded-full transition-all ${
                c.border ? 'border-2 border-gray-300' : ''
              } ${
                filters.color === c.name
                  ? 'ring-2 ring-brand-orange ring-offset-2 scale-110'
                  : 'hover:scale-110 hover:ring-2 hover:ring-gray-400 hover:ring-offset-1'
              }`}
              style={{ backgroundColor: c.hex }}
              aria-label={c.name}
            />
          ))}
        </div>
        {filters.color && (
          <p className="text-xs text-gray-500 mt-1">
            Color seleccionado: <strong>{filters.color}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
