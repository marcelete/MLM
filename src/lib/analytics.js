/**
 * Visitor Analytics & Tracking Module
 * Works with Supabase when available, falls back to localStorage
 */

import { supabase } from './supabase'

const VISITOR_COOKIE_KEY = 'mlm_visitor_id'
const SESSION_KEY = 'mlm_session_id'
const PENDING_EVENTS_KEY = 'mlm_pending_events'
const COOKIE_EXPIRY_DAYS = 365

// Si las tablas de analytics no existen en la BD, desactivamos el módulo
// durante la sesión para no llenar la consola de warnings ni gastar requests.
let analyticsDisabled = false
function disableAnalytics(reason) {
  if (analyticsDisabled) return
  analyticsDisabled = true
  console.info('[analytics] desactivado:', reason)
}
function isFatalSchemaError(error) {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return (
    msg.includes('does not exist') ||
    msg.includes('not find the table') ||
    msg.includes('not find the column') ||
    msg.includes('schema cache')
  )
}

// ──────────────────────────────────────────────────────────────
// ID Helpers
// ──────────────────────────────────────────────────────────────

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function setCookie(name, value, days) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

// ──────────────────────────────────────────────────────────────
// Visitor ID (persists 1 year via cookie)
// ──────────────────────────────────────────────────────────────

export function getVisitorId() {
  let visitorId = getCookie(VISITOR_COOKIE_KEY)
  if (!visitorId) {
    visitorId = `v_${generateId()}`
    setCookie(VISITOR_COOKIE_KEY, visitorId, COOKIE_EXPIRY_DAYS)
  }
  return visitorId
}

// ──────────────────────────────────────────────────────────────
// Session ID (persists in sessionStorage - expires on tab close)
// ──────────────────────────────────────────────────────────────

export function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `s_${generateId()}`
    sessionStorage.setItem(SESSION_KEY, sessionId)
    // Create session record
    createVisitorSession(sessionId).catch(() => {})
  }
  return sessionId
}

// ──────────────────────────────────────────────────────────────
// Device info
// ──────────────────────────────────────────────────────────────

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    platform: navigator.platform,
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
  }
}

// ──────────────────────────────────────────────────────────────
// Pending events queue (localStorage fallback)
// ──────────────────────────────────────────────────────────────

function getPendingEvents() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_EVENTS_KEY) || '[]')
  } catch {
    return []
  }
}

function savePendingEvent(event) {
  try {
    const pending = getPendingEvents()
    pending.push(event)
    // Keep max 500 events to avoid localStorage overflow
    if (pending.length > 500) pending.splice(0, pending.length - 500)
    localStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(pending))
  } catch (e) {
    console.warn('Analytics: could not save to localStorage', e)
  }
}

function clearPendingEvents() {
  localStorage.removeItem(PENDING_EVENTS_KEY)
}

// ──────────────────────────────────────────────────────────────
// Session creation
// ──────────────────────────────────────────────────────────────

async function createVisitorSession(sessionId) {
  if (!supabase || analyticsDisabled) return
  const visitorId = getVisitorId()
  const sessionData = {
    id: sessionId,
    visitor_id: visitorId,
    started_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    pages_visited: 0,
    device_info: getDeviceInfo(),
    referrer: document.referrer || null,
  }
  try {
    const { error } = await supabase.from('visitor_sessions').upsert(sessionData)
    if (error && isFatalSchemaError(error)) disableAnalytics('tabla visitor_sessions no encontrada')
  } catch {
    // silencioso
  }
}

async function updateSession() {
  if (!supabase || analyticsDisabled) return
  const sessionId = getSessionId()
  try {
    const { error } = await supabase
      .from('visitor_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error && isFatalSchemaError(error)) disableAnalytics('tabla visitor_sessions no encontrada')
  } catch {
    // silencioso
  }
}

// ──────────────────────────────────────────────────────────────
// Core track function
// ──────────────────────────────────────────────────────────────

export async function track(eventType, eventData = {}) {
  const visitorId = getVisitorId()
  const sessionId = getSessionId()

  const event = {
    session_id: sessionId,
    visitor_id: visitorId,
    event_type: eventType,
    event_data: eventData,
    page_url: window.location.href,
    created_at: new Date().toISOString(),
  }

  if (!supabase || analyticsDisabled) {
    savePendingEvent(event)
    return
  }

  try {
    const { error } = await supabase.from('analytics_events').insert(event)
    if (error) {
      if (isFatalSchemaError(error)) {
        disableAnalytics('tabla analytics_events no encontrada')
      }
      savePendingEvent(event)
    } else {
      flushPendingEvents()
    }
  } catch {
    savePendingEvent(event)
  }
}

// ──────────────────────────────────────────────────────────────
// Sync pending events when Supabase becomes available
// ──────────────────────────────────────────────────────────────

async function flushPendingEvents() {
  if (!supabase || analyticsDisabled) return
  const pending = getPendingEvents()
  if (pending.length === 0) return
  try {
    const { error } = await supabase.from('analytics_events').insert(pending)
    if (!error) clearPendingEvents()
    else if (isFatalSchemaError(error)) disableAnalytics('tabla analytics_events no encontrada')
  } catch {
    // silencioso
  }
}

// ──────────────────────────────────────────────────────────────
// Convenience tracking functions
// ──────────────────────────────────────────────────────────────

export function trackPageView(path, title) {
  return track('page_view', { path: path || window.location.pathname, title: title || document.title })
}

export function trackProductView(product) {
  return track('product_view', {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    category_id: product.category_id,
    base_price: product.base_price,
  })
}

export function trackAddToCart(product, variant, quantity) {
  return track('add_to_cart', {
    product_id: product.id,
    product_name: product.name,
    variant_id: variant?.id,
    variant_desc: variant ? `${variant.size} / ${variant.color} / ${variant.model}` : null,
    quantity,
    unit_price: product.base_price,
    total_price: product.base_price * quantity,
  })
}

export function trackRemoveFromCart(productId, productName, quantity) {
  return track('remove_from_cart', { product_id: productId, product_name: productName, quantity })
}

export function trackCheckoutStarted(cartItems, subtotal) {
  return track('checkout_started', {
    item_count: cartItems.length,
    subtotal,
    items: cartItems.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
    })),
  })
}

export function trackCheckoutCompleted(orderId, total, paymentMethod) {
  return track('checkout_completed', { order_id: orderId, total, payment_method: paymentMethod })
}

export function trackSearch(query, resultsCount) {
  return track('search', { query, results_count: resultsCount })
}

// ──────────────────────────────────────────────────────────────
// Cart abandonment detection
// ──────────────────────────────────────────────────────────────

const CHECKOUT_STARTED_KEY = 'mlm_checkout_started'

export function markCheckoutStarted(cartData) {
  sessionStorage.setItem(
    CHECKOUT_STARTED_KEY,
    JSON.stringify({ cartData, startedAt: Date.now() })
  )
}

export function markCheckoutCompleted() {
  sessionStorage.removeItem(CHECKOUT_STARTED_KEY)
}

export function checkCartAbandonment() {
  const raw = sessionStorage.getItem(CHECKOUT_STARTED_KEY)
  if (!raw) return

  try {
    const { cartData, startedAt } = JSON.parse(raw)
    const elapsed = Date.now() - startedAt
    // If more than 2 minutes have passed since checkout was started and page changed
    if (elapsed > 2 * 60 * 1000) {
      track('cart_abandoned', {
        cart_data: cartData,
        time_in_checkout_ms: elapsed,
      })
      sessionStorage.removeItem(CHECKOUT_STARTED_KEY)
    }
  } catch {}
}

// Run abandonment check on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    checkCartAbandonment()
    // Sync pending events on load
    setTimeout(flushPendingEvents, 2000)
  })

  // Update session on visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateSession()
  })
}
