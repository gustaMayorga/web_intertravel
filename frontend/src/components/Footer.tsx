'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden text-white" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #121c2e 100%)'}}>
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/logo-intertravel.png" 
                  alt="InterTravel Logo" 
                  className="h-10 w-auto"
                />
                <div>
                  <h3 className="text-2xl font-bold"></h3>
                  <p className="text-sm" style={{color: '#b38144'}}></p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Conectando sueños con destinos únicos desde 2010. 
                Tour Operador Mayorista certificado con experiencias premium y atención personalizada.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                <a href="https://facebook.com/intertravel" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/intertravel" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-500 transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://wa.me/5492615551234" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-500 transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.251"/>
                  </svg>
                </a>
                <a href="https://youtube.com/@intertravel" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h4 className="text-lg font-bold mb-6" style={{color: '#b38144'}}>Navegación</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                    </svg>
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/paquetes" className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                    Paquetes
                  </Link>
                </li>
                <li>
                  <Link href="/ride" className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                    </svg>
                    RIDE
                  </Link>
                </li>
                <li>
                  <Link href="/nosotros" className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    Nosotros
                  </Link>
                </li>
                <li>
                  <Link href="/agencias" className="font-semibold hover:translate-x-2 transition-all duration-300 inline-block flex items-center gap-2" style={{color: '#b38144'}}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                    Agencias
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-bold mb-6" style={{color: '#b38144'}}>Servicios</h4>
              <ul className="space-y-3">
                <li className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" style={{color: '#b38144'}} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5zM12 18H8v-7h4v7z"/>
                  </svg>
                  Vuelos Chárter
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" style={{color: '#b38144'}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                  Hoteles Premium
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" style={{color: '#b38144'}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                  </svg>
                  Viajes Personalizados
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" style={{color: '#b38144'}} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  Grupos Especiales
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" style={{color: '#b38144'}} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                  </svg>
                  RIDE - Viajes de Egresados
                </li>
                <li className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" style={{color: '#b38144'}} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 000 1.788l4 2.447V13a1 1 0 11-2 0v2.236a1 1 0 00-1.447.894zM7 6a1 1 0 000 2v6a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 100-2H8a1 1 0 00-1 1z"/>
                  </svg>
                  Programa Agencias
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-bold mb-6" style={{color: '#b38144'}}>Contacto</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 mt-1">📧</span>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <a href="mailto:ventas@intertravel.com.ar" className="text-white hover:text-blue-300 transition-colors">
                      ventas@intertravel.com.ar
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 mt-1">📱</span>
                  <div>
                    <p className="text-sm text-gray-400">WhatsApp</p>
                    <a href="https://wa.me/5492611234567" className="text-white hover:text-green-300 transition-colors">
                      +54 261 123-4567
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-orange-400 mt-1">📍</span>
                  <div>
                    <p className="text-sm text-gray-400">Ubicación</p>
                    <p className="text-white">Argentina</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 mt-1">🕐</span>
                  <div>
                    <p className="text-sm text-gray-400">Horarios</p>
                    <p className="text-white">Lun-Vie 9:00-18:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              
              {/* Copyright */}
              <div className="text-center md:text-left">
                <p className="text-gray-300">
                  © {new Date().getFullYear()} InterTravel Group. Todos los derechos reservados.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  TOUR OPERADOR MAYORISTA EVyT 15.566 | Legajo 18.259
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                  <Link href="/politica-privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                  <Link href="/politica-cookies" className="hover:text-white transition-colors">
                    Política de Cookies
                  </Link>
                  <Link href="/terminos-condiciones" className="hover:text-white transition-colors">
                    Términos y Condiciones
                  </Link>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sitio web desarrollado con tecnología Next.js y diseño responsivo
                </p>
              </div>

              {/* Certifications */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">EVyT</span>
                  </div>
                  <p className="text-xs text-gray-400">Certificado</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xs">RIDE</span>
                  </div>
                  <p className="text-xs text-gray-400">Experiencia</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">98%</span>
                  </div>
                  <p className="text-xs text-gray-400">Satisfacción</p>
                </div>
              </div>

              {/* Back to Top */}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-lg"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}