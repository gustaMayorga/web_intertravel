// API endpoint SIMPLIFICADO para Travel Compositor
const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🌍 Intentando conectar con Travel Compositor...');
  
  // Configuración de Travel Compositor
  const tcConfig = {
    urls: [
      'https://online.travelcompositor.com',
      'https://api.travelcompositor.com', 
      'https://travelcompositor.com'
    ],
    username: 'ApiUser1',
    password: 'Veoveo77*',
    microsite: 'intertravelgroup'
  };

  // Intentar conectar con Travel Compositor
  let tcDestinations = [];
  let tcConnected = false;
  let errorMessage = '';

  for (const baseUrl of tcConfig.urls) {
    try {
      console.log(`🔍 Probando: ${baseUrl}`);
      
      // Test básico de conectividad
      const testResponse = await axios.get(baseUrl, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`📡 ${baseUrl} respondió con status: ${testResponse.status}`);
      
      if (testResponse.status < 500) {
        // Intentar autenticación
        try {
          const authResponse = await axios.post(`${baseUrl}/api/auth`, {
            username: tcConfig.username,
            password: tcConfig.password,
            microsite: tcConfig.microsite
          }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (authResponse.data && authResponse.data.token) {
            console.log('✅ Autenticado con Travel Compositor');
            tcConnected = true;
            
            // Intentar obtener destinos
            const destinationsResponse = await axios.get(`${baseUrl}/api/destinations`, {
              headers: {
                'Authorization': `Bearer ${authResponse.data.token}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            });
            
            if (destinationsResponse.data) {
              tcDestinations = destinationsResponse.data;
              console.log(`✅ Obtenidos ${tcDestinations.length} destinos`);
              break;
            }
          }
        } catch (authError) {
          console.log(`❌ Error de autenticación en ${baseUrl}:`, authError.message);
          errorMessage = authError.message;
        }
      }
    } catch (error) {
      console.log(`❌ Error conectando con ${baseUrl}:`, error.message);
      errorMessage = error.message;
    }
  }

  // Destinos de respaldo con coordenadas REALES
  const fallbackDestinations = [
    {
      id: 'paris_tc',
      name: 'París',
      country: 'Francia',
      description: 'La Ciudad de la Luz te espera con su arte, cultura y romance',
      price: 1299,
      category: 'Romance',
      coordinates: { lat: 48.8566, lon: 2.3522 }
    },
    {
      id: 'tokyo_tc',
      name: 'Tokio',
      country: 'Japón',
      description: 'Modernidad y tradición se encuentran en la capital japonesa',
      price: 2199,
      category: 'Cultura',
      coordinates: { lat: 35.6762, lon: 139.6503 }
    },
    {
      id: 'cancun_tc',
      name: 'Cancún',
      country: 'México',
      description: 'Playas de arena blanca y aguas cristalinas del Caribe',
      price: 1494,
      category: 'Playa',
      coordinates: { lat: 21.1619, lon: -86.8515 }
    },
    {
      id: 'cusco_tc',
      name: 'Cusco',
      country: 'Perú',
      description: 'La antigua capital del Imperio Inca y puerta a Machu Picchu',
      price: 1890,
      category: 'Aventura',
      coordinates: { lat: -13.5319, lon: -71.9675 }
    },
    {
      id: 'london_tc',
      name: 'Londres',
      country: 'Reino Unido',
      description: 'Historia milenaria en una ciudad vibrante y multicultural',
      price: 1799,
      category: 'Cultura',
      coordinates: { lat: 51.5074, lon: -0.1278 }
    },
    {
      id: 'dubai_tc',
      name: 'Dubái',
      country: 'Emiratos Árabes Unidos',
      description: 'Lujo y modernidad en el desierto árabe',
      price: 2599,
      category: 'Romance',
      coordinates: { lat: 25.2048, lon: 55.2708 }
    },
    {
      id: 'rome_tc',
      name: 'Roma',
      country: 'Italia',
      description: 'La Ciudad Eterna con más de 2,000 años de historia',
      price: 1599,
      category: 'Cultura',
      coordinates: { lat: 41.9028, lon: 12.4964 }
    },
    {
      id: 'sydney_tc',
      name: 'Sidney',
      country: 'Australia',
      description: 'Icónica ciudad australiana entre el puerto y las playas',
      price: 2890,
      category: 'Aventura',
      coordinates: { lat: -33.8688, lon: 151.2093 }
    },
    {
      id: 'newyork_tc',
      name: 'Nueva York',
      country: 'Estados Unidos',
      description: 'La Gran Manzana, ciudad que nunca duerme',
      price: 2299,
      category: 'Cultura',
      coordinates: { lat: 40.7128, lon: -74.0060 }
    },
    {
      id: 'bangkok_tc',
      name: 'Bangkok',
      country: 'Tailandia',
      description: 'Templos dorados y mercados flotantes en la capital tailandesa',
      price: 1899,
      category: 'Cultura',
      coordinates: { lat: 13.7563, lon: 100.5018 }
    },
    {
      id: 'rio_tc',
      name: 'Río de Janeiro',
      country: 'Brasil',
      description: 'Playas de Copacabana e Ipanema bajo el Cristo Redentor',
      price: 1650,
      category: 'Playa',
      coordinates: { lat: -22.9068, lon: -43.1729 }
    },
    {
      id: 'buenosaires_tc',
      name: 'Buenos Aires',
      country: 'Argentina',
      description: 'Tango, asado y cultura porteña en la capital argentina',
      price: 999,
      category: 'Cultura',
      coordinates: { lat: -34.6118, lon: -58.3960 }
    }
  ];

  // Usar destinos de TC si están disponibles, sino usar fallback
  const destinations = tcConnected && tcDestinations.length > 0 
    ? tcDestinations.map(dest => ({
        id: dest.id || `tc_${Math.random().toString(36).substr(2, 9)}`,
        name: dest.name || dest.destination,
        country: dest.country || 'Internacional',
        description: dest.description || `Descubre ${dest.name}`,
        price: dest.price || dest.minPrice || 1500,
        category: dest.category || dest.type || 'Cultura',
        tcData: dest,
        coordinates: dest.coordinates || { lat: 0, lon: 0 }
      }))
    : fallbackDestinations;

  console.log(`📊 Enviando ${destinations.length} destinos (${tcConnected ? 'Travel Compositor' : 'Fallback'})`);

  return res.status(200).json({
    success: true,
    destinations: destinations,
    source: tcConnected ? 'travel_compositor' : 'fallback',
    connected: tcConnected,
    error: tcConnected ? null : errorMessage,
    timestamp: new Date().toISOString(),
    total: destinations.length
  });
}
