import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { products as staticProducts, categories as staticCategories, getProductBySlug as staticGetBySlug } from '../data/products'

/**
 * Hook to fetch all active products
 * Tries Supabase first, falls back to static data
 */
export function useProducts(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)

      if (supabase) {
        try {
          let query = supabase
            .from('products')
            .select(`
              *,
              categories(id, name, slug),
              product_variants(*)
            `)
            .eq('active', true)
            .order('created_at', { ascending: false })

          if (filters.categorySlug) {
            const { data: cat } = await supabase
              .from('categories')
              .select('id')
              .eq('slug', filters.categorySlug)
              .single()
            if (cat) query = query.eq('category_id', cat.id)
          }

          if (filters.featured) {
            query = query.eq('featured', true)
          }

          const { data: rows, error: err } = await query

          if (!cancelled) {
            if (err) {
              console.warn('useProducts: Supabase error, using static data', err.message)
              setData(filterStatic(staticProducts, filters))
            } else {
              setData(rows || [])
            }
            setLoading(false)
          }
          return
        } catch (e) {
          console.warn('useProducts: exception, using static data', e)
        }
      }

      if (!cancelled) {
        setData(filterStatic(staticProducts, filters))
        setLoading(false)
      }
    }

    fetchProducts()
    return () => { cancelled = true }
  }, [filters.categorySlug, filters.featured])

  return { data, loading, error }
}

function filterStatic(products, filters) {
  let result = products.filter((p) => p.active)
  if (filters.categorySlug) {
    const cat = staticCategories.find((c) => c.slug === filters.categorySlug)
    if (cat) result = result.filter((p) => p.category_id === cat.id)
  }
  if (filters.featured) {
    result = result.filter((p) => p.featured)
  }
  return result
}

/**
 * Hook to fetch a single product by slug
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchProduct() {
      setLoading(true)

      if (supabase) {
        try {
          const { data, error: err } = await supabase
            .from('products')
            .select(`
              *,
              categories(id, name, slug),
              product_variants(*)
            `)
            .eq('slug', slug)
            .eq('active', true)
            .single()

          if (!cancelled) {
            if (err) {
              console.warn('useProduct: Supabase error, using static data', err.message)
              setProduct(staticGetBySlug(slug))
            } else {
              setProduct(data || null)
            }
            setLoading(false)
          }
          return
        } catch (e) {
          console.warn('useProduct: exception, using static data', e)
        }
      }

      if (!cancelled) {
        setProduct(staticGetBySlug(slug))
        setLoading(false)
      }
    }

    fetchProduct()
    return () => { cancelled = true }
  }, [slug])

  return { product, loading, error }
}

/**
 * Hook for categories
 */
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('active', true)
            .order('name')

          if (!error && data) {
            setCategories(data)
            setLoading(false)
            return
          }
        } catch {}
      }

      setCategories(staticCategories)
      setLoading(false)
    }

    fetchCategories()
  }, [])

  return { categories, loading }
}
