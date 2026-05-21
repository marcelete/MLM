import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ShoppingBag, AlertCircle } from 'lucide-react'
import Header from '../components/store/Header'
import Footer from '../components/store/Footer'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-20 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-brand-orange" />
          </div>

          <p className="text-7xl font-extrabold text-brand-navy tracking-tight">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Página no encontrada</h1>
          <p className="text-gray-600 mt-3">
            La página que buscás no existe o fue movida. Puede que el link esté roto
            o que el producto haya sido dado de baja.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            <Link to="/" className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl py-4 hover:border-brand-orange hover:shadow-sm transition-all">
              <Home className="w-6 h-6 text-brand-orange" />
              <span className="text-sm font-medium text-gray-700">Inicio</span>
            </Link>
            <Link to="/catalogo" className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl py-4 hover:border-brand-orange hover:shadow-sm transition-all">
              <Search className="w-6 h-6 text-brand-orange" />
              <span className="text-sm font-medium text-gray-700">Catálogo</span>
            </Link>
            <Link to="/carrito" className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl py-4 hover:border-brand-orange hover:shadow-sm transition-all">
              <ShoppingBag className="w-6 h-6 text-brand-orange" />
              <span className="text-sm font-medium text-gray-700">Mi carrito</span>
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-8">
            ¿Necesitás ayuda? Escribinos por WhatsApp y te respondemos enseguida.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
