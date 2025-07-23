'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Shield, 
  Award, 
  Users, 
  Globe, 
  Heart,
  Target,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  Handshake,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building,
  Plane,
  Calendar,
  Compass,
  Coffee
} from 'lucide-react';

export default function AboutPage() {
  // Colores de marca unificados según documentación
  const brandColors = {
    primary: '#16213e',      // Azul marino corporativo
    secondary: '#b38144',    // Dorado elegante 
    accent: '#2563eb',       // Azul confianza
    light: '#f8fafc',        // Gris claro
    dark: '#1e293b'          // Gris oscuro
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section Profesional */}
      <section className="relative pt-20 overflow-hidden" 
               style={{background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 50%, ${brandColors.primary} 100%)`}}>
        
        {/* Elementos decorativos sutiles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
               style={{backgroundColor: brandColors.secondary}}></div>
          <div className="absolute -bottom-8 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-1000"
               style={{backgroundColor: brandColors.accent}}></div>
        </div>
        
        <div className="relative z-10 text-white py-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            
            {/* Badge profesional */}
            <div className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-md px-8 py-4 rounded-full mb-8 border border-white/20">
              <Shield className="w-6 h-6" style={{color: brandColors.secondary}} />
              <span className="font-semibold text-lg">EVyT 15.566 • Tour Operador Certificado</span>
              <Award className="w-6 h-6" style={{color: brandColors.secondary}} />
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="block">INTERTRAVEL</span>
              <span className="block bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Group
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-8">
              <strong>Más de 15 años</strong> transformando sueños en experiencias inolvidables. 
              <br className="hidden md:block" />
              Somos el <strong>Tour Operador líder</strong> en innovación y excelencia.
            </p>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Users, number: '5,000+', label: 'Viajeros Felices' },
                { icon: Globe, number: '50+', label: 'Destinos' },
                { icon: Award, number: '15+', label: 'Años Experiencia' },
                { icon: Star, number: '4.9', label: 'Rating Promedio' }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <stat.icon className="w-8 h-8 mx-auto mb-2" style={{color: brandColors.secondary}} />
                  <div className="text-2xl font-bold" style={{color: brandColors.secondary}}>{stat.number}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quiénes Somos - Sección Principal */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Contenido principal */}
            <div>
              <div className="inline-flex items-center space-x-2 mb-6">
                <Building className="w-6 h-6" style={{color: brandColors.accent}} />
                <span className="text-sm font-semibold tracking-wider uppercase" 
                      style={{color: brandColors.accent}}>
                  Nuestra Historia
                </span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{color: brandColors.primary}}>
                Líderes en 
                <span className="block" style={{color: brandColors.secondary}}>
                  Experiencias de Viaje
                </span>
              </h2>

              <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                <p>
                  <strong style={{color: brandColors.primary}}>InterTravel Group</strong> es un tour operador mayorista que redefine 
                  la industria del turismo. Con más de <strong>presencia en 4 países de LATAM</strong>, 
                  hemos evolucionado de una agencia tradicional a una plataforma de viajes inteligente.
                </p>
                <p>
                  Creemos en la <strong style={{color: brandColors.secondary}}>innovación como motor de cambio</strong> y 
                  en la <strong style={{color: brandColors.secondary}}>confianza como pilar fundamental</strong>. 
                  No seguimos esquemas tradicionales; los revolucionamos.
                </p>
                <p>
                  Diseñamos experiencias que no solo cumplen expectativas, sino que las superan, 
                  creando momentos inolvidables para cada viajero. 
                  Nuestro equipo de expertos aporta soporte post venta 7/24, 
                </p>
              </div>

              {/* Puntos clave */}
              <div className="grid md:grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Lightbulb, text: 'Innovación constante' },
                  { icon: Shield, text: 'Seguridad garantizada' },
                  { icon: Heart, text: 'Experiencias únicas' },
                  { icon: Target, text: 'Resultados medibles' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg" 
                       style={{backgroundColor: `${brandColors.light}`}}>
                    <item.icon className="w-5 h-5" style={{color: brandColors.accent}} />
                    <span className="font-medium" style={{color: brandColors.primary}}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual profesional */}
            <div className="relative">
              <div className="bg-gradient-to-br rounded-3xl p-8 text-white shadow-2xl"
                   style={{background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent})`}}>
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                       style={{backgroundColor: brandColors.secondary}}>
                    <Compass className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
                  <p className="text-lg text-white/90">
                    Transformar cada viaje en una experiencia extraordinaria, 
                    conectando personas con destinos de manera innovadora y confiable.
                  </p>
                </div>

                {/* Certificaciones */}
                <div className="border-t border-white/20 pt-6">
                  <h4 className="font-semibold mb-4 text-center">Certificaciones & Membresías</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/10 rounded-lg p-3">
                      <Shield className="w-6 h-6 mx-auto mb-2" style={{color: brandColors.secondary}} />
                      <div className="text-sm font-medium">EVyT 15.566</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <Award className="w-6 h-6 mx-auto mb-2" style={{color: brandColors.secondary}} />
                      <div className="text-sm font-medium">Support Channel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Diferenciados */}
      <section className="py-24" style={{backgroundColor: brandColors.light}}>
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 mb-6">
              <Star className="w-6 h-6" style={{color: brandColors.accent}} />
              <span className="text-sm font-semibold tracking-wider uppercase" 
                    style={{color: brandColors.accent}}>
                Nuestros Servicios
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{color: brandColors.primary}}>
              Creamos <span style={{color: brandColors.secondary}}>Conexiones</span> Excepcionales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dos enfoques especializados para maximizar tu experiencia de viaje
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Para Viajeros */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-l-4" 
                 style={{borderColor: brandColors.accent}}>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mr-6"
                     style={{background: `linear-gradient(135deg, ${brandColors.accent}, ${brandColors.primary})`}}>
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{color: brandColors.primary}}>Para Viajeros</h3>
                  <p className="text-sm" style={{color: brandColors.secondary}}>Experiencias personalizadas</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-gray-600 text-lg">
                  <strong style={{color: brandColors.primary}}>Tu próximo destino empieza aquí:</strong> 
                  Ofrecemos experiencias completas con vuelos exclusivos, traslados premium, 
                  hoteles seleccionados y asistencia 24/7.
                </p>
                
                {/* Características clave */}
                <div className="space-y-3">
                  {[
                    'Vuelos chárter exclusivos',
                    'Hoteles premium verificados',
                    'Traslados privados incluidos',
                    'Asistencia 24/7 en destino'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5" style={{color: brandColors.accent}} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-xl" style={{backgroundColor: `${brandColors.accent}15`}}>
                <p className="font-semibold" style={{color: brandColors.accent}}>
                  💫 Experiencias diseñadas para que disfrutes de principio a fin, sin preocupaciones
                </p>
              </div>
            </div>

            {/* Para Agencias */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-l-4" 
                 style={{borderColor: brandColors.secondary}}>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mr-6"
                     style={{background: `linear-gradient(135deg, ${brandColors.secondary}, #d4af37)`}}>
                  <Handshake className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{color: brandColors.primary}}>Para Agencias</h3>
                  <p className="text-sm" style={{color: brandColors.secondary}}>Programa de socios</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-gray-600 text-lg">
                  <strong style={{color: brandColors.primary}}>Crezcamos juntos:</strong> 
                  Potenciamos tu negocio con nuestro Programa de Socios, respetando la cadena 
                  de distribución y aportando visión de futuro.
                </p>
                
                {/* Beneficios para agencias */}
                <div className="space-y-3">
                  {[
                    'Comisiones competitivas hasta 15%',
                    'Plataforma B2B exclusiva',
                    'Soporte comercial especializado',
                    'Material promocional gratuito'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5" style={{color: brandColors.secondary}} />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-xl" style={{backgroundColor: `${brandColors.secondary}15`}}>
                <p className="font-semibold" style={{color: '#8b5a2b'}}>
                  🤝 Somos el respaldo que necesitás para ofrecer lo mejor a cada cliente
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ventajas Competitivas */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 mb-6">
              <TrendingUp className="w-6 h-6" style={{color: brandColors.accent}} />
              <span className="text-sm font-semibold tracking-wider uppercase" 
                    style={{color: brandColors.accent}}>
                Ventajas Competitivas
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{color: brandColors.primary}}>
              ¿Por qué <span style={{color: brandColors.secondary}}>elegirnos?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrecemos ventajas únicas que nos posicionan como líderes en el mercado turístico
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Plane,
                title: 'Chárters Exclusivos',
                description: 'Operaciones propias con vuelos directos que garantizan comodidad y eficiencia única en el mercado.',
                color: brandColors.accent
              },
              {
                icon: Globe,
                title: 'Turismo Sin Límites',
                description: 'Itinerarios diseñados para sorprender en cada destino, con experiencias auténticas y memorables.',
                color: brandColors.secondary
              },
              {
                icon: Shield,
                title: 'Respaldo Total',
                description: 'Trabajamos con operadores de primer nivel para garantizar confianza absoluta en cada viaje.',
                color: brandColors.accent
              },
              {
                icon: Users,
                title: 'Network de Socios',
                description: 'Crecemos junto a agencias partner, apostando por modelos de negocio innovadores y rentables.',
                color: brandColors.secondary
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-all duration-300 bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
                     style={{background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`}}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-opacity-80 transition-colors"
                    style={{color: brandColors.primary}}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores Corporativos */}
      <section className="py-24 text-white" 
               style={{background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.dark} 50%, ${brandColors.primary} 100%)`}}>
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 mb-6">
              <Heart className="w-6 h-6" style={{color: brandColors.secondary}} />
              <span className="text-sm font-semibold tracking-wider uppercase" 
                    style={{color: brandColors.secondary}}>
                Nuestros Valores
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              ¿Por qué hacemos <span style={{color: brandColors.secondary}}>lo que hacemos?</span>
            </h2>
            <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              Porque el turismo no se trata solo de destinos, sino de cómo llegamos a ellos. 
              Nos impulsa desafiar lo establecido, crear con propósito y abrir oportunidades 
              para quienes confían en nosotros.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lightbulb,
                title: 'Innovación',
                description: 'Como motor de cambio, buscamos constantemente nuevas formas de mejorar la experiencia de viaje y superar expectativas.',
                gradient: `linear-gradient(135deg, ${brandColors.secondary}, #d4af37)`
              },
              {
                icon: Handshake,
                title: 'Confianza',
                description: 'Como pilar fundamental, construimos relaciones sólidas basadas en la transparencia, profesionalismo y resultados.',
                gradient: `linear-gradient(135deg, ${brandColors.accent}, ${brandColors.primary})`
              },
              {
                icon: Target,
                title: 'Propósito',
                description: 'Creamos con intención clara, desafiando lo establecido para abrir nuevas oportunidades y generar valor sostenible.',
                gradient: `linear-gradient(135deg, ${brandColors.secondary}, ${brandColors.accent})`
              }
            ].map((value, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center hover:bg-white/15 transition-all duration-300">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                     style={{background: value.gradient}}>
                  <value.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{color: brandColors.secondary}}>
                  {value.title}
                </h3>
                <p className="text-white/80 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto Profesional */}
      <section className="py-24 text-white" 
               style={{background: `linear-gradient(135deg, ${brandColors.secondary} 0%, #d4af37 100%)`}}>
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              ¿Listo para tu próxima <span className="text-white/90">aventura?</span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Contactanos y déjanos transformar tus sueños de viaje en realidad
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            
            {/* Información de contacto */}
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Building className="w-8 h-8 mr-4 text-white" />
                <h3 className="text-2xl font-bold">Nuestra Oficina</h3>
              </div>
              <div className="space-y-4 text-white/90">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Chacras Park, Edificio Ceibo</p>
                    <p>Oficinas 105, 307, 404, 405</p>
                    <p>Luján de Cuyo, Mendoza, Argentina</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p>Lun-Vie: 9:00-18:00</p>
                    <p>Sábados: 9:00-13:00</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Canales de comunicación */}
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <Phone className="w-8 h-8 mr-4 text-white" />
                <h3 className="text-2xl font-bold">Canales de Contacto</h3>
              </div>
              <div className="space-y-4 text-white/90">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">ventas@intertravel.com.ar</p>
                    <p className="text-sm">Consultas generales y cotizaciones</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">+54 9 261 5555-558</p>
                    <p className="text-sm">Atención telefónica directa</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Coffee className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Reuniones presenciales</p>
                    <p className="text-sm">Agenda tu cita personalizada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/paquetes">
              <button className="bg-white font-bold py-4 px-8 rounded-full hover:bg-white/90 transition-all shadow-lg hover:shadow-xl"
                      style={{color: brandColors.primary}}>
                <span className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Explorar Paquetes</span>
                </span>
              </button>
            </Link>
            <a 
              href="https://wa.me/5492615555558"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-8 rounded-full hover:bg-white/30 transition-all"
            >
              <span className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>WhatsApp Directo</span>
              </span>
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}