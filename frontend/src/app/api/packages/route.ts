import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock para el frontend (fallback)
const MOCK_FRONTEND_PACKAGES = [
  {
    id: 'fe-1',
    title: 'Europa Clásica - París, Roma, Londres',
    destination: 'Europa Occidental',
    country: 'Francia, Italia, Reino Unido',
    price: { amount: 2299, currency: 'USD' },
    originalPrice: { amount: 2799, currency: 'USD' },
    duration: { days: 12, nights: 11 },
    category: 'Cultural',
    description: {
      short: 'Descubre los tesoros de Europa en un viaje inolvidable por París, Roma y Londres.',
      full: 'Un recorrido completo por las capitales más emblemáticas de Europa.'
    },
    images: {
      main: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop'
    },
    rating: { average: 4.8, count: 156 },
    features: ['Vuelos incluidos', 'Hoteles 4*', 'Desayunos', 'Guía en español'],
    featured: true,
    _source: 'frontend-default'
  },
  {
    id: 'fe-2',
    title: 'Perú Mágico - Cusco y Machu Picchu',
    destination: 'Cusco',
    country: 'Perú',
    price: { amount: 1890, currency: 'USD' },
    duration: { days: 8, nights: 7 },
    category: 'Cultural',
    description: {
      short: 'Descubre las maravillas del Imperio Inca en este viaje inolvidable.',
      full: 'Un recorrido completo por la historia de los Incas.'
    },
    images: {
      main: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop'
    },
    rating: { average: 4.9, count: 234 },
    features: ['Vuelos incluidos', 'Hoteles 4*', 'Guía especializado', 'Tren a Machu Picchu'],
    featured: true,
    _source: 'frontend-default'
  },
  {
    id: 'fe-3',
    title: 'RIDE Bariloche Clásico',
    destination: 'Bariloche',
    country: 'Argentina',
    price: { amount: 899, currency: 'USD' },
    duration: { days: 7, nights: 6 },
    category: 'ride',
    description: {
      short: 'El clásico viaje de egresados a Bariloche con todas las actividades.',
      full: 'Aventura, diversión y experiencias únicas en la Patagonia.'
    },
    images: {
      main: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop'
    },
    rating: { average: 4.9, count: 156 },
    features: ['Coordinadores 24/7', 'Actividades incluidas', 'Seguro integral', 'Disco'],
    featured: true,
    _source: 'frontend-default'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';

    console.log('📦 GET /api/packages - Cargando para frontend público...');

    // PASO 1: Cargar paquetes desde admin si están disponibles
    let allPackages = [...MOCK_FRONTEND_PACKAGES];

    // Intentar cargar paquetes activos desde admin
    try {
      const adminResponse = await fetch(`${request.url.replace('/api/packages', '/api/admin/packages')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        if (adminData.success && adminData.data) {
          // Filtrar solo paquetes activos y convertir formato
          const activeAdminPackages = adminData.data
            .filter(pkg => pkg.status === 'active')
            .map(pkg => ({
              id: pkg.id?.toString() || Date.now().toString(),
              title: pkg.title,
              destination: pkg.destination,
              country: pkg.destination?.split(', ')[1] || 'Argentina',
              price: {
                amount: pkg.price || 1500,
                currency: 'USD'
              },
              originalPrice: pkg.originalPrice ? {
                amount: pkg.originalPrice,
                currency: 'USD'
              } : null,
              duration: {
                days: pkg.duration || 7,
                nights: (pkg.duration || 7) - 1
              },
              category: pkg.category || 'Cultural',
              description: {
                short: `Increíble experiencia en ${pkg.destination}`,
                full: `Descubre ${pkg.destination} en una experiencia única e inolvidable.`
              },
              images: {
                main: pkg.destination?.includes('Cusco') 
                  ? 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop'
                  : pkg.destination?.includes('Buenos Aires')
                  ? 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=600&fit=crop'
                  : pkg.destination?.includes('México')
                  ? 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&h=600&fit=crop'
                  : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'
              },
              rating: {
                average: pkg.rating || 4.5,
                count: pkg.reviews || 0
              },
              features: [
                'Vuelos incluidos',
                'Hoteles de calidad', 
                'Guía especializado',
                'Seguro de viaje'
              ],
              featured: pkg.featured || false,
              _source: 'admin-intertravel',
              landings: pkg.landings || []
            }));

          console.log('📦 Paquetes activos desde admin:', activeAdminPackages.length);
          
          // Combinar: admin packages primero, luego default (sin duplicados)
          allPackages = [
            ...activeAdminPackages,
            ...MOCK_FRONTEND_PACKAGES.filter(defaultPkg => 
              !activeAdminPackages.some(adminPkg => 
                adminPkg.title === defaultPkg.title || 
                adminPkg.destination === defaultPkg.destination
              )
            )
          ];
        }
      }
    } catch (adminError) {
      console.log('⚠️ No se pudieron cargar paquetes admin:', adminError.message);
    }

    // PASO 2: Intentar backend para más paquetes
    try {
      const backendUrl = `${BACKEND_URL}/api/packages?${searchParams.toString()}`;
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.packages) {
          console.log('✅ Paquetes adicionales del backend:', data.packages.length);
          // Agregar paquetes backend sin duplicados
          const uniqueBackendPackages = data.packages.filter(backendPkg => 
            !allPackages.some(existingPkg => 
              existingPkg.title === backendPkg.title || 
              existingPkg.id === backendPkg.id
            )
          );
          allPackages = [...allPackages, ...uniqueBackendPackages];
        }
      }
    } catch (backendError) {
      console.log('⚠️ Backend no disponible para paquetes frontend');
    }

    // PASO 3: Aplicar filtros
    let filteredPackages = [...allPackages];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.title?.toLowerCase().includes(searchLower) ||
        pkg.destination?.toLowerCase().includes(searchLower) ||
        pkg.country?.toLowerCase().includes(searchLower) ||
        pkg.description?.short?.toLowerCase().includes(searchLower)
      );
    }

    if (category && category !== 'all') {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (country && country !== 'all') {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.country?.toLowerCase().includes(country.toLowerCase())
      );
    }

    // PASO 4: Paginación
    const total = filteredPackages.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPackages = filteredPackages.slice(offset, offset + limit);

    const hasAdminPackages = allPackages.some(pkg => pkg._source === 'admin-intertravel');
    
    console.log(`✅ Enviando ${paginatedPackages.length} paquetes (página ${page}/${totalPages})`);

    return NextResponse.json({
      success: true,
      packages: paginatedPackages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      source: hasAdminPackages ? 'admin-frontend-combined' : 'frontend-default',
      message: hasAdminPackages 
        ? 'Mostrando paquetes del panel admin y catálogo'
        : 'Mostrando catálogo por defecto'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/packages:', error);
    
    // Fallback final
    return NextResponse.json({
      success: true,
      packages: MOCK_FRONTEND_PACKAGES,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_FRONTEND_PACKAGES.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      source: 'fallback-error',
      message: 'Paquetes de respaldo por error'
    });
  }
}
