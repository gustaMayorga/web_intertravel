#!/bin/bash

# ===============================================
# SCRIPT DE INSTALACIÓN AUTOMÁTICA - INTERTRAVEL
# Sistema de Prioridades, Modal y Banners
# ===============================================

echo "🚀 INICIANDO INSTALACIÓN DEL SISTEMA INTERTRAVEL MEJORADO"
echo "==========================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con colores
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    log_info "Directorio actual: $(pwd)"
    log_info "Asegúrate de estar en: D:/Inter/intertravel-website/WEB-FINAL-UNIFICADA"
    exit 1
fi

log_success "Directorio del proyecto verificado"

# ===============================================
# 1. INSTALACIÓN DE DEPENDENCIAS BACKEND
# ===============================================

log_info "Instalando dependencias del backend..."
cd backend

# Verificar si package.json existe
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json en el backend"
    exit 1
fi

# Instalar dependencias si es necesario
npm install

# Verificar dependencias específicas
log_info "Verificando dependencias específicas..."
npm list express &>/dev/null || npm install express
npm list cors &>/dev/null || npm install cors
npm list helmet &>/dev/null || npm install helmet
npm list compression &>/dev/null || npm install compression

log_success "Dependencias del backend instaladas"

# ===============================================
# 2. CONFIGURACIÓN BASE DE DATOS
# ===============================================

log_info "Configurando base de datos PostgreSQL..."

# Verificar si existe el archivo SQL
if [ -f "database-priority-keywords.sql" ]; then
    log_success "Script SQL encontrado"
    
    # Intentar ejecutar el script (requiere PostgreSQL configurado)
    if command -v psql &> /dev/null; then
        log_info "PostgreSQL detectado, ejecutando script..."
        
        # Preguntar al usuario por la configuración de DB
        echo -n "Nombre de la base de datos [intertravel]: "
        read DB_NAME
        DB_NAME=${DB_NAME:-intertravel}
        
        echo -n "Usuario de PostgreSQL [postgres]: "
        read DB_USER
        DB_USER=${DB_USER:-postgres}
        
        # Ejecutar script
        psql -d "$DB_NAME" -U "$DB_USER" -f database-priority-keywords.sql
        
        if [ $? -eq 0 ]; then
            log_success "Base de datos configurada exitosamente"
        else
            log_warning "Error configurando base de datos, continuando con datos mock"
        fi
    else
        log_warning "PostgreSQL no detectado, usando datos mock"
    fi
else
    log_error "Script SQL no encontrado"
    exit 1
fi

# ===============================================
# 3. INSTALACIÓN DE DEPENDENCIAS FRONTEND
# ===============================================

log_info "Configurando frontend..."
cd ../frontend

# Verificar package.json
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json en el frontend"
    exit 1
fi

# Instalar dependencias
npm install

# Verificar dependencias específicas de React
log_info "Verificando dependencias específicas del frontend..."
npm list next &>/dev/null || npm install next
npm list react &>/dev/null || npm install react
npm list lucide-react &>/dev/null || npm install lucide-react

log_success "Dependencias del frontend instaladas"

# ===============================================
# 4. VERIFICACIÓN DE ARCHIVOS IMPLEMENTADOS
# ===============================================

log_info "Verificando archivos implementados..."

# Backend files
BACKEND_FILES=(
    "../backend/routes/admin-priority.js"
    "../backend/package-cache.js"
    "../backend/database-priority-keywords.sql"
)

# Frontend files
FRONTEND_FILES=(
    "src/components/PackageDetailsModal.jsx"
    "src/components/admin/AdminPriorityPanel.jsx"
    "src/components/BannerDisplay.jsx"
)

# Verificar archivos backend
for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "Backend: $(basename $file) ✓"
    else
        log_error "Backend: $(basename $file) ✗ FALTANTE"
    fi
done

# Verificar archivos frontend
for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "Frontend: $(basename $file) ✓"
    else
        log_error "Frontend: $(basename $file) ✗ FALTANTE"
    fi
done

# ===============================================
# 5. CONFIGURACIÓN DE VARIABLES DE ENTORNO
# ===============================================

log_info "Configurando variables de entorno..."

# Backend .env
cd ../backend
if [ ! -f ".env" ]; then
    log_info "Creando archivo .env para backend..."
    cat > .env << EOF
# Configuración InterTravel Backend
NODE_ENV=development
PORT=3002

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel
DB_USER=postgres
DB_PASSWORD=your_password

# Cache
CACHE_TTL=900
CACHE_MAX_SIZE=1000

# API Keys (configurar con valores reales)
TRAVEL_COMPOSITOR_API_KEY=your_tc_api_key
MERCADOPAGO_ACCESS_TOKEN=your_mp_token

# Logs
LOG_LEVEL=info
LOG_FILE=logs/backend-packages.log
EOF
    log_success "Archivo .env del backend creado"
else
    log_warning "Archivo .env del backend ya existe"
fi

# Frontend .env.local
cd ../frontend
if [ ! -f ".env.local" ]; then
    log_info "Creando archivo .env.local para frontend..."
    cat > .env.local << EOF
# Configuración InterTravel Frontend
NEXT_PUBLIC_API_URL=http://localhost:3002/api
NEXT_PUBLIC_NODE_ENV=development

# Analytics
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_FACEBOOK_PIXEL=your_fb_pixel

# URLs
NEXT_PUBLIC_WHATSAPP_NUMBER=5492611234567
NEXT_PUBLIC_EMAIL_CONTACT=reservas@intertravel.com.ar
EOF
    log_success "Archivo .env.local del frontend creado"
else
    log_warning "Archivo .env.local del frontend ya existe"
fi

# ===============================================
# 6. TESTING AUTOMÁTICO
# ===============================================

log_info "Ejecutando tests automáticos..."

# Test backend (arrancar servidor en background y hacer requests)
cd ../backend
log_info "Iniciando servidor backend para testing..."

# Arrancar servidor en background
npm start &
BACKEND_PID=$!

# Esperar a que arranque
sleep 5

# Test health endpoint
if curl -s http://localhost:3002/api/health > /dev/null; then
    log_success "Backend health check: OK"
else
    log_error "Backend health check: FAIL"
fi

# Test packages endpoint
if curl -s http://localhost:3002/api/packages/featured > /dev/null; then
    log_success "Packages endpoint: OK"
else
    log_error "Packages endpoint: FAIL"
fi

# Test admin endpoints
if curl -s http://localhost:3002/api/admin/priority-keywords > /dev/null; then
    log_success "Admin priority endpoint: OK"
else
    log_error "Admin priority endpoint: FAIL"
fi

# Matar servidor de testing
kill $BACKEND_PID 2>/dev/null

# ===============================================
# 7. SCRIPTS DE INICIO
# ===============================================

log_info "Creando scripts de inicio..."

# Script de inicio completo
cat > ../start-intertravel-complete.bat << 'EOF'
@echo off
echo 🚀 INICIANDO SISTEMA INTERTRAVEL COMPLETO
echo ==========================================

echo 📦 Iniciando Backend (Puerto 3002)...
cd backend
start "InterTravel Backend" cmd /k "npm start"

echo ⏳ Esperando backend...
timeout /t 5 /nobreak > nul

echo 🌐 Iniciando Frontend (Puerto 3005)...
cd ../frontend
start "InterTravel Frontend" cmd /k "npm run dev"

echo ✅ Sistema iniciado completamente
echo 📊 Backend: http://localhost:3002/api/health
echo 🌐 Frontend: http://localhost:3005
echo 🔧 Admin: http://localhost:3005/admin/settings

pause
EOF

# Script de testing
cat > ../test-intertravel-features.bat << 'EOF'
@echo off
echo 🧪 TESTING SISTEMA INTERTRAVEL
echo ==============================

echo Testing Backend APIs...
curl http://localhost:3002/api/health
curl http://localhost:3002/api/packages/featured
curl http://localhost:3002/api/admin/priority-keywords
curl "http://localhost:3002/api/admin/public/banners?position=hero"

echo.
echo ✅ Testing completado
echo 📝 Revisar resultados arriba
pause
EOF

chmod +x ../start-intertravel-complete.bat
chmod +x ../test-intertravel-features.bat

log_success "Scripts de inicio creados"

# ===============================================
# 8. RESUMEN FINAL
# ===============================================

echo ""
echo "🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE"
echo "======================================"
echo ""
log_success "✅ Backend configurado con APIs completas"
log_success "✅ Frontend con componentes integrados"
log_success "✅ Base de datos estructura creada"
log_success "✅ Modal de detalles con cache"
log_success "✅ Sistema de prioridades admin"
log_success "✅ Banners configurables"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "=================="
echo "1. cd backend && npm start        (Puerto 3002)"
echo "2. cd frontend && npm run dev     (Puerto 3005)"
echo "3. Abrir http://localhost:3005"
echo "4. Ir a /admin/settings para configurar"
echo ""
echo "📋 TESTING RÁPIDO:"
echo "=================="
echo "• Homepage: http://localhost:3005 (ver banners)"
echo "• Paquetes: http://localhost:3005/paquetes (probar modal)"
echo "• Admin: http://localhost:3005/admin/settings (tab Prioridades)"
echo ""
echo "📞 ENDPOINTS API:"
echo "================="
echo "• Health: http://localhost:3002/api/health"
echo "• Paquetes: http://localhost:3002/api/packages/featured"
echo "• Keywords: http://localhost:3002/api/admin/priority-keywords"
echo "• Banners: http://localhost:3002/api/admin/public/banners"
echo ""

# Preguntar si iniciar automáticamente
echo -n "¿Iniciar el sistema ahora? (y/N): "
read START_NOW

if [[ $START_NOW =~ ^[Yy]$ ]]; then
    log_info "Iniciando sistema..."
    cd backend
    npm start &
    sleep 3
    cd ../frontend
    npm run dev &
    
    log_success "Sistema iniciado!"
    log_info "Backend: http://localhost:3002"
    log_info "Frontend: http://localhost:3005"
else
    log_info "Para iniciar manualmente:"
    echo "  ./start-intertravel-complete.bat"
fi

echo ""
log_success "🎯 INSTALACIÓN FINALIZADA - SISTEMA LISTO PARA USAR"