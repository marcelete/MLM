import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'

// Store Pages
import HomePage from './pages/store/HomePage'
import CatalogPage from './pages/store/CatalogPage'
import ProductDetailPage from './pages/store/ProductDetailPage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'
import AccountPage from './pages/store/AccountPage'

// Auth Pages
import LoginPage from './pages/LoginPage'

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage'
import ProductsPage from './pages/admin/ProductsPage'
import OrdersPage from './pages/admin/OrdersPage'
import CustomersPage from './pages/admin/CustomersPage'
import StockPage from './pages/admin/StockPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import FinancesPage from './pages/admin/FinancesPage'
import UsersPage from './pages/admin/UsersPage'

// Admin Layout
import AdminLayout from './components/admin/AdminLayout'

import React from 'react'
import { useAuth } from './contexts/AuthContext'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
            <p className="text-gray-500 mb-4">
              Ocurrió un error inesperado. Por favor recargá la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Recargar página
            </button>
            {this.state.error && (
              <p className="text-xs text-gray-400 mt-4 font-mono">{this.state.error.message}</p>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
    </div>
  )
}

// Redirect to /login if not logged in
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Redirect to / if not admin or superadmin
function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/" replace />
  return children
}

// Redirect to /admin if not superadmin
function RequireSuperAdmin({ children }) {
  const { user, loading, isSuperAdmin } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isSuperAdmin()) return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
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
              <Route
                path="/mi-cuenta"
                element={
                  <RequireAuth>
                    <AccountPage />
                  </RequireAuth>
                }
              />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              {/* Legacy admin login → redirect to unified login */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="productos" element={<ProductsPage />} />
                <Route path="pedidos" element={<OrdersPage />} />
                <Route path="clientes" element={<CustomersPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="analiticas" element={<AnalyticsPage />} />
                <Route path="finanzas" element={<FinancesPage />} />
                <Route
                  path="usuarios"
                  element={
                    <RequireSuperAdmin>
                      <UsersPage />
                    </RequireSuperAdmin>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}
