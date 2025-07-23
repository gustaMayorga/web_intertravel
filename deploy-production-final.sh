#!/bin/bash

echo "🚀 DEPLOY INTERTRAVEL - VERSION LIMPIA Y CORREGIDA"
echo "================================================="

# Variables de configuración
PROJECT_NAME="intertravel-unified"
SERVER_IP="18.224.68.191"
SERVER_USER="ubuntu"
SSH_KEY="aws-key.pem"
DEPLOY_PATH="/var/www/intertravel"
BACKUP_PATH="/var/backups/intertravel"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Función para verificar prerrequisitos
check_prerequisites() {
    log_info "Verificando prerrequisitos..."
    
    # Verificar SSH key
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key no encontrada: $SSH_KEY"
        exit 1
    fi
    
    # Verificar archivos de proyecto
    if [ ! -f "package.json" ]; then
        log_error "package.json no encontrado. ¿Estás en el directorio correcto?"
        exit 1
    fi
    
    # Verificar git
    if ! git status &> /dev/null; then
        log_error "Este no es un repositorio git válido"
        exit 1
    fi
    
    log_success "Prerrequisitos verificados"
}

# Función para limpiar archivos localmente
clean_local_files() {
    log_info "Limpiando archivos locales antes del deploy..."
    
    # Limpiar node_modules y builds
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Limpiar archivos temporales
    find . -name "*.log" -delete 2>/dev/null || true
    find . -name "*.backup" -delete 2>/dev/null || true
    find . -name "*~" -delete 2>/dev/null || true
    
    log_success "Archivos locales limpiados"
}

# Función para crear backup en servidor
create_server_backup() {
    log_info "Creando backup en servidor..."
    
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << EOF
        # Crear directorio de backup con timestamp
        BACKUP_DIR="$BACKUP_PATH/backup-\$(date +%Y%m%d-%H%M%S)"
        sudo mkdir -p "\$BACKUP_DIR"
        
        # Backup del código actual si existe
        if [ -d "$DEPLOY_PATH" ]; then
            sudo cp -r "$DEPLOY_PATH" "\$BACKUP_DIR/"
            echo "✅ Backup creado en \$BACKUP_DIR"
        else
            echo "ℹ️  Primera instalación, no hay backup previo"
        fi
EOF
    
    log_success "Backup completado"
}

# Función para transferir archivos
transfer_files() {
    log_info "Transfiriendo archivos al servidor..."
    
    # Crear archivo temporal con lista de exclusiones
    cat > .rsync-exclude << EOF
node_modules/
.next/
dist/
build/
*.log
*.backup
.git/
.env.local
.DS_Store
Thumbs.db
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
    
    # Transferir archivos usando rsync
    rsync -avz --progress \
        --exclude-from=.rsync-exclude \
        --delete \
        -e "ssh -i $SSH_KEY" \
        ./ "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"
    
    # Limpiar archivo temporal
    rm .rsync-exclude
    
    log_success "Archivos transferidos"
}

# Función para instalar dependencias en servidor
install_dependencies() {
    log_info "Instalando dependencias en servidor..."
    
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
        cd /var/www/intertravel
        
        echo "📦 Instalando dependencias del backend..."
        cd backend && npm ci --only=production
        
        echo "📦 Instalando dependencias del frontend..."
        cd ../frontend && npm ci --only=production
        
        echo "📦 Instalando dependencias de app_cliente..."
        cd ../app_cliete && npm ci --only=production
        
        echo "✅ Todas las dependencias instaladas"
EOF
    
    log_success "Dependencias instaladas"
}

# Función para compilar aplicaciones
build_applications() {
    log_info "Compilando aplicaciones en servidor..."
    
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
        cd /var/www/intertravel
        
        echo "🔨 Compilando frontend..."
        cd frontend && npm run build
        
        echo "🔨 Compilando app_cliente..."
        cd ../app_cliete && npm run build
        
        echo "✅ Aplicaciones compiladas"
EOF
    
    log_success "Aplicaciones compiladas"
}

# Función para configurar servicios del sistema
setup_system_services() {
    log_info "Configurando servicios del sistema..."
    
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
        # Crear servicio systemd para backend
        sudo tee /etc/systemd/system/intertravel-backend.service > /dev/null << 'SERVICE'
[Unit]
Description=InterTravel Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/intertravel/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
SERVICE

        # Crear servicio systemd para frontend
        sudo tee /etc/systemd/system/intertravel-frontend.service > /dev/null << 'SERVICE'
[Unit]
Description=InterTravel Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/intertravel/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3005

[Install]
WantedBy=multi-user.target
SERVICE

        # Crear servicio systemd para app cliente
        sudo tee /etc/systemd/system/intertravel-app.service > /dev/null << 'SERVICE'
[Unit]
Description=InterTravel App Cliente
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/intertravel/app_cliete
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3009

[Install]
WantedBy=multi-user.target
SERVICE

        # Recargar systemd
        sudo systemctl daemon-reload
        
        echo "✅ Servicios del sistema configurados"
EOF
    
    log_success "Servicios configurados"
}

# Función para configurar Nginx
setup_nginx() {
    log_info "Configurando Nginx..."
    
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
        # Crear configuración de Nginx
        sudo tee /etc/nginx/sites-available/intertravel > /dev/null << 'NGINX'
server {
    listen 80;
    server_name 18.224.68.191;
    
    # Configuración general
    client_max_body_size 100M;
    
    # Landing page principal
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Panel administrativo
    location /admin {
        proxy_pass http://localhost:3005/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # App cliente DNI
    location /app {
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3002/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3005/_next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

        # Habilitar sitio
        sudo ln -sf /etc/nginx/sites-available/intertravel /etc/nginx/sites-enabled/
        
        # Remover configuración por defecto
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Verificar configuración
        sudo nginx -t
        
        echo "✅ Nginx configurado"
EOF
    
    log_success "Nginx configurado"
}

# Función para iniciar servicios
start_services() {
    log_info "Iniciando servicios..."
    
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
        # Detener servicios si están corriendo
        sudo systemctl stop intertravel-backend || true
        sudo systemctl stop intertravel-frontend || true
        sudo systemctl stop intertravel-app || true
        
        # Iniciar y habilitar servicios
        sudo systemctl enable intertravel-backend
        sudo systemctl start intertravel-backend
        
        sudo systemctl enable intertravel-frontend
        sudo systemctl start intertravel-frontend
        
        sudo systemctl enable intertravel-app
        sudo systemctl start intertravel-app
        
        # Reiniciar Nginx
        sudo systemctl reload nginx
        
        echo "✅ Todos los servicios iniciados"
EOF
    
    log_success "Servicios iniciados"
}

# Función para verificar deployment
verify_deployment() {
    log_info "Verificando deployment..."
    
    sleep 10  # Esperar a que los servicios se inicien
    
    echo "🔍 Verificando endpoints..."
    
    # Verificar API health
    if curl -f "http://$SERVER_IP/api/health" &> /dev/null; then
        log_success "✅ API Backend funcionando"
    else
        log_warning "⚠️  API Backend no responde"
    fi
    
    # Verificar frontend
    if curl -f "http://$SERVER_IP" &> /dev/null; then
        log_success "✅ Frontend funcionando"
    else
        log_warning "⚠️  Frontend no responde"
    fi
    
    # Verificar app cliente
    if curl -f "http://$SERVER_IP/app" &> /dev/null; then
        log_success "✅ App Cliente funcionando"
    else
        log_warning "⚠️  App Cliente no responde"
    fi
    
    echo ""
    echo "🎯 URLs FINALES:"
    echo "📱 Landing: http://$SERVER_IP/"
    echo "👑 Admin: http://$SERVER_IP/admin"
    echo "📱 App DNI: http://$SERVER_IP/app"
    echo "🔧 API: http://$SERVER_IP/api/health"
}

# Función principal
main() {
    echo "🚀 COMENZANDO DEPLOYMENT DE INTERTRAVEL"
    echo "======================================="
    
    check_prerequisites
    clean_local_files
    create_server_backup
    transfer_files
    install_dependencies
    build_applications
    setup_system_services
    setup_nginx
    start_services
    verify_deployment
    
    echo ""
    echo "🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!"
    echo "🌐 Tu aplicación está disponible en: http://$SERVER_IP"
    echo ""
}

# Ejecutar script principal
main "$@"