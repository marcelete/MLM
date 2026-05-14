import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { trackAddToCart, trackRemoveFromCart } from '../lib/analytics'
import { formatPrice } from '../data/products'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'eureka_cart'

// ──────────────────────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────────────────────

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, variant, quantity } = action.payload
      const key = variant ? `${product.id}__${variant.id}` : product.id
      const existing = state.items.find((i) => i.key === key)

      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i
          ),
        }
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            key,
            product,
            variant: variant || null,
            quantity,
          },
        ],
      }
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((i) => i.key !== action.payload.key),
      }
    }

    case 'UPDATE_QTY': {
      const { key, quantity } = action.payload
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.key !== key) }
      }
      return {
        ...state,
        items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
      }
    }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    case 'LOAD_CART':
      return { ...state, items: action.payload }

    case 'OPEN_CART':
      return { ...state, isOpen: true }

    case 'CLOSE_CART':
      return { ...state, isOpen: false }

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }

    default:
      return state
  }
}

const initialState = {
  items: [],
  isOpen: false,
}

// ──────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const items = JSON.parse(saved)
        dispatch({ type: 'LOAD_CART', payload: items })
      }
    } catch (e) {
      console.warn('CartContext: failed to load cart from localStorage', e)
    }
  }, [])

  // Persist cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch (e) {
      console.warn('CartContext: failed to persist cart', e)
    }
  }, [state.items])

  // ── Actions ──────────────────────────────────────────────────

  const addItem = (product, variant = null, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, variant, quantity } })
    trackAddToCart(product, variant, quantity)
    dispatch({ type: 'OPEN_CART' })
  }

  const removeItem = (key, product) => {
    const item = state.items.find((i) => i.key === key)
    if (item) {
      trackRemoveFromCart(item.product.id, item.product.name, item.quantity)
    }
    dispatch({ type: 'REMOVE_ITEM', payload: { key } })
  }

  const updateQuantity = (key, quantity) => {
    dispatch({ type: 'UPDATE_QTY', payload: { key, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const openCart = () => dispatch({ type: 'OPEN_CART' })
  const closeCart = () => dispatch({ type: 'CLOSE_CART' })
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' })

  // ── Computed ─────────────────────────────────────────────────

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce(
    (sum, i) => sum + i.product.base_price * i.quantity,
    0
  )

  function getItemVariantDesc(item) {
    if (!item.variant) return null
    const parts = []
    if (item.variant.size) parts.push(item.variant.size)
    if (item.variant.color) parts.push(item.variant.color)
    if (item.variant.model) parts.push(item.variant.model)
    return parts.join(' / ')
  }

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        formatPrice,
        getItemVariantDesc,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
