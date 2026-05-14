// Static product data - used as fallback when Supabase is not configured
// All prices in ARS

export const PAYMENT_SURCHARGES = {
  efectivo: 0,
  transferencia: 0,
  debito: 0.10,
  credito: 0.20,
}

export const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
  debito: 'Débito / QR MercadoPago',
  credito: 'Tarjeta de crédito (3 cuotas s/i)',
}

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
export const MODELS = ['Hombre', 'Mujer', 'Unisex']
export const COLORS = [
  { name: 'Blanco', hex: '#FFFFFF', border: true },
  { name: 'Negro', hex: '#1a1a1a' },
  { name: 'Azul', hex: '#1d4ed8' },
  { name: 'Verde', hex: '#15803d' },
  { name: 'Rojo', hex: '#dc2626' },
  { name: 'Celeste', hex: '#38bdf8' },
  { name: 'Bordó', hex: '#881337' },
  { name: 'Gris', hex: '#6b7280' },
]

export const categories = [
  {
    id: 'cat-ambos',
    name: 'Ambos',
    slug: 'ambos',
    description: 'Ambos profesionales para salud y limpieza',
    active: true,
  },
  {
    id: 'cat-delantales',
    name: 'Delantales',
    slug: 'delantales',
    description: 'Delantales para docentes, cocina y escolares',
    active: true,
  },
]

// Placeholder images from unsplash for demo
const AMBO_IMAGES = [
  'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80',
  'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&q=80',
]
const DELANTAL_IMAGES = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80',
]

export const products = [
  {
    id: 'prod-ambo-completo',
    name: 'Ambo Completo',
    slug: 'ambo-completo',
    description:
      'Ambo profesional completo (pantalón + chaqueta) en tela Arciel de primera calidad. Ideal para personal de salud, limpieza hospitalaria, laboratorios y empresas que requieren uniforme estándar. Corte cómodo con bolsillos funcionales en chaqueta y pantalón. Disponible en 8 colores y tallas XS a XXXL en modelos masculino y femenino.',
    category_id: 'cat-ambos',
    base_price: 70000,
    images: AMBO_IMAGES,
    active: true,
    featured: true,
    material: 'Arciel',
    hasVariants: true,
    variantTypes: ['size', 'color', 'model'],
    variants: generateAmboVariants('prod-ambo-completo', 70000),
  },
  {
    id: 'prod-ambo-pantalon',
    name: 'Ambo - Solo Pantalón',
    slug: 'ambo-pantalon',
    description:
      'Pantalón de ambo profesional en tela Arciel. Cintura elástica y bolsillos laterales. Perfecto para reponer prendas individuales o combinar con tu propio uniforme. Disponible en todos los colores estándar, tallas XS a XXXL en cortes hombre y mujer.',
    category_id: 'cat-ambos',
    base_price: 38000,
    images: [AMBO_IMAGES[0]],
    active: true,
    featured: false,
    material: 'Arciel',
    hasVariants: true,
    variantTypes: ['size', 'color', 'model'],
    variants: generateAmboVariants('prod-ambo-pantalon', 38000),
  },
  {
    id: 'prod-ambo-chaqueta',
    name: 'Ambo - Solo Chaqueta',
    slug: 'ambo-chaqueta',
    description:
      'Chaqueta de ambo profesional en tela Arciel. Cierre con botones a presión, cuello redondo y bolsillos laterales con bolsillo superior para lapicera. Diseño ergonómico para mayor comodidad en largas jornadas de trabajo. Disponible en todos los colores, tallas XS a XXXL.',
    category_id: 'cat-ambos',
    base_price: 38000,
    images: [AMBO_IMAGES[1]],
    active: true,
    featured: false,
    material: 'Arciel',
    hasVariants: true,
    variantTypes: ['size', 'color', 'model'],
    variants: generateAmboVariants('prod-ambo-chaqueta', 38000),
  },
  {
    id: 'prod-delantal-docente',
    name: 'Delantal Docente Inicial',
    slug: 'delantal-docente-inicial',
    description:
      'Delantal docente para nivel inicial en color azul institucional. Confeccionado en tela resistente y lavable. Con frente liso, botones laterales y bolsillos amplios para materiales de trabajo. El favorito de las maestras jardineras de CABA y GBA. Talle único con sistema de ajuste.',
    category_id: 'cat-delantales',
    base_price: 22000,
    images: [DELANTAL_IMAGES[0]],
    active: true,
    featured: true,
    hasVariants: false,
    variantTypes: [],
    variants: [],
    color: 'Azul',
    talle: 'Talle único ajustable',
  },
  {
    id: 'prod-delantal-cocina',
    name: 'Delantal de Cocina',
    slug: 'delantal-cocina',
    description:
      'Delantal de cocina profesional resistente a manchas y salpicaduras. Tira cruzada en la espalda para mejor ajuste. Con bolsillo utilitario al frente. Ideal para gastronomía, cocinas industriales, catering y uso hogareño intensivo. Material de fácil lavado y secado rápido.',
    category_id: 'cat-delantales',
    base_price: 20000,
    images: [DELANTAL_IMAGES[1]],
    active: true,
    featured: true,
    hasVariants: false,
    variantTypes: [],
    variants: [],
    color: 'Negro / Varios',
    talle: 'Talle único ajustable',
  },
  {
    id: 'prod-delantal-escolar',
    name: 'Delantal Escolar Blanco',
    slug: 'delantal-escolar-blanco',
    description:
      'Delantal escolar blanco clásico para nivel primario. Confeccionado en tela popelín blanca de alta calidad, fácil de lavar y planchar. Con botones frontales y bolsillos a los costados. Diseño tradicional que mantiene la elegancia del uniforme escolar argentino. Talles del 2 al 16.',
    category_id: 'cat-delantales',
    base_price: 18000,
    images: [DELANTAL_IMAGES[0]],
    active: true,
    featured: false,
    hasVariants: false,
    variantTypes: [],
    variants: [],
    color: 'Blanco',
    talle: 'Talles 2 al 16',
  },
]

function generateAmboVariants(productId, basePrice) {
  const variants = []
  let skuCounter = 1
  SIZES.forEach((size) => {
    COLORS.forEach((color) => {
      MODELS.filter((m) => m !== 'Unisex').forEach((model) => {
        variants.push({
          id: `var-${productId}-${size}-${color.name}-${model}`.toLowerCase().replace(/\s/g, '-'),
          product_id: productId,
          size,
          color: color.name,
          model,
          stock: Math.floor(Math.random() * 20) + 2, // random demo stock 2-21
          sku: `SKU-${productId.slice(-4).toUpperCase()}-${size}-${color.name.slice(0,3).toUpperCase()}-${model.slice(0,3).toUpperCase()}-${skuCounter++}`,
          base_price: basePrice,
        })
      })
    })
  })
  return variants
}

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug) || null
}

export function getProductsByCategory(categorySlug) {
  if (!categorySlug) return products.filter((p) => p.active)
  const cat = categories.find((c) => c.slug === categorySlug)
  if (!cat) return products.filter((p) => p.active)
  return products.filter((p) => p.active && p.category_id === cat.id)
}

export function getFeaturedProducts() {
  return products.filter((p) => p.active && p.featured)
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getPriceForMethod(basePrice, method) {
  const surcharge = PAYMENT_SURCHARGES[method] || 0
  return basePrice * (1 + surcharge)
}
