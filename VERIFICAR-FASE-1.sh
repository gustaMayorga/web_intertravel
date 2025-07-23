#!/bin/bash

# ===============================================
# SCRIPT DE VERIFICACIÓN FASE 1 - INTERTRAVEL
# ===============================================

echo "🔍 ==============================================="
echo "🔍 VERIFICANDO REPARACIONES FASE 1"
echo "🔍 ==============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "backend/server.js" ]; then
    log_error "No estás en el directorio raíz del proyecto"
    log_info "Navega a: D:/Inter/intertravel-website/WEB-FINAL-UNIFICADA"
    exit 1
fi

log_info "Directorio correcto detectado"

# 1. Verificar archivos reparados
echo ""
echo "📁 Verificando archivos reparados..."

if [ -f "backend/server-fixed.js" ]; then
    log_success "server-fixed.js creado"
else
    log_error "server-fixed.js no encontrado"
fi

if [ -f "backend/routes/admin-clients-fixed.js" ]; then
    log_success "admin-clients-fixed.js creado"
else
    log_error "admin-clients-fixed.js no encontrado"
fi

if [ -f "backend/middleware/auth.js" ]; then
    log_success "middleware/auth.js creado"
else
    log_error "middleware/auth.js no encontrado"
fi

# 2. Verificar dependencias del backend
echo ""
echo "📦 Verificando dependencias del backend..."
cd backend

if [ -f "package.json" ]; then
    log_success "package.json encontrado"
    
    # Verificar si node_modules existe
    if [ -d "node_modules" ]; then
        log_success "node_modules existe"
    else
        log_warning "node_modules no existe - ejecutando npm install"
        npm install
    fi
else
    log_error "package.json no encontrado en backend"
fi

# 3. Verificar conexión a base de datos
echo ""
echo "🐘 Verificando conexión a PostgreSQL..."

# Test de conexión básica
node -e "
const { connect, healthCheck } = require('./database');
connect()
  .then(() => healthCheck())
  .then(result => {
    if (result.healthy) {
      console.log('✅ Base de datos conectada exitosamente');
      process.exit(0);
    } else {
      console.log('❌ Base de datos no saludable:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('❌ Error conectando a base de datos:', error.message);
    console.log('💡 Sugerencias:');
    console.log('   1. Verificar que PostgreSQL esté ejecutándose');
    console.log('   2. Revisar variables de entorno en .env');
    console.log('   3. Verificar credenciales de conexión');
    process.exit(1);
  });
" 2>/dev/null

if [ $? -eq 0 ]; then
    log_success "Conexión a PostgreSQL exitosa"
else
    log_error "No se pudo conectar a PostgreSQL"
    log_info "Verificar que PostgreSQL esté ejecutándose"
fi

# 4. Probar inicialización de base de datos
echo ""
echo "🔧 Verificando inicialización de base de datos..."

node -e "
const { initializeDatabase } = require('./database');
initializeDatabase()
  .then(result => {
    if (result.success) {
      console.log('✅ Base de datos inicializada correctamente');
    } else {
      console.log('❌ Error inicializando base de datos:', result.error);
    }
  })
  .catch(error => {
    console.log('❌ Error en inicialización:', error.message);
  });
" 2>/dev/null

# 5. Verificar tablas críticas
echo ""
echo "📊 Verificando tablas críticas..."

node -e "
const { query } = require('./database');

const tables = ['users', 'bookings', 'agencies'];
const checks = tables.map(async table => {
  try {
    const result = await query(\`SELECT COUNT(*) as count FROM \${table}\`);
    console.log(\`✅ Tabla \${table}: \${result.rows[0].count} registros\`);
    return true;
  } catch (error) {
    console.log(\`❌ Error en tabla \${table}: \${error.message}\`);
    return false;
  }
});

Promise.all(checks).then(() => {
  console.log('📊 Verificación de tablas completada');
}).catch(error => {
  console.log('❌ Error verificando tablas:', error.message);
});
" 2>/dev/null

# 6. Test del servidor reparado
echo ""
echo "🚀 Probando servidor reparado..."

# Crear script de test temporal
cat > test-server.js << 'EOF'
const app = require('./server-fixed');

const server = app.listen(3003, () => {
  console.log('✅ Servidor de test iniciado en puerto 3003');
  
  // Test basic endpoints
  const http = require('http');
  
  // Test health endpoint
  const healthReq = http.request({
    hostname: 'localhost',
    port: 3003,
    path: '/api/health',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success) {
          console.log('✅ Health endpoint funcionando');
        } else {
          console.log('❌ Health endpoint falló');
        }
      } catch (error) {
        console.log('❌ Error parseando health response');
      }
      
      server.close(() => {
        console.log('🛑 Servidor de test cerrado');
        process.exit(0);
      });
    });
  });
  
  healthReq.on('error', (error) => {
    console.log('❌ Error en health check:', error.message);
    server.close();
    process.exit(1);
  });
  
  healthReq.end();
});

server.on('error', (error) => {
  console.log('❌ Error iniciando servidor:', error.message);
  process.exit(1);
});
EOF

# Ejecutar test del servidor
timeout 30s node test-server.js

# Limpiar archivo temporal
rm -f test-server.js

# 7. Resumen final
echo ""
echo "📋 ==============================================="
echo "📋 RESUMEN DE VERIFICACIÓN FASE 1"
echo "📋 ==============================================="

log_info "Archivos reparados:"
log_info "  - backend/server-fixed.js"
log_info "  - backend/routes/admin-clients-fixed.js"  
log_info "  - backend/middleware/auth.js"

echo ""
log_info "Próximos pasos para activar reparaciones:"
echo ""
echo "1. Backup del server original:"
echo "   cp backend/server.js backend/server-original.js"
echo ""
echo "2. Activar server reparado:"
echo "   cp backend/server-fixed.js backend/server.js"
echo ""
echo "3. Activar admin clients reparado:"
echo "   cp backend/routes/admin-clients-fixed.js backend/routes/admin-clients.js"
echo ""
echo "4. Reiniciar servidor:"
echo "   cd backend && npm start"
echo ""
echo "5. Probar en navegador:"
echo "   http://localhost:3002/api/health"
echo "   http://localhost:3005/admin/dashboard"

echo ""
log_success "Verificación Fase 1 completada"
echo "📋 ==============================================="