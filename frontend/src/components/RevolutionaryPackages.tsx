'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function RevolutionaryPackages() {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const packages = [
    {
      id: 'bali',
      title: 'Bali Místico Premium',
      location: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop',
      price: 4999,
      originalPrice: 6499,
      badge: 'Premium',
      urgency: '¡Solo 2 disponibles!',
      rating: 4.9,
      reviews: 347,
      liveActivity: '3 personas reservando ahora',
      description: '7 días de transformación espiritual en villas privadas con infinity pool, ceremonias ancestrales y spa holístico personalizado.',
      aiPersonalization: 'Basado en tu perfil "Explorador Espiritual", incluimos meditación sunrise y cooking class balinés',
      features: ['8 días', 'Grupos pequeños', 'Comidas incluidas', 'Spa premium'],
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'paris',
      title: 'París Sueños Infinitos',
      location: 'París, Francia',
      image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800&h=600&fit=crop',
      price: 7999,
      originalPrice: 9999,
      badge: 'Best Seller',
      urgency: '💕 Última suite romántica',
      rating: 5.0,
      reviews: 189,
      liveActivity: '💍 2 propuestas esta semana',
      description: '5 días de romance puro en Le Meurice, cenas privadas en Torre Eiffel y crucero nocturno por el Sena con violinista.',
      aiPersonalization: 'Para parejas: Sesión fotográfica romántica incluida + propuesta planning (opcional) + champagne Dom Pérignon',
      features: ['5 días', 'Hotel 5★', 'Cenas privadas', 'Fotógrafo'],
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      id: 'tokyo',
      title: 'Tokyo Futurista Elite',
      location: 'Tokyo, Japón',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
      price: 8999,
      originalPrice: 11999,
      badge: 'Futurista',
      urgency: '🌸 Temporada Sakura',
      rating: 4.9,
      reviews: 523,
      liveActivity: '🔥 Trending #1 este mes',
      description: '6 días entre tradición y futuro: ryokan de lujo, cenas Michelin exclusivas, ceremonia del té privada y tecnología cutting-edge.',
      aiPersonalization: 'Tech Explorer: Visita a laboratorios de Sony + demo de robots + experiencia VR exclusiva en Shibuya',
      features: ['6 días', 'Ryokan lujo', 'Michelin', 'Tech tours'],
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'patagonia',
      title: 'Patagonia Extrema',
      location: 'Patagonia, Argentina',
      image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800&h=600&fit=crop',
      price: 5200,
      originalPrice: 6800,
      badge: 'Aventura',
      urgency: '⚡ Solo 5 lugares',
      rating: 4.8,
      reviews: 234,
      liveActivity: '🏔️ 4 aventureros confirmados',
      description: 'Atraviesa la Cordillera de los Andes siguiendo las rutas milenarias del cóndor en una experiencia que desafía todos los límites.',
      aiPersonalization: 'Aventurero Extremo: Incluimos escalada en hielo + vuelos panorámicos + encuentro con gauchos auténticos',
      features: ['10 días', 'Guía experto', 'Camping premium', 'Escalada'],
      gradient: 'from-blue-500 to-cyan-600'
    }
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedDestination(packageId);
    // Simular reserva
    setTimeout(() => {
      alert(`🎉 ¡Experiencia ${packageId.toUpperCase()} seleccionada! Te contactaremos en 5 minutos por WhatsApp para coordinar los detalles finales.`);
    }, 1000);
  };

  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black text-white mb-6">
            Experiencias que 
            <span className="text-intertravel-gold"> Transforman Vidas</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Cada viaje es una historia única diseñada especialmente para ti con inteligencia artificial
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {packages.map((pkg, index) => (
            <div 
              key={pkg.id}
              className={`revolutionary-package-card group ${selectedDestination === pkg.id ? 'selected' : ''}`}
              onClick={() => handlePackageSelect(pkg.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Urgencia Indicator */}
              <div className="urgency-indicator">
                {pkg.urgency}
              </div>

              {/* Badge Premium */}
              <div className={`package-badge bg-gradient-to-r ${pkg.gradient}`}>
                {pkg.badge}
              </div>

              {/* Imagen Inmersiva */}
              <div className="package-image-container">
                <Image
                  src={pkg.image}
                  alt={pkg.title}
                  width={800}
                  height={400}
                  className="package-image"
                />
                <div className="package-overlay"></div>
                
                {/* AR Preview Button */}
                <div className="ar-preview-btn">
                  🔮 Vista AR
                </div>
              </div>

              {/* Contenido de la Card */}
              <div className="package-content">
                <div>
                  <h3 className="package-title">{pkg.title}</h3>
                  
                  <div className="package-location">
                    <span className="location-icon">📍</span>
                    {pkg.location}
                  </div>

                  <div className="rating-section">
                    <div className="stars">
                      {'⭐'.repeat(Math.floor(pkg.rating))}
                    </div>
                    <span className="rating-text">
                      {pkg.rating} ({pkg.reviews} reseñas)
                    </span>
                  </div>

                  <p className="package-description">
                    {pkg.description}
                  </p>

                  {/* AI Personalización */}
                  <div className="ai-personalization">
                    🤖 <strong>IA personalizada:</strong> {pkg.aiPersonalization}
                  </div>

                  {/* Actividad en vivo */}
                  <div className="live-activity">
                    {pkg.liveActivity}
                  </div>

                  {/* Features */}
                  <div className="package-metadata">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="metadata-item">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer de precio y CTA */}
                <div className="package-footer">
                  <div className="price-section">
                    <span className="price-label">desde</span>
                    <span className="price-amount">USD ${pkg.price.toLocaleString()}</span>
                    <span className="price-comparison">Era ${pkg.originalPrice.toLocaleString()}</span>
                    <span className="savings-badge">
                      Ahorras ${(pkg.originalPrice - pkg.price).toLocaleString()}
                    </span>
                  </div>

                  <button className="cta-button">
                    <span className="cta-icon">🚀</span>
                    Reservar Mi Transformación
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </section>
  );
}