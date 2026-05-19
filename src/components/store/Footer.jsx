import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Instagram, Facebook, MessageCircle, MapPin, Phone, Mail } from 'lucide-react'

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000'

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-brand-orange rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-white font-bold text-lg leading-none">MLM</span>
                <span className="block text-brand-orange text-xs font-medium tracking-wide uppercase">
                  Ropa de Trabajo
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Proveemos uniformes y ropa de trabajo profesional para el sector salud, limpieza y educación en CABA y GBA.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 hover:bg-brand-orange rounded-full flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 hover:bg-brand-orange rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 hover:bg-brand-orange rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4">Tienda</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/catalogo" className="hover:text-brand-orange transition-colors">Todo el catálogo</Link></li>
              <li><Link to="/catalogo?categoria=ambos" className="hover:text-brand-orange transition-colors">Ambos profesionales</Link></li>
              <li><Link to="/catalogo?categoria=delantales" className="hover:text-brand-orange transition-colors">Delantales</Link></li>
              <li><Link to="/carrito" className="hover:text-brand-orange transition-colors">Mi carrito</Link></li>
              <li><Link to="/checkout" className="hover:text-brand-orange transition-colors">Checkout</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Información</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-orange transition-colors">Guía de talles</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Política de envíos</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Cambios y devoluciones</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Preguntas frecuentes</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Formas de pago</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-brand-orange flex-shrink-0" />
                <span>Ciudad Autónoma de Buenos Aires, Argentina</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-orange flex-shrink-0" />
                <a href={`https://wa.me/${WA_NUMBER}`} className="hover:text-brand-orange transition-colors">
                  +54 9 11 XXXX-XXXX
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-orange flex-shrink-0" />
                <a href="mailto:info@mlm.com.ar" className="hover:text-brand-orange transition-colors">
                  info@mlm.com.ar
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-orange flex-shrink-0" />
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-orange transition-colors"
                >
                  WhatsApp disponible
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} MLM Ropa de Trabajo. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png" alt="MercadoPago" className="h-5 opacity-60" />
          </div>
        </div>
      </div>
    </footer>
  )
}
