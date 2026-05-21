import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Warehouse,
  LogOut,
  X,
  ExternalLink,
  Package2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  admin: 'Admin',
  superadmin: 'Superadmin',
  comprador: 'Comprador',
}

const ROLE_COLORS = {
  admin: 'bg-blue-500/20 text-blue-200',
  superadmin: 'bg-purple-500/20 text-purple-200',
  comprador: 'bg-green-500/20 text-green-200',
}

const BASE_NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/productos', icon: Package, label: 'Productos' },
  { to: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/stock', icon: Warehouse, label: 'Stock' },
  { to: '/admin/analiticas', icon: BarChart3, label: 'Analíticas' },
  { to: '/admin/finanzas', icon: TrendingUp, label: 'Finanzas' },
]

export default function Sidebar({ onClose }) {
  const { user, role, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const navItems = isSuperAdmin()
    ? [...BASE_NAV_ITEMS, { to: '/admin/usuarios', icon: ShieldCheck, label: 'Usuarios' }]
    : BASE_NAV_ITEMS

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión cerrada')
      navigate('/')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <div className="h-full flex flex-col bg-brand-navy text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
            <Package2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="block text-sm font-bold leading-none">MLM Admin</span>
            <span className="block text-xs text-gray-400 mt-0.5">Panel de control</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {/* Logged in user */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 mb-1">
            <div className="w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${ROLE_COLORS[role] || 'bg-gray-500/20 text-gray-300'}`}>
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          </div>
        )}

        <a
          href={`${import.meta.env.BASE_URL}#/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="w-5 h-5 flex-shrink-0" />
          Ver tienda
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Salir
        </button>
      </div>
    </div>
  )
}
