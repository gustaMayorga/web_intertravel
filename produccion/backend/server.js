// ===============================================
// INTERTRAVEL BACKEND - PRODUCCIÓN v4.0
// Optimizado para AWS LightSail
// ===============================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3002;

// ======================================
// CONFIGURACIÓN DE PRODUCCIÓN
// ======================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.set('trust proxy', 1);

// CORS para producción
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3005',
  process.env.CLIENT_APP_URL || 'http://localhost:3009',
  process.env.DOMAIN_URL || 'https://intertravel.com.ar'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  message: { error: 'Demasiadas solicitudes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// Middleware básicos
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================================
// SERVICIOS
// ======================================

let dbManager = null;
let dbConnected = false;

async function initializeDatabase() {
  try {
    const database = require('./database.js');
    dbManager = database.dbManager;
    
    const result = await database.connect();
    if (result.success) {
      dbConnected = true;
      console.log('✅ PostgreSQL conectado');
      await database.initializeDatabase();
    }
  } catch (error) {
    console.warn('⚠️ PostgreSQL no disponible:', error.message);
    dbConnected = false;
  }
}

// ======================================
// AUTENTICACIÓN
// ======================================

const validCredentials = {
  'admin': { 
    password: process.env.ADMIN_PASSWORD || 'admin123', 
    role: 'super_admin',
    name: 'Administrador'
  },
  'agencia_admin': { 
    password: process.env.AGENCY_PASSWORD || 'agencia123', 
    role: 'admin_agencia',
    name: 'Admin Agencia'
  }
};

const activeTokens = new Map();
app.locals.activeTokens = activeTokens;

function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }
  
  const user = activeTokens.get(token);
  if (!user || Date.now() > user.expiresAt) {
    activeTokens.delete(token);
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
  
  req.user = user;
  next();
}

// ======================================
// DATOS MOCK OPTIMIZADOS
// ======================================

function generateMockPackages(count = 50) {
  const packages = [];
  
  const intertravelPackages = [
    {
      name: 'Mendoza Premium Wine Tour - InterTravel',
      country: 'Argentina',
      price: 2890,
      category: 'Lujo',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      externalReference: 'intertravel-mendoza-premium-001',
      provider: 'InterTravel',
      _isIntertravel: true
    },
    {
      name: 'Exclusive Patagonia Adventure - InterTravel',
      country: 'Argentina',
      price: 3490,
      category: 'Aventura',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
      externalReference: 'intertravel-patagonia-exclusive-002',
      provider: 'InterTravel',
      _isIntertravel: true
    }
  ];
  
  const otherDestinations = [
    { name: 'Perú Mágico', country: 'Perú', price: 1890, category: 'Cultura' },
    { name: 'Cancún Paradise', country: 'México', price: 1299, category: 'Playa' },
    { name: 'Madrid Cultural', country: 'España', price: 1650, category: 'Cultura' },
    { name: 'París Romántico', country: 'Francia', price: 1850, category: 'Romance' }
  ];
  
  // 25% InterTravel packages
  const intertravelCount = Math.floor(count * 0.25);
  const otherCount = count - intertravelCount;
  
  // InterTravel packages
  for (let i = 0; i < intertravelCount; i++) {
    const pkg = intertravelPackages[i % intertravelPackages.length];
    const id = `IT${27000 + i}`;
    const duration = [7, 10, 14][i % 3];
    
    packages.push({
      id,
      title: pkg.name,
      destination: pkg.name.split(' - ')[0],
      country: pkg.country,
      price: { amount: pkg.price + (i * 50), currency: 'USD' },
      duration: { days: duration, nights: duration - 1 },
      category: pkg.category,
      description: { short: `Experiencia premium en ${pkg.country}` },
      images: { main: pkg.image },
      rating: { average: 4.7 + (Math.random() * 0.3), count: 120 + (i * 15) },
      featured: true,
      status: 'active',
      _isIntertravel: true,
      provider: pkg.provider
    });
  }
  
  // Other packages
  for (let i = 0; i < otherCount; i++) {
    const dest = otherDestinations[i % otherDestinations.length];
    const id = `TC${27500 + i}`;
    const duration = [5, 7, 10, 14][i % 4];
    
    packages.push({
      id,
      title: `${dest.name} - Experiencia Completa`,
      destination: dest.name,
      country: dest.country,
      price: { amount: dest.price + (i * 10), currency: 'USD' },
      duration: { days: duration, nights: duration - 1 },
      category: dest.category,
      description: { short: `Descubre ${dest.name}` },
      images: { main: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&h=600&fit=crop` },
      rating: { average: 4.3 + (Math.random() * 0.4), count: 50 + (i * 2) },
      featured: (i % 6) === 0,
      status: 'active',
      _isIntertravel: false
    });
  }
  
  return packages;
}

async function getPackagesFromSource(options = {}) {
  const limit = options.limit || 40;
  const packages = generateMockPackages(limit);
  
  // Priorizar InterTravel primero
  const prioritized = packages.sort((a, b) => {
    if (a._isIntertravel && !b._isIntertravel) return -1;
    if (!a._isIntertravel && b._isIntertravel) return 1;
    return b.rating.average - a.rating.average;
  });
  
  return {
    success: true,
    packages: prioritized,
    source: 'mock-production',
    total: prioritized.length
  };
}

// ======================================
// RUTAS DE AUTENTICACIÓN
// ======================================

app.post('/api/auth/agency-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Credenciales requeridas' });
    }
    
    const userConfig = validCredentials[username];
    if (!userConfig || userConfig.password !== password) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    const token = `tk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    
    const user = {
      username,
      name: userConfig.name,
      role: userConfig.role,
      permissions: ['dashboard:view', 'packages:view'],
      expiresAt
    };
    
    activeTokens.set(token, user);
    
    res.json({
      success: true,
      user: { username: user.username, name: user.name, role: user.role },
      token,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userConfig = validCredentials[username];
    if (!userConfig || userConfig.password !== password) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    const token = `adm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    
    const user = {
      username,
      name: userConfig.name,
      role: userConfig.role,
      permissions: ['dashboard:view', 'packages:manage', 'users:manage'],
      expiresAt
    };
    
    activeTokens.set(token, user);
    
    res.json({
      success: true,
      user: { username: user.username, name: user.name, role: user.role },
      token,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
  } catch (error) {
    console.error('Error en login admin:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      username: req.user.username,
      name: req.user.name,
      role: req.user.role
    },
    valid: true
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) activeTokens.delete(token);
  
  res.json({ success: true, message: 'Sesión cerrada' });
});

// ======================================
// RUTAS ADICIONALES
// ======================================

// Cargar rutas de roles y usuarios
try {
  const rolesRoutes = require('./routes/roles');
  app.use('/api/admin', rolesRoutes);
  console.log('✅ Rutas de roles y usuarios cargadas');
} catch (error) {
  console.warn('⚠️ Rutas de roles no disponibles:', error.message);
}

try {
  const userManagementRoutes = require('./routes/user-management');
  app.use('/api/admin', userManagementRoutes);
} catch (error) {
  console.warn('Rutas user-management no disponibles');
}

try {
  const permissionsRoutes = require('./routes/permissions');
  app.use('/api/auth', permissionsRoutes);
} catch (error) {
  console.warn('Rutas permissions no disponibles');
}

// ======================================
// RUTAS API PÚBLICAS
// ======================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: {
      name: 'InterTravel Backend',
      version: '4.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    },
    services: {
      database: dbConnected ? 'connected' : 'disconnected'
    }
  });
});

app.get('/api/packages/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const result = await getPackagesFromSource({ limit: 100 });
    
    if (result.success) {
      let featuredPackages = result.packages
        .filter(pkg => pkg._isIntertravel || pkg.featured)
        .slice(0, limit);
      
      if (featuredPackages.length < limit) {
        const additional = result.packages
          .filter(pkg => !featuredPackages.includes(pkg))
          .slice(0, limit - featuredPackages.length);
        featuredPackages.push(...additional);
      }
      
      res.json({
        success: true,
        packages: featuredPackages,
        total: featuredPackages.length,
        source: result.source
      });
    } else {
      throw new Error('No se pudieron obtener paquetes');
    }
  } catch (error) {
    console.error('Error obteniendo paquetes destacados:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.get('/api/packages', async (req, res) => {
  try {
    const { search, country, category, page = 1, limit = 20 } = req.query;
    
    const result = await getPackagesFromSource({ limit: 200 });
    let packages = result.packages;
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      packages = packages.filter(pkg => 
        pkg.title?.toLowerCase().includes(searchLower) ||
        pkg.destination?.toLowerCase().includes(searchLower) ||
        pkg.country?.toLowerCase().includes(searchLower)
      );
    }
    
    if (country) {
      packages = packages.filter(pkg => 
        pkg.country?.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    if (category) {
      packages = packages.filter(pkg => 
        pkg.category?.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Paginación
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedPackages = packages.slice(offset, offset + limitNum);
    
    res.json({
      success: true,
      packages: paginatedPackages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: packages.length,
        totalPages: Math.ceil(packages.length / limitNum),
        hasNext: offset + limitNum < packages.length,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error obteniendo paquetes:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.get('/api/packages/search', async (req, res) => {
  try {
    const { destination, search, country, category, page = 1, pageSize = 20 } = req.query;
    const searchTerm = destination || search;
    
    const result = await getPackagesFromSource({ limit: 200 });
    let packages = result.packages;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      packages = packages.filter(pkg => 
        pkg.title?.toLowerCase().includes(searchLower) ||
        pkg.destination?.toLowerCase().includes(searchLower) ||
        pkg.country?.toLowerCase().includes(searchLower)
      );
    }
    
    if (country) {
      packages = packages.filter(pkg => 
        pkg.country?.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    if (category) {
      packages = packages.filter(pkg => 
        pkg.category?.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(pageSize);
    const offset = (pageNum - 1) * limitNum;
    const paginatedPackages = packages.slice(offset, offset + limitNum);
    
    res.json({
      success: true,
      data: paginatedPackages,
      packages: paginatedPackages,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        total: packages.length,
        totalPages: Math.ceil(packages.length / limitNum),
        hasNext: offset + limitNum < packages.length,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.get('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packages = generateMockPackages(200);
    const packageFound = packages.find(pkg => pkg.id === id);
    
    if (!packageFound) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }
    
    const enrichedPackage = {
      ...packageFound,
      itinerary: [
        {
          day: 1,
          title: 'Llegada',
          description: `Llegada a ${packageFound.destination}`,
          activities: ['Check-in hotel', 'Orientación']
        }
      ],
      included: ['Alojamiento', 'Traslados', 'Guía'],
      notIncluded: ['Vuelos', 'Comidas extras'],
      contact: {
        whatsapp: '5492611234567',
        email: 'reservas@intertravel.com.ar'
      }
    };
    
    res.json({
      success: true,
      package: enrichedPackage,
      source: 'mock-production'
    });
  } catch (error) {
    console.error('Error obteniendo paquete:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = [
      {
        id: 1,
        name: 'María González',
        rating: 5,
        text: 'Increíble experiencia con InterTravel.',
        trip: 'París Romántico',
        verified: true
      }
    ];
    
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// ======================================
// RUTAS ADMIN
// ======================================

app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    const stats = {
      totalBookings: 145,
      monthlyRevenue: 186500,
      activePackages: 23,
      conversionRate: 24.5
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// ======================================
// ERROR HANDLING
// ======================================

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path
  });
});

app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// ======================================
// SERVIDOR
// ======================================

async function startServer() {
  try {
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log('🚀 ===============================================');
      console.log(`🚀 INTERTRAVEL BACKEND v4.0 - Puerto ${PORT}`);
      console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Base de datos: ${dbConnected ? 'Conectada' : 'Mock'}`);
      console.log('🚀 Sistema de usuarios: Habilitado con roles');
      console.log('🚀 ===============================================');
    });
    
    process.on('SIGTERM', () => {
      console.log('Cerrando servidor...');
      server.close(() => process.exit(0));
    });
    
    process.on('SIGINT', () => {
      console.log('Cerrando servidor...');
      server.close(() => process.exit(0));
    });
    
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;