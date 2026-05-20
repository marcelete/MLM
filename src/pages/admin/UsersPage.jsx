import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Search,
  Info,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  comprador: 'Comprador',
  admin: 'Admin',
  superadmin: 'Superadmin',
}

const ROLE_COLORS = {
  comprador: 'bg-green-100 text-green-700',
  admin: 'bg-blue-100 text-blue-700',
  superadmin: 'bg-purple-100 text-purple-700',
}

const ROLE_ICONS = {
  comprador: ShoppingBag,
  admin: Shield,
  superadmin: ShieldCheck,
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'comprador' }

function RoleBadge({ role }) {
  const Icon = ROLE_ICONS[role] || Shield
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role] || role}
    </span>
  )
}

function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function UsersPage() {
  const { isDemoMode } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null) // null = new user
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // user id

  const loadUsers = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      const stored = localStorage.getItem('mlm_demo_users')
      const all = stored ? JSON.parse(stored) : []
      setUsers(all.map(({ password: _pw, ...u }) => u))
    } else {
      // Supabase: read from profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, created_at')
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Error al cargar usuarios')
        setUsers([])
      } else {
        setUsers(data || [])
      }
    }
    setLoading(false)
  }, [isDemoMode])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function openNew() {
    setEditUser(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(u) {
    setEditUser(u)
    setForm({ name: u.name, email: u.email || '', password: '', role: u.role })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditUser(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return }
    if (!editUser && !form.email.trim()) { setFormError('El email es obligatorio'); return }
    if (!editUser && !form.password) { setFormError('La contraseña es obligatoria'); return }

    setSubmitting(true)

    if (isDemoMode) {
      const stored = localStorage.getItem('mlm_demo_users')
      let all = stored ? JSON.parse(stored) : []

      if (editUser) {
        // Edit
        all = all.map(u => u.id === editUser.id
          ? {
            ...u,
            name: form.name.trim(),
            role: form.role,
            ...(form.password ? { password: form.password } : {}),
          }
          : u
        )
        localStorage.setItem('mlm_demo_users', JSON.stringify(all))
        toast.success('Usuario actualizado')
      } else {
        // Create
        const exists = all.find(u => u.email === form.email.trim())
        if (exists) {
          setFormError('Ya existe un usuario con ese email')
          setSubmitting(false)
          return
        }
        const newUser = {
          id: Date.now().toString(),
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          role: form.role,
          created_at: new Date().toISOString(),
        }
        all.push(newUser)
        localStorage.setItem('mlm_demo_users', JSON.stringify(all))
        toast.success('Usuario creado')
      }
      await loadUsers()
      closeModal()
      setSubmitting(false)
      return
    }

    // Supabase mode
    if (editUser) {
      const { error } = await supabase
        .from('profiles')
        .update({ name: form.name.trim(), role: form.role, updated_at: new Date().toISOString() })
        .eq('id', editUser.id)
      if (error) {
        setFormError('Error al actualizar: ' + error.message)
        setSubmitting(false)
        return
      }
      toast.success('Usuario actualizado')
      await loadUsers()
      closeModal()
    } else {
      // Creating a new user requires service key
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY
      if (!serviceKey) {
        setFormError(
          'Para crear usuarios con Supabase, configurá VITE_SUPABASE_SERVICE_KEY o usá el panel de Supabase Auth directamente.'
        )
        setSubmitting(false)
        return
      }
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(import.meta.env.VITE_SUPABASE_URL, serviceKey)
      const { data, error: createError } = await adminClient.auth.admin.createUser({
        email: form.email.trim(),
        password: form.password,
        user_metadata: { name: form.name.trim() },
        email_confirm: true,
      })
      if (createError) {
        setFormError('Error al crear usuario: ' + createError.message)
        setSubmitting(false)
        return
      }
      // Update role in profiles
      await supabase
        .from('profiles')
        .upsert({ id: data.user.id, name: form.name.trim(), role: form.role })
      toast.success('Usuario creado')
      await loadUsers()
      closeModal()
    }
    setSubmitting(false)
  }

  async function handleDelete(userId) {
    if (isDemoMode) {
      const stored = localStorage.getItem('mlm_demo_users')
      let all = stored ? JSON.parse(stored) : []
      all = all.filter(u => u.id !== userId)
      localStorage.setItem('mlm_demo_users', JSON.stringify(all))
      await loadUsers()
      setDeleteConfirm(null)
      toast.success('Usuario eliminado')
      return
    }

    // Supabase: delete from profiles (auth user deletion requires service key)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
    } else {
      toast.success('Usuario eliminado del sistema')
      await loadUsers()
    }
    setDeleteConfirm(null)
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-orange" />
            Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestioná los usuarios y sus roles</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orangeDark text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Supabase notice */}
      {!isDemoMode && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Modo Supabase:</strong> Podés editar los roles de usuarios existentes.
            Para crear nuevos usuarios, configurá <code className="bg-blue-100 px-1 rounded">VITE_SUPABASE_SERVICE_KEY</code> o usá el panel de Supabase Auth directamente.
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuarios..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Rol</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Creado</th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: create/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editUser ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editUser ? 'Nueva contraseña (dejá en blanco para no cambiar)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="••••••••"
                  {...(!editUser ? { required: true } : {})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="comprador">Comprador</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-orange hover:bg-brand-orangeDark disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? 'Guardando...' : editUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar usuario</h3>
            <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer. ¿Estás seguro?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
