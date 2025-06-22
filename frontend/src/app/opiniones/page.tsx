'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ReviewsSection from '@/components/ReviewsSection';

export default function OpinionesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16213e] via-[#1f2937] to-[#16213e]">
      
      {/* Header de la página */}
      <section className="relative pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            💬 Opiniones de Nuestros Viajeros
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            Descubre por qué nuestros clientes, han elegido Intertravel para vivir experiencias únicas e inolvidables!
          </p>

          {/* Navegación de vuelta */}
          <div className="flex items-center justify-center mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
            >
              <span className="mr-2">←</span>
              Volver
            </button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-[#B8860B] mb-2">4.9</div>
              <p className="text-white/80 text-sm">Rating Promedio</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-[#B8860B] mb-2">98%</div>
              <p className="text-white/80 text-sm">Recomendarían</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-[#B8860B] mb-2">10,000+</div>
              <p className="text-white/80 text-sm">Clientes Felices</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="text-3xl font-bold text-[#B8860B] mb-2">1500+</div>
              <p className="text-white/80 text-sm">Experiencias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección principal de opiniones */}
      <ReviewsSection 
        showAll={true} 
        limit={50} 
        className=""
      />

      {/* Call to action final */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          <div className="bg-gradient-to-r from-[#B8860B]/20 to-[#DAA520]/20 backdrop-blur-md border border-[#B8860B]/30 rounded-3xl p-12">
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para Tu Próxima Aventura?
            </h2>
            
            <p className="text-xl text-white/80 mb-8">
              Únete a miles de viajeros satisfechos y vive experiencias únicas con Intertravel
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/paquetes')}
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-all text-lg shadow-xl"
              >
                🎒 Ver Paquetes Disponibles
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all text-lg"
              >
                🌍 Volver al Inicio
              </button>
            </div>

            {/* Información de contacto */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-white/80 mb-4">
                ¿Tienes preguntas? Estamos aquí para ayudarte
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <a 
                  href="tel:+542614xxxxxx" 
                  className="flex items-center text-white hover:text-[#B8860B] transition-colors"
                >
                  <span className="text-xl mr-2">📞</span>
                  +54 261 4XX-XXXX
                </a>
                
                <a 
                  href="mailto:ventas@intertravel.com.ar" 
                  className="flex items-center text-white hover:text-[#B8860B] transition-colors"
                >
                  <span className="text-xl mr-2">📧</span>
                  ventas@intertravel.com.ar
                </a>
                
                <a 
                  href="https://wa.me/5492614xxxxxx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-white hover:text-[#B8860B] transition-colors"
                >
                  <span className="text-xl mr-2">📱</span>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
