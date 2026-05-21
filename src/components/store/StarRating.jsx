import React from 'react'
import { Star } from 'lucide-react'

// Modo lectura (size en px, rating 0-5 con decimales) o input (onChange).
export default function StarRating({ rating = 0, size = 16, onChange = null, className = '' }) {
  const interactive = typeof onChange === 'function'
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating)
        const Cmp = (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={`${filled ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          />
        )
        return interactive ? (
          <button key={n} type="button" onClick={() => onChange(n)} className="leading-none">
            {Cmp}
          </button>
        ) : Cmp
      })}
    </div>
  )
}
