'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Play, Smartphone, MapPin, CreditCard, Users, Clock, ArrowRight } from 'lucide-react';

export default function AppSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Explora Destinos",
      description: "Descubre paquetes únicos a Perú, Europa, Asia y más destinos increíbles"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Reserva Fácil",
      description: "Proceso de reserva simplificado con múltiples opciones de pago"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Gestión Personal",
      description: "Administra tus reservas, documentos y preferencias en un solo lugar"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Soporte 24/7",
      description: "Asistencia inmediata vía WhatsApp y chat en tiempo real"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 lg:py-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Contenido Left */}
          <div className="order-2 lg:order-1">
            {/* Header */}
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                <Smartphone className="w-4 h-4 mr-2" />
                Nueva App Cliente
              </span>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Tu próximo viaje 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> en tus manos</span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experimenta la nueva forma de viajar con nuestra app cliente. Busca, compara y reserva paquetes turísticos premium desde cualquier lugar.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="http://localhost:3009"
                target="_blank"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1"
              >
                <Smartphone className="w-5 h-5 mr-3" />
                Probar App Ahora
                <ArrowRight className="w-5 h-5 ml-3" />
              </Link>
              
              <button className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200">
                <Play className="w-5 h-5 mr-3" />
                Ver Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">200+</div>
                <div className="text-sm text-gray-600">Agencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">3000+</div>
                <div className="text-sm text-gray-600">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">4.9★</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </div>

          {/* Video/Visual Right */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Video Container */}
              <div className="relative bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[9/16] max-w-sm mx-auto bg-gradient-to-br from-gray-900 to-gray-800 relative">
                  
                  {/* Phone Mockup */}
                  <div className="absolute inset-4 bg-white rounded-[2rem] overflow-hidden shadow-inner">
                    
                    {/* Status Bar */}
                    <div className="bg-gray-900 h-8 flex items-center justify-between px-6 text-white text-xs">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-white rounded-sm"></div>
                        <div className="w-1 h-2 bg-white rounded-sm"></div>
                        <div className="w-6 h-2 bg-white rounded-sm"></div>
                      </div>
                    </div>

                    {/* App Content Preview */}
                    <div className="p-4 h-full bg-gradient-to-b from-blue-50 to-white">
                      
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">¡Hola!</h3>
                          <p className="text-sm text-gray-600">¿A dónde viajas hoy?</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
                      </div>

                      {/* Search Bar */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-500 text-sm">Buscar destinos...</span>
                        </div>
                      </div>

                      {/* Featured Cards */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                          <div className="h-24 bg-gradient-to-r from-orange-400 to-pink-400"></div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm">Perú Imprescindible</h4>
                            <p className="text-xs text-gray-600">8 días • desde USD 1,795</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                          <div className="h-24 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm">Camboriú Charter</h4>
                            <p className="text-xs text-gray-600">7 días • desde USD 1,550</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors duration-200 group">
                          <Play className="w-6 h-6 text-blue-600 ml-1 group-hover:scale-110 transition-transform duration-200" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-1/3 -left-6 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Background Decorations */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}