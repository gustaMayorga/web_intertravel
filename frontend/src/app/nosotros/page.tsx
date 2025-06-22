'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20" style={{background: 'linear-gradient(135deg, #3b1c5a 0%, #6d28d9 50%, #8b5cf6 100%)'}}>
        {/* Efectos de partículas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-violet-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="relative z-10 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-violet-200/30">
              <span className="text-2xl">🏆</span>
              <span className="font-medium">EVyT 15.566 • Más de 15 años de experiencia</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-violet-200 to-purple-200 bg-clip-text text-transparent">
                InterTravel Group
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Somos un <strong>Tour Operador Mayorista</strong> especializado en crear experiencias 
              de viaje únicas y memorables desde hace más de 15 años.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Nuestra <span className="text-blue-600">Historia</span>
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p className="text-lg">
                  <strong>InterTravel Group</strong> nació en Mendoza con una visión clara: 
                  democratizar los viajes de calidad y hacer que destinos soñados sean 
                  accesibles para todos los argentinos.
                </p>
                <p>
                  Con más de <strong>15 años de experiencia</strong> en el mercado turístico, 
                  nos hemos consolidado como uno de los tour operadores mayoristas más 
                  confiables del país, con la habilitación <strong>EVyT 15.566</strong>.
                </p>
                <p>
                  Nuestra sede central está ubicada en <strong>Chacras Park, Edificio Ceibo</strong>, 
                  Luján de Cuyo, Mendoza, desde donde coordinamos operaciones para todo el país.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">15+</div>
                    <div className="text-violet-100">Años de experiencia</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">10K+</div>
                    <div className="text-violet-100">Viajeros felices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">500+</div>
                    <div className="text-violet-100">Destinos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">98%</div>
                    <div className="text-violet-100">Satisfacción</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestra Misión */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Nuestra <span className="text-violet-600">Misión</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Conectar Destinos</h3>
              <p className="text-gray-600">
                Acercamos los destinos más increíbles del mundo a cada viajero argentino.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Experiencias Únicas</h3>
              <p className="text-gray-600">
                Diseñamos cada viaje con atención al detalle para crear recuerdos inolvidables.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confianza Total</h3>
              <p className="text-gray-600">
                Brindamos tranquilidad y seguridad en cada etapa del viaje de nuestros clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Servicios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Nuestros <span className="text-violet-600">Servicios</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrecemos una gama completa de servicios turísticos para satisfacer todas las necesidades de viaje
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '✈️',
                title: 'Paquetes Turísticos',
                description: 'Destinos nacionales e internacionales con todo incluido'
              },
              {
                icon: '🎓',
                title: 'Viajes de Egresados',
                description: 'Experiencias especiales para celebrar el fin de estudios'
              },
              {
                icon: '🏢',
                title: 'Turismo Corporativo',
                description: 'Soluciones integrales para empresas y grupos'
              },
              {
                icon: '🎯',
                title: 'Viajes a Medida',
                description: 'Itinerarios personalizados según preferencias'
              }
            ].map((service, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-violet-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestro Equipo */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-violet-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Nuestro <span className="text-violet-300">Equipo</span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Un equipo de profesionales apasionados por los viajes y comprometidos con la excelencia
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Equipo Comercial',
                role: 'Ventas y Atención al Cliente',
                description: 'Expertos en asesoramiento turístico con amplio conocimiento de destinos.'
              },
              {
                name: 'Equipo Operativo',
                role: 'Coordinación y Logística',
                description: 'Especialistas en organización de viajes y coordinación de servicios.'
              },
              {
                name: 'Equipo de Soporte',
                role: 'Asistencia 24/7',
                description: 'Disponibles para brindar apoyo durante todo el viaje.'
              }
            ].map((member, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-violet-300 font-medium mb-4">{member.role}</p>
                <p className="text-white/80">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">
            ¿Listo para tu próxima <span className="text-violet-200">aventura?</span>
          </h2>
          <p className="text-xl text-violet-100 mb-12">
            Contactanos y déjanos ayudarte a planificar el viaje de tus sueños
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">📍 Nuestra Oficina</h3>
              <p className="text-violet-100">
                Chacras Park, Edificio Ceibo<br/>
                Oficinas 105, 307, 404, 405<br/>
                Luján de Cuyo, Mendoza
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">📞 Contacto</h3>
              <p className="text-violet-100">
                📧 ventas@intertravel.com.ar<br/>
                📱 WhatsApp: +54 9 261 XXX-XXXX<br/>
                🕒 Lun-Vie: 9:00-18:00 | Sáb: 9:00-13:00
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/paquetes">
              <button className="bg-violet-500 text-white font-bold py-4 px-8 rounded-full hover:bg-violet-400 transition-colors">
                Ver Nuestros Paquetes
              </button>
            </Link>
            <a 
              href="https://wa.me/5492611234567"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-8 rounded-full hover:bg-white/20 transition-colors"
            >
              📱 WhatsApp Directo
            </a>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
