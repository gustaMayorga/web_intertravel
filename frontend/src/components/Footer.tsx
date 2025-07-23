'use client';

import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Facebook, 
  Instagram, 
  Youtube, 
  Shield,
  Award,
  Home,
  Package,
  Globe,
  Users,
  Star,
  ArrowUp,
  ExternalLink
} from 'lucide-react';

export default function Footer() {
  // 🎨 COLORES UNIFICADOS DE LA MARCA INTERTRAVEL
  const brandColors = {
    primary: '#16213e',      // Azul marino corporativo
    secondary: '#b38144',    // Dorado elegante
    accent: '#2563eb',       // Azul moderno
    background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #16213e 100%)',
    text: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      muted: '#94a3b8'
    }
  };

  return (
    <footer className="relative overflow-hidden text-white" style={{background: brandColors.background}}>
      {/* Background Effects Unificados */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" 
             style={{backgroundColor: brandColors.accent}}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" 
             style={{backgroundColor: brandColors.secondary, animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* 🏢 Company Info - Unificado */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                     style={{backgroundColor: brandColors.secondary}}>
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{color: brandColors.text.primary}}>
                    InterTravel
                  </h3>
                  <p className="text-sm" style={{color: brandColors.secondary}}>
                    Group
                  </p>
                </div>
              </div>
              <p className="mb-6 leading-relaxed" style={{color: brandColors.text.secondary}}>
                Conectando sueños con destinos únicos. 
                Tour Operador Mayorista certificado con experiencias premium.
              </p>
              
              {/* 📱 Social Media - Íconos Unificados */}
              <div className="flex space-x-3">
                <a href="https://facebook.com/intertravel" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-blue-600"
                   style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/intertravel" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-pink-500"
                   style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://wa.me/5492615551234" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-green-500"
                   style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                  <Phone className="w-5 h-5" />
                </a>
                <a href="https://youtube.com/@intertravel" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-red-500"
                   style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* 🧭 Navigation Links - Íconos Profesionales */}
            <div>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2" style={{color: brandColors.secondary}}>
                <Home className="w-5 h-5" />
                Navegación
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" 
                        className="flex items-center gap-3 transition-all duration-300 hover:translate-x-2 group"
                        style={{color: brandColors.text.secondary}}>
                    <Home className="w-4 h-4 group-hover:text-white transition-colors" style={{color: brandColors.secondary}} />
                    <span className="group-hover:text-white">Inicio</span>
                  </Link>
                </li>
                <li>
                  <Link href="/paquetes" 
                        className="flex items-center gap-3 transition-all duration-300 hover:translate-x-2 group"
                        style={{color: brandColors.text.secondary}}>
                    <Package className="w-4 h-4 group-hover:text-white transition-colors" style={{color: brandColors.secondary}} />
                    <span className="group-hover:text-white">Paquetes</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ride" 
                        className="flex items-center gap-3 transition-all duration-300 hover:translate-x-2 group"
                        style={{color: brandColors.text.secondary}}>
                    <Star className="w-4 h-4 group-hover:text-white transition-colors" style={{color: brandColors.secondary}} />
                    <span className="group-hover:text-white">RIDE</span>
                  </Link>
                </li>
                <li>
                  <Link href="/nosotros" 
                        className="flex items-center gap-3 transition-all duration-300 hover:translate-x-2 group"
                        style={{color: brandColors.text.secondary}}>
                    <Users className="w-4 h-4 group-hover:text-white transition-colors" style={{color: brandColors.secondary}} />
                    <span className="group-hover:text-white">Nosotros</span>
                  </Link>
                </li>
                <li>
                  <a href="https://intertravelgroup.paquetedinamico.com/home?tripId=4" 
                     className="flex items-center gap-3 font-semibold transition-all duration-300 hover:translate-x-2 group"
                     style={{color: brandColors.secondary}}>
                    <ExternalLink className="w-4 h-4 group-hover:text-white transition-colors" />
                    <span className="group-hover:text-white">Portal Agencias</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* 🛎️ Services - Iconografía Unificada */}
            <div>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2" style={{color: brandColors.secondary}}>
                <Shield className="w-5 h-5" />
                Servicios
              </h4>
              <ul className="space-y-3">
                {[
                  { icon: Globe, text: "Vuelos Chárter" },
                  { icon: Home, text: "Hoteles Premium" },
                  { icon: Star, text: "Viajes Personalizados" },
                  { icon: Users, text: "Grupos Especiales" },
                  { icon: Award, text: "RIDE - Quinceañeras" },
                  { icon: Package, text: "Programa Agencias" }
                ].map((service, index) => (
                  <li key={index} className="flex items-center gap-3" style={{color: brandColors.text.secondary}}>
                    <service.icon className="w-4 h-4" style={{color: brandColors.secondary}} />
                    <span>{service.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 📞 Contact Info - Diseño Profesional */}
            <div>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2" style={{color: brandColors.secondary}}>
                <Phone className="w-5 h-5" />
                Contacto
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" 
                       style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                    <Mail className="w-4 h-4" style={{color: brandColors.secondary}} />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: brandColors.text.muted}}>Email</p>
                    <a href="mailto:ventas@intertravel.com.ar" 
                       className="transition-colors group-hover:text-white"
                       style={{color: brandColors.text.primary}}>
                      ventas@intertravel.com.ar
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" 
                       style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                    <Phone className="w-4 h-4" style={{color: brandColors.secondary}} />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: brandColors.text.muted}}>WhatsApp</p>
                    <a href="https://wa.me/5492611234567" 
                       className="transition-colors group-hover:text-white"
                       style={{color: brandColors.text.primary}}>
                      +54 261 123-4567
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" 
                       style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                    <MapPin className="w-4 h-4" style={{color: brandColors.secondary}} />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: brandColors.text.muted}}>Ubicación</p>
                    <p style={{color: brandColors.text.primary}}>Mendoza, Argentina</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" 
                       style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                    <Clock className="w-4 h-4" style={{color: brandColors.secondary}} />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: brandColors.text.muted}}>Horarios</p>
                    <p style={{color: brandColors.text.primary}}>Lun-Vie 9:00-18:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📜 Bottom Section - Certificaciones Profesionales */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              
              {/* Copyright */}
              <div className="text-center md:text-left">
                <p style={{color: brandColors.text.secondary}}>
                  © {new Date().getFullYear()} InterTravel Group. Todos los derechos reservados.
                </p>
                <p className="text-sm mt-1" style={{color: brandColors.text.muted}}>
                  TOUR OPERADOR MAYORISTA EVyT 15.566 | Legajo 18.259
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{color: brandColors.text.muted}}>
                  <Link href="/politica-privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                  <Link href="/politica-cookies" className="hover:text-white transition-colors">
                    Política de Cookies
                  </Link>
                  <Link href="/terminos-condiciones" className="hover:text-white transition-colors">
                    Términos y Condiciones
                  </Link>
                  <button onClick={() => {
                    const event = new CustomEvent('openCookieSettings');
                    window.dispatchEvent(event);
                  }} className="hover:text-white transition-colors">
                    Configurar Cookies
                  </button>
                </div>
              </div>

              {/* 🏆 Certifications - Badges Unificados */}
              <div className="flex items-center space-x-4">
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110" 
                       style={{background: `linear-gradient(135deg, ${brandColors.accent}, ${brandColors.primary})`}}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs" style={{color: brandColors.text.muted}}>EVyT Certificado</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110" 
                       style={{background: `linear-gradient(135deg, ${brandColors.secondary}, #d4af37)`}}>
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs" style={{color: brandColors.text.muted}}>23K+ Horas</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110" 
                       style={{background: `linear-gradient(135deg, #10b981, #059669)`}}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs" style={{color: brandColors.text.muted}}>3000+ Clientes</p>
                </div>
              </div>

              {/* 🔝 Back to Top - Botón Unificado */}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg group"
                style={{background: `linear-gradient(135deg, ${brandColors.accent}, ${brandColors.secondary})`}}
              >
                <ArrowUp className="w-5 h-5 text-white group-hover:animate-bounce" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}