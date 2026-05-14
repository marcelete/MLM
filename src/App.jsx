import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'

// Store Pages
import HomePage from './pages/store/HomePage'
import CatalogPage from './pages/store/CatalogPage'
import ProductDetailPage from './pages/store/ProductDetailPage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProductsPage from './pages/admin/ProductsPage'
import OrdersPage from './pages/admin/OrdersPage'
import CustomersPage from './pages/admin/CustomersPage'
import StockPage from './pages/admin/StockPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'

// Admin Layout
import AdminLayout from './components/admin/AdminLayout'

function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAdminAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" /></div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

// Inline hook for protected routes
function useAdminAuth() {
  const [state, setState] = React.useState({ user: null, loading: true })
  React.useEffect(() => {
    import('./lib/supabase').then(({ supabase }) => {
      if (!supabase) {
        setState({ user: null, loading: false })
        return
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        setState({ user: session?.user || null, loading: false })
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({ user: session?.user || null, loading: false })
      })
      return () => subscription.unsubscribe()
    })
  }, [])
  return state
}

import React from 'react'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#0f1b4c',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#16a34a',
                },
              },
              error: {
                style: {
                  background: '#dc2626',
                },
              },
            }}
          />
          <Routes>
            {/* Store Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/producto/:slug" element={<ProductDetailPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="productos" element={<ProductsPage />} />
              <Route path="pedidos" element={<OrdersPage />} />
              <Route path="clientes" element={<CustomersPage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="analiticas" element={<AnalyticsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
