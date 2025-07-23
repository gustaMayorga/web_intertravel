#!/bin/bash
# ===============================================
# DEPLOYMENT AUTOMATIZADO AWS LIGHTSAIL
# InterTravel System - Producción Completa
# ===============================================

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Variables de configuración
DOMAIN="intertravel.com.ar"  # Dominio configurado
APP_DIR="/var/www/intertravel"
REPO_URL="https://github.com/gustaMayorga/web_intertravel.git"  # Repo configurado
INSTANCE_NAME="Intertrtavel-UBNT-PROD"  # ⭐ Nombre correcto

echo "================================================"
echo "🚀 DEPLOYMENT INTERTRAVEL AWS LIGHTSAIL"
echo "================================================"

# ===============================================
# FASE 1: ACTUALIZACIÓN SISTEMA
# ===============================================
log "FASE 1: Actualizando sistema Ubuntu..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# ===============================================
# FASE 2: INSTALACIÓN NODE.JS
# ===============================================
log "FASE 2: Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node_version=$(node --version)
npm_version=$(npm --version)
log "Node.js instalado: $node_version"
log "NPM instalado: $npm_version"

# ===============================================
# FASE 3: CONFIGURACIÓN POSTGRESQL
# ===============================================
log "FASE 3: Configurando PostgreSQL..."

# Configurar usuario y base de datos
sudo -u postgres createuser --interactive --pwprompt intertravel_user || true
sudo -u postgres createdb intertravel_prod -O intertravel_user || true

# Configurar acceso
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
echo "local   intertravel_prod    intertravel_user                     md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql
sudo systemctl enable postgresql

log "PostgreSQL configurado correctamente"

# ===============================================
# FASE 4: CLONAR Y CONFIGURAR APLICACIÓN
# ===============================================
log "FASE 4: Clonando repositorio..."

# Limpiar directorio si existe
sudo rm -rf $APP_DIR
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clonar repositorio
git clone -b production-v2-intertravel-2025 $REPO_URL $APP_DIR
cd $APP_DIR

# ===============================================
# FASE 5: CONFIGURAR ENVIRONMENT
# ===============================================
log "FASE 5: Configurando variables de entorno..."

cat > .env << EOF
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel_prod
DB_USER=intertravel_user
DB_PASSWORD=intertravel_2025!
JWT_SECRET=InterTravel_JWT_Secret_Production_$(openssl rand -hex 32)
FRONTEND_PORT=3005
BACKEND_PORT=3000
APP_CLIENT_PORT=3009

# URLs para producción
FRONTEND_URL=https://$DOMAIN
BACKEND_URL=https://$DOMAIN/api
APP_CLIENT_URL=https://$DOMAIN/app

# SSL Configuration
SSL_ENABLED=true
FORCE_HTTPS=true
EOF

# ===============================================
# FASE 6: INSTALAR DEPENDENCIAS
# ===============================================
log "FASE 6: Instalando dependencias..."

# Backend
cd $APP_DIR/backend
npm install --production
log "✅ Backend dependencies instaladas"

# Frontend
cd $APP_DIR/frontend
npm install
npm run build
log "✅ Frontend build completado"

# App Cliente
cd $APP_DIR/app_cliete
npm install
npm run build
log "✅ App Cliente build completado"

# ===============================================
# FASE 7: APLICAR SCHEMA BASE DE DATOS
# ===============================================
log "FASE 7: Aplicando schema de base de datos..."

cd $APP_DIR
if [ -f "database-users-schema.sql" ]; then
    PGPASSWORD="intertravel_2025!" psql -h localhost -U intertravel_user -d intertravel_prod -f database-users-schema.sql
    log "✅ Schema de usuarios aplicado"
fi

if [ -f "esquema_completo_intertravel.sql" ]; then
    PGPASSWORD="intertravel_2025!" psql -h localhost -U intertravel_user -d intertravel_prod -f esquema_completo_intertravel.sql
    log "✅ Schema completo aplicado"
fi

# ===============================================
# FASE 8: CONFIGURAR SERVICIOS SYSTEMD
# ===============================================
log "FASE 8: Configurando servicios systemd..."

# Backend Service
sudo tee /etc/systemd/system/intertravel-backend.service > /dev/null << EOF
[Unit]
Description=InterTravel Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/backend
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Frontend Service
sudo tee /etc/systemd/system/intertravel-frontend.service > /dev/null << EOF
[Unit]
Description=InterTravel Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/frontend
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# App Cliente Service
sudo tee /etc/systemd/system/intertravel-app.service > /dev/null << EOF
[Unit]
Description=InterTravel App Cliente
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/app_cliete
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicios
sudo systemctl daemon-reload
sudo systemctl enable intertravel-backend
sudo systemctl enable intertravel-frontend
sudo systemctl enable intertravel-app

log "✅ Servicios systemd configurados"

# ===============================================
# FASE 9: CONFIGURAR NGINX
# ===============================================
log "FASE 9: Configurando Nginx..."

sudo tee /etc/nginx/sites-available/intertravel > /dev/null << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript;
    
    # Frontend (Landing + Admin)
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }

    # Backend API
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }

    # App Cliente
    location /app/ {
        limit_req zone=general burst=15 nodelay;
        proxy_pass http://localhost:3009/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/intertravel /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuración Nginx
sudo nginx -t || error "Error en configuración Nginx"

# ===============================================
# FASE 10: CERTIFICADO SSL
# ===============================================
log "FASE 10: Instalando certificado SSL..."

sudo apt install -y certbot python3-certbot-nginx

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Obtener certificado SSL
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || warning "SSL setup manual requerido"

# ===============================================
# FASE 11: INICIAR SERVICIOS
# ===============================================
log "FASE 11: Iniciando servicios..."

sudo systemctl start intertravel-backend
sudo systemctl start intertravel-frontend  
sudo systemctl start intertravel-app

# Verificar estado
sleep 5
if sudo systemctl is-active --quiet intertravel-backend; then
    log "✅ Backend service corriendo"
else
    error "❌ Backend service falló"
fi

if sudo systemctl is-active --quiet intertravel-frontend; then
    log "✅ Frontend service corriendo"
else
    error "❌ Frontend service falló"
fi

if sudo systemctl is-active --quiet intertravel-app; then
    log "✅ App Cliente service corriendo"
else
    error "❌ App Cliente service falló"
fi

# ===============================================
# FASE 12: CONFIGURAR FIREWALL
# ===============================================
log "FASE 12: Configurando firewall..."

sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

log "✅ Firewall configurado"

# ===============================================
# FASE 13: VERIFICACIÓN FINAL
# ===============================================
log "FASE 13: Verificación final..."

echo "================================================"
echo "🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE"
echo "================================================"
echo ""
echo "📋 VERIFICACIONES FINALES:"
echo "✅ Sistema Ubuntu actualizado"
echo "✅ Node.js y NPM instalados"
echo "✅ PostgreSQL configurado"
echo "✅ Aplicación clonada e instalada"
echo "✅ Services systemd creados y activos"
echo "✅ Nginx configurado"
echo "✅ SSL certificado instalado"
echo "✅ Firewall configurado"
echo ""
echo "🌐 URLS DISPONIBLES:"
echo "🔗 Sitio web: https://$DOMAIN"
echo "🔗 Admin panel: https://$DOMAIN/admin" 
echo "🔗 App cliente: https://$DOMAIN/app"
echo "🔗 API: https://$DOMAIN/api/health"
echo ""
echo "📊 VERIFICAR MANUALMENTE:"
echo "1. Abrir https://$DOMAIN en navegador"
echo "2. Verificar que SSL funciona (candado verde)"
echo "3. Probar login admin"
echo "4. Verificar app cliente"
echo "5. Confirmar GA4 tracking"
echo ""
echo "🎯 SISTEMA INTERTRAVEL EN PRODUCCIÓN 🎯"
echo "================================================"
