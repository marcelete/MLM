import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Package2, Eye, EyeOff, AlertCircle, ChevronDown, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const { login, user, role, loading, isDemoMode } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      if (role === 'comprador') {
        navigate('/', { replace: true })
      } else {
        navigate('/admin', { replace: true })
      }
    }
  }, [user, role, loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Completá email y contraseña')
      return
    }
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
    } else {
      toast.success('Bienvenido/a')
    }
  }

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setShowDemo(false)
  }

  const demoCredentials = [
    { label: 'Super Admin', email: 'super@mlm.com.ar', password: 'MLM2024super!', badge: 'superadmin' },
    { label: 'Administrador', email: 'admin@mlm.com.ar', password: 'MLM2024admin!', badge: 'admin' },
    { label: 'Comprador', email: 'comprador@mlm.com.ar', password: 'MLM2024comp!', badge: 'comprador' },
  ]

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Package2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MLM</h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">Ropa de Trabajo</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Iniciar sesión</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-orange hover:bg-brand-orangeDark disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Demo credentials */}
          {isDemoMode && (
            <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600 font-medium"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-orange" />
                  Credenciales de demo
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
              </button>
              {showDemo && (
                <div className="divide-y divide-gray-100">
                  {demoCredentials.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      onClick={() => fillDemo(c.email, c.password)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.label}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.badge === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        c.badge === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {c.badge}
                      </span>
                    </button>
                  ))}
                  <p className="px-4 py-2 text-xs text-gray-400 bg-gray-50">Hacé clic en un usuario para autocompletar</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <Link
            to="/"
            className="block text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Volver a la tienda sin iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
