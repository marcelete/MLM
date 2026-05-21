import { supabase } from './supabase'

const BUCKET = 'product-images'

// Sube un File a Supabase Storage y devuelve la URL pública.
// Tira error si Supabase no está configurado o el bucket no existe.
export async function uploadProductImage(file) {
  if (!supabase) throw new Error('Supabase no configurado')
  if (!file) throw new Error('Archivo vacío')
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen supera 5 MB')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}
