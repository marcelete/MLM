import React from 'react'
import { CreditCard, Banknote, Smartphone, BadgeCheck } from 'lucide-react'
import { formatPrice, PAYMENT_LABELS, PAYMENT_SURCHARGES } from '../../data/products'

const METHOD_ICONS = {
  efectivo: Banknote,
  transferencia: Banknote,
  debito: Smartphone,
  credito: CreditCard,
}

const METHOD_DESCRIPTIONS = {
  efectivo: 'Precio base sin recargo',
  transferencia: 'Precio base sin recargo',
  debito: '+10% recargo operativo',
  credito: '+20% recargo • 3 cuotas sin interés',
}

export default function PricingTable({ basePrice, selectedMethod, onSelect }) {
  const methods = Object.keys(PAYMENT_SURCHARGES)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Precios según forma de pago</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {methods.map((method) => {
          const surcharge = PAYMENT_SURCHARGES[method]
          const price = basePrice * (1 + surcharge)
          const Icon = METHOD_ICONS[method]
          const isSelected = selectedMethod === method

          return (
            <button
              key={method}
              type="button"
              onClick={() => onSelect?.(method)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'bg-brand-navy/5 border-l-4 border-brand-orange'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-brand-navy' : 'text-gray-800'
                    }`}
                  >
                    {PAYMENT_LABELS[method]}
                  </span>
                  {surcharge === 0 && (
                    <span className="badge bg-green-100 text-green-700 text-xs">
                      Más económico
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{METHOD_DESCRIPTIONS[method]}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`text-base font-bold ${
                    surcharge === 0 ? 'text-green-700' : 'text-gray-900'
                  }`}
                >
                  {formatPrice(price)}
                </span>
                {surcharge > 0 && (
                  <p className="text-xs text-gray-500">+{(surcharge * 100).toFixed(0)}%</p>
                )}
              </div>

              {isSelected && (
                <BadgeCheck className="w-5 h-5 text-brand-orange flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
