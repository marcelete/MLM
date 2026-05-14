import React from 'react'
import { Check } from 'lucide-react'
import { COLORS } from '../../data/products'

export function ColorSwatch({ colorName, size = 'md', selected = false, onClick }) {
  const colorData = COLORS.find((c) => c.name === colorName) || { hex: '#ccc', name: colorName }

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  }

  return (
    <button
      type="button"
      title={colorName}
      onClick={onClick}
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-150
        ${colorData.border ? 'border-2 border-gray-300' : ''}
        ${selected ? 'ring-2 ring-brand-orange ring-offset-2 scale-110' : 'hover:scale-110 hover:ring-2 hover:ring-gray-400 hover:ring-offset-1'}
      `}
      style={{ backgroundColor: colorData.hex }}
      aria-pressed={selected}
      aria-label={colorName}
    >
      {selected && (
        <Check
          className={`w-3 h-3 ${
            colorName === 'Blanco' || colorName === 'Celeste' ? 'text-gray-600' : 'text-white'
          }`}
          strokeWidth={3}
        />
      )}
    </button>
  )
}

export function ColorSwatchRow({ colors, selectedColor, onSelect, maxShow = 6 }) {
  const displayed = colors.slice(0, maxShow)
  const remaining = colors.length - maxShow

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {displayed.map((colorName) => (
        <ColorSwatch
          key={colorName}
          colorName={colorName}
          selected={selectedColor === colorName}
          onClick={() => onSelect?.(colorName)}
          size="md"
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500 ml-1">+{remaining}</span>
      )}
    </div>
  )
}
