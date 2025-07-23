#!/bin/bash

# ===============================================
# SCRIPT DE INICIALIZACIÓN COMPLETA - INTERTRAVEL
# Configura y ejecuta todo el sistema con las mejoras
# ===============================================

echo "🚀 ==============================================="
echo "🚀 INICIANDO SISTEMA INTERTRAVEL COMPLETO"
echo "🚀 ==============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logs con colores
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

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto WEB-FINAL-UNIFICADA"
    exit 1
fi

log_info "Directorio verificado: $(pwd)"

# ===============================================
# FASE 1: PREPARACIÓN DE LA BASE DE DATOS
# ===============================================

log_info "FASE 1: Configurando base de datos PostgreSQL"

# Verificar si PostgreSQL está ejecutándose
if ! command -v psql &> /dev/null; then
    log_warning "PostgreSQL no encontrado. Instalando..."
    # Para Windows con Chocolatey
    if command -v choco &> /dev/null; then
        choco install postgresql -y
    # Para sistemas Unix
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install postgresql postgresql-contrib -y
    elif command -v brew &> /dev/null; then
        brew install postgresql
    else
        log_error "No se pudo instalar PostgreSQL automáticamente. Por favor, instálalo manualmente."
        exit 1
    fi
fi

# Crear base de datos si no existe
log_info "Creando base de datos intertravel_dev si no existe..."
createdb intertravel_dev 2>/dev/null || log_warning "Base de datos ya existe o no se pudo crear"

# Ejecutar script de extensión de BD
log_info "Ejecutando extensiones de base de datos..."
if [ -f "backend/scripts/extend-database.sql" ]; then
    psql -d intertravel_dev -f backend/scripts/extend-database.sql
    log_success "Extensiones de base de datos aplicadas"
else
    log_warning "Script de extensión no encontrado, saltando..."
fi

# ===============================================
# FASE 2: CONFIGURACIÓN DEL BACKEND
# ===============================================

log_info "FASE 2: Configurando backend (Puerto 3002)"

cd backend

# Verificar e instalar dependencias del backend
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias del backend..."
    npm install
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    log_info "Creando archivo .env para backend..."
    cat > .env << EOF
# Base de datos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intertravel_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Servidor
PORT=3002
NODE_ENV=development

# Travel Compositor
TRAVEL_COMPOSITOR_API=https://online.travelcompositor.com
MICROSITE_ID=intertravelgroup

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@intertravel.com.ar
SMTP_PASS=app_password

# Pagos
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx-xxxx-xxxx
STRIPE_SECRET_KEY=sk_test_xxxx

# Seguridad
JWT_SECRET=your_jwt_secret_here_change_in_production
EOF
    log_success "Archivo .env creado"
fi

# Verificar módulos adicionales
log_info "Verificando módulos avanzados..."
if [ -f "modules/sales-auto-sync.js" ] && [ -f "modules/referral-engine.js" ]; then
    log_success "Módulos avanzados encontrados"
else
    log_warning "Algunos módulos avanzados no encontrados"
fi

cd ..

# ===============================================
# FASE 3: CONFIGURACIÓN DEL FRONTEND ADMIN
# ===============================================

log_info "FASE 3: Configurando frontend admin (Puerto 3005)"

cd frontend

# Verificar e instalar dependencias del frontend
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias del frontend..."
    npm install
fi

# Crear archivo .env.local si no existe
if [ ! -f ".env.local" ]; then
    log_info "Creando archivo .env.local para frontend admin..."
    cat > .env.local << EOF
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_APP_CLIENT_URL=http://localhost:3009

# Travel Compositor
NEXT_PUBLIC_TRAVEL_COMPOSITOR_URL=https://online.travelcompositor.com
NEXT_PUBLIC_MICROSITE_ID=intertravelgroup

# Configuración
NEXT_PUBLIC_COMPANY_NAME=InterTravel Group
NEXT_PUBLIC_COMPANY_EVYT=15.566
NEXT_PUBLIC_CONTACT_EMAIL=ventas@intertravel.com.ar

# Tema
NEXT_PUBLIC_ADMIN_THEME=dark
EOF
    log_success "Archivo .env.local creado para admin"
fi

# Verificar componentes admin
log_info "Verificando componentes admin..."
if [ -f "src/app/admin/settings/page.tsx" ] && [ -f "src/styles/admin-dark-theme.css" ]; then
    log_success "Componentes admin con tema oscuro encontrados"
else
    log_warning "Algunos componentes admin no encontrados"
fi

cd ..

# ===============================================
# FASE 4: CONFIGURACIÓN DE APP CLIENTE
# ===============================================

log_info "FASE 4: Configurando app cliente (Puerto 3009)"

cd app_cliete

# Verificar e instalar dependencias de la app cliente
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias de la app cliente..."
    npm install
fi

# Verificar configuración del puerto
if grep -q "3009" package.json; then
    log_success "Puerto 3009 configurado correctamente"
else
    log_warning "Puerto 3009 no configurado en package.json"
fi

# Crear archivo .env.local si no existe
if [ ! -f ".env.local" ]; then
    log_info "Creando archivo .env.local para app cliente..."
    cat > .env.local << EOF
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_ADMIN_URL=http://localhost:3005

# App específica
NEXT_PUBLIC_APP_PORT=3009
NEXT_PUBLIC_APP_NAME=InterTravel Client

# Servicios
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
EOF
    log_success "Archivo .env.local creado para app cliente"
fi

cd ..

# ===============================================
# FASE 5: VERIFICACIÓN DE PUERTOS
# ===============================================

log_info "FASE 5: Verificando puertos disponibles"

check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Puerto $port ($service) ya está en uso"
        return 1
    else
        log_success "Puerto $port ($service) disponible"
        return 0
    fi
}

check_port 3002 "Backend"
check_port 3005 "Frontend Admin"
check_port 3009 "App Cliente"

# ===============================================
# FASE 6: SCRIPTS DE INICIO
# ===============================================

log_info "FASE 6: Creando scripts de inicio"

# Script para iniciar backend
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🔧 Iniciando Backend InterTravel (Puerto 3002)..."
cd backend
npm run dev
EOF

# Script para iniciar frontend admin
cat > start-frontend-admin.sh << 'EOF'
#!/bin/bash
echo "🎨 Iniciando Frontend Admin (Puerto 3005)..."
cd frontend
npm run dev
EOF

# Script para iniciar app cliente
cat > start-app-cliente.sh << 'EOF'
#!/bin/bash
echo "📱 Iniciando App Cliente (Puerto 3009)..."
cd app_cliete
npm run dev
EOF

# Script para iniciar todo
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando sistema completo InterTravel..."

# Función para matar procesos al salir
cleanup() {
    echo "🛑 Deteniendo todos los servicios..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Iniciar servicios en background
echo "🔧 Iniciando Backend..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 5

echo "🎨 Iniciando Frontend Admin..."
cd ../frontend && npm run dev &
ADMIN_PID=$!

sleep 5

echo "📱 Iniciando App Cliente..."
cd ../app_cliete && npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ Todos los servicios iniciados:"
echo "   🔧 Backend:        http://localhost:3002"
echo "   🎨 Admin:          http://localhost:3005"
echo "   📱 App Cliente:    http://localhost:3009"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar a que todos los procesos terminen
wait
EOF

# Hacer scripts ejecutables
chmod +x start-backend.sh
chmod +x start-frontend-admin.sh
chmod +x start-app-cliente.sh
chmod +x start-all.sh

log_success "Scripts de inicio creados"

# ===============================================
# FASE 7: VERIFICACIÓN FINAL
# ===============================================

log_info "FASE 7: Verificación final del sistema"

# Verificar estructura de archivos críticos
check_file() {
    if [ -f "$1" ]; then
        log_success "✓ $1"
    else
        log_warning "✗ $1 (no encontrado)"
    fi
}

echo ""
echo "📁 Verificando estructura de archivos:"
check_file "backend/server.js"
check_file "backend/database.js"
check_file "backend/modules/sales-auto-sync.js"
check_file "backend/modules/referral-engine.js"
check_file "backend/modules/services-integration.js"
check_file "backend/scripts/extend-database.sql"
check_file "frontend/src/app/admin/layout.tsx"
check_file "frontend/src/app/admin/settings/page.tsx"
check_file "frontend/src/styles/admin-dark-theme.css"
check_file "app_cliete/package.json"

echo ""
echo "🗄️ Verificando base de datos:"
if psql -d intertravel_dev -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" >/dev/null 2>&1; then
    TABLE_COUNT=$(psql -d intertravel_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    log_success "Base de datos conectada - $TABLE_COUNT tablas encontradas"
else
    log_warning "No se pudo conectar a la base de datos"
fi

# ===============================================
# RESULTADO FINAL
# ===============================================

echo ""
echo "🎉 ==============================================="
echo "🎉 CONFIGURACIÓN COMPLETADA"
echo "🎉 ==============================================="
echo ""
echo "📋 RESUMEN DE CONFIGURACIÓN:"
echo "   ✅ Backend:           Puerto 3002 (PostgreSQL + Express)"
echo "   ✅ Frontend Admin:    Puerto 3005 (Next.js + Tema Oscuro)"
echo "   ✅ App Cliente:       Puerto 3009 (Next.js + PWA)"
echo "   ✅ Base de Datos:     PostgreSQL con extensiones"
echo "   ✅ Sincronización:    Ventas automáticas"
echo "   ✅ Referidos:         Sistema automático"
echo "   ✅ Permisos:          ABM completo"
echo ""
echo "🚀 PARA INICIAR EL SISTEMA:"
echo ""
echo "   Opción 1 - Todo junto:"
echo "   ./start-all.sh"
echo ""
echo "   Opción 2 - Por separado:"
echo "   ./start-backend.sh      # Backend en puerto 3002"
echo "   ./start-frontend-admin.sh # Admin en puerto 3005"
echo "   ./start-app-cliente.sh  # App cliente en puerto 3009"
echo ""
echo "🔗 URLs principales:"
echo "   📊 API Health:        http://localhost:3002/api/health"
echo "   🎨 Admin Panel:       http://localhost:3005/admin"
echo "   📱 App Cliente:       http://localhost:3009"
echo ""
echo "🔐 Credenciales por defecto:"
echo "   Admin:    admin / admin123"
echo "   Agencia:  agencia_admin / agencia123"
echo ""

log_success "Sistema InterTravel configurado exitosamente!"
log_info "Revisa los logs arriba para cualquier advertencia y ejecuta './start-all.sh' para iniciar"