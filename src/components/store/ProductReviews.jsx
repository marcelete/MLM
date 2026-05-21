import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StarRating from './StarRating'

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ avg_rating: 0, review_count: 0 })

  useEffect(() => {
    if (!supabase || !productId) { setLoading(false); return }
    Promise.all([
      supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false }),
      supabase.from('product_rating_summary').select('*').eq('product_id', productId).maybeSingle(),
    ]).then(([r, s]) => {
      setReviews(r.data || [])
      if (s.data) setSummary({ avg_rating: Number(s.data.avg_rating) || 0, review_count: s.data.review_count || 0 })
      setLoading(false)
    })
  }, [productId])

  if (loading) return null

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Opiniones de clientes</h2>
        {summary.review_count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={summary.avg_rating} size={18} />
            <span className="text-sm font-semibold text-gray-700">{summary.avg_rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({summary.review_count})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">Todavía no hay opiniones. ¡Sé el primero en dejar una!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating} size={14} />
                  <span className="font-medium text-sm">{r.customer_name || 'Cliente'}</span>
                  {r.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Compra verificada</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-AR')}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
              {r.admin_reply && (
                <div className="mt-2 pl-3 border-l-2 border-brand-orange bg-orange-50 p-2 rounded text-xs">
                  <p className="font-semibold text-brand-orange">Respuesta de MLM:</p>
                  <p className="text-gray-700">{r.admin_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
