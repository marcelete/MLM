import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, Package, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Header() {
  const { itemCount, toggleCart } = useCart()
  const { user, role, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const userMenuRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/catalogo', label: 'Catálogo' },
    { to: '/catalogo?categoria=ambos', label: 'Ambos' },
    { to: '/catalogo?categoria=delantales', label: 'Delantales' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-brand-navy shadow-xl' : 'bg-brand-navy'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-brand-orange rounded-lg flex items-center justify-center group-hover:bg-brand-orangeDark transition-colors">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-white font-bold text-lg leading-none">MLM</span>
              <span className="block text-brand-orange text-xs font-medium tracking-wide uppercase">
                Ropa de Trabajo
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive && !link.to.includes('?')
                      ? 'text-brand-orange bg-white/10'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* User menu / login button */}
            {user ? (
              isAdmin() ? (
                // Admin / Superadmin: show admin panel link + logout
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm text-gray-200 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">Panel Admin</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Salir</span>
                  </button>
                </div>
              ) : (
                // Comprador: dropdown with name
                <div className="relative hidden sm:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-7 h-7 bg-brand-orange rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden md:block font-medium max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/mi-cuenta"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        Mi cuenta
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout() }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Not logged in: login + signup buttons
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm text-gray-200 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Ingresar</span>
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="hidden md:inline-flex items-center gap-1.5 text-sm border border-white/30 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  Crear cuenta
                </Link>
              </div>
            )}

            {/* Cart button */}
            <button
              onClick={toggleCart}
              className="relative flex items-center gap-2 bg-brand-orange hover:bg-brand-orangeDark text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Carrito</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-brand-orange text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-navyLight border-t border-white/10 animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive && !link.to.includes('?')
                      ? 'text-brand-orange bg-white/10'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-white/10 space-y-1">
              <Link
                to="/carrito"
                className="flex items-center gap-2 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Ver carrito
                {itemCount > 0 && (
                  <span className="ml-auto bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile auth links */}
              {user ? (
                <>
                  {isAdmin() ? (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Panel Admin
                    </Link>
                  ) : (
                    <Link
                      to="/mi-cuenta"
                      className="flex items-center gap-2 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Mi cuenta
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-300 hover:text-white hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Iniciar sesión
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
