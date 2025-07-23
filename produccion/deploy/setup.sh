#!/bin/bash

# ===============================================
# SETUP AUTOMÁTICO INTERTRAVEL - AWS LIGHTSAIL
# Script de instalación para Ubuntu 20.04/22.04
# ===============================================

set -e  # Exit on any error

echo "🚀 ==============================================="
echo "🚀 INSTALANDO INTERTRAVEL EN AWS LIGHTSAIL"
echo "🚀 ==============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/var/www/intertravel"
REPO_URL="https://github.com/TU_USUARIO/intertravel-system.git"
DB_NAME="intertravel_prod"
DB_USER="intertravel_user"
DB_PASSWORD=$(openssl rand -base64 32)

echo -e "${BLUE}📋 Configuración:${NC}"
echo "   📁 Directorio: $PROJECT_DIR"
echo "   🗄️ Base de datos: $DB_NAME"
echo "   👤 Usuario DB: $DB_USER"
echo ""

# ======================================
# ACTUALIZAR SISTEMA
# ======================================

echo -e "${YELLOW}📦 Actualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y

# ======================================
# INSTALAR DEPENDENCIAS
# ======================================

echo -e "${YELLOW}🔧 Instalando dependencias básicas...${NC}"
sudo apt install -y curl wget git unzip software-properties-common gnupg2

# Node.js 18.x
echo -e "${YELLOW}📦 Instalando Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versiones
node_version=$(node --version)
npm_version=$(npm --version)
echo -e "${GREEN}✅ Node.js: $node_version${NC}"
echo -e "${GREEN}✅ NPM: $npm_version${NC}"

# PostgreSQL
echo -e "${YELLOW}🐘 Instalando PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib

# Nginx
echo -e "${YELLOW}🌐 Instalando Nginx...${NC}"
sudo apt install -y nginx

# PM2 Global
echo -e "${YELLOW}⚙️ Instalando PM2...${NC}"
sudo npm install -g pm2

# Certbot para SSL
echo -e "${YELLOW}🔒 Instalando Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx

# ======================================
# CONFIGURAR POSTGRESQL
# ======================================

echo -e "${YELLOW}🔧 Configurando PostgreSQL...${NC}"

# Iniciar servicios
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

echo -e "${GREEN}✅ PostgreSQL configurado${NC}"

# ======================================
# CONFIGURAR DIRECTORIOS
# ======================================

echo -e "${YELLOW}📁 Creando directorios...${NC}"

# Crear estructura de directorios
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p /var/www/intertravel/logs
sudo mkdir -p /var/www/intertravel/backups

# Cambiar permisos
sudo chown -R $USER:$USER $PROJECT_DIR
sudo chown -R $USER:$USER /var/www/intertravel/logs

# ======================================
# CLONAR REPOSITORIO
# ======================================

echo -e "${YELLOW}📥 Clonando repositorio...${NC}"

# Nota: Este paso asume que el repositorio ya está en GitHub
# cd /var/www && git clone $REPO_URL intertravel

# Por ahora, copiamos desde la carpeta de producción local
echo -e "${BLUE}ℹ️ Para continuar, necesitas:${NC}"
echo "1. Subir el código a GitHub"
echo "2. Actualizar REPO_URL en este script"
echo "3. Ejecutar: git clone \$REPO_URL intertravel"

# ======================================
# INSTALAR DEPENDENCIAS DEL PROYECTO
# ======================================

install_project_dependencies() {
    echo -e "${YELLOW}📦 Instalando dependencias del proyecto...${NC}"
    
    # Backend
    cd $PROJECT_DIR/backend
    npm install --production
    
    # Admin Panel
    cd $PROJECT_DIR/admin-panel
    npm install
    npm run build
    
    # Client App
    cd $PROJECT_DIR/client-app
    npm install
    npm run build
    
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
}

# ======================================
# CONFIGURAR VARIABLES DE ENTORNO
# ======================================

setup_environment() {
    echo -e "${YELLOW}⚙️ Configurando variables de entorno...${NC}"
    
    # Backend .env
    cat > $PROJECT_DIR/backend/.env << EOF
NODE_ENV=production
PORT=3002

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# URLs
FRONTEND_URL=https://intertravel.com.ar/admin
CLIENT_APP_URL=https://intertravel.com.ar
DOMAIN_URL=https://intertravel.com.ar

# Security
ADMIN_PASSWORD=$(openssl rand -base64 32)
AGENCY_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
EOF

    echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
}

# ======================================
# CONFIGURAR NGINX
# ======================================

setup_nginx() {
    echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"
    
    # Copiar configuración
    sudo cp $PROJECT_DIR/deploy/nginx.conf /etc/nginx/sites-available/intertravel
    
    # Habilitar sitio
    sudo ln -sf /etc/nginx/sites-available/intertravel /etc/nginx/sites-enabled/
    
    # Remover default
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración
    sudo nginx -t
    
    # Recargar Nginx
    sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx configurado${NC}"
}

# ======================================
# CONFIGURAR PM2
# ======================================

setup_pm2() {
    echo -e "${YELLOW}⚙️ Configurando PM2...${NC}"
    
    # Copiar ecosystem
    cp $PROJECT_DIR/deploy/ecosystem.config.js $PROJECT_DIR/
    
    # Iniciar aplicaciones
    cd $PROJECT_DIR
    pm2 start ecosystem.config.js
    
    # Guardar configuración PM2
    pm2 save
    pm2 startup
    
    echo -e "${GREEN}✅ PM2 configurado${NC}"
}

# ======================================
# CONFIGURAR SSL
# ======================================

setup_ssl() {
    echo -e "${YELLOW}🔒 Configurando SSL con Let's Encrypt...${NC}"
    
    # Obtener certificado SSL
    sudo certbot --nginx -d intertravel.com.ar -d www.intertravel.com.ar --non-interactive --agree-tos --email admin@intertravel.com.ar
    
    # Configurar renovación automática
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    echo -e "${GREEN}✅ SSL configurado${NC}"
}

# ======================================
# CONFIGURAR FIREWALL
# ======================================

setup_firewall() {
    echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
    
    # Configurar UFW
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Permitir servicios esenciales
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 5432  # PostgreSQL
    
    # Habilitar firewall
    sudo ufw --force enable
    
    echo -e "${GREEN}✅ Firewall configurado${NC}"
}

# ======================================
# CONFIGURAR BACKUPS
# ======================================

setup_backups() {
    echo -e "${YELLOW}💾 Configurando backups automáticos...${NC}"
    
    # Script de backup
    cat > /var/www/intertravel/backups/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="intertravel_prod"
BACKUP_DIR="/var/www/intertravel/backups"

# Backup de base de datos
pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: db_backup_$DATE.sql.gz"
EOF

    chmod +x /var/www/intertravel/backups/backup.sh
    
    # Cron job para backups diarios
    echo "0 2 * * * /var/www/intertravel/backups/backup.sh" | crontab -
    
    echo -e "${GREEN}✅ Backups configurados${NC}"
}

# ======================================
# CONFIGURAR MONITOREO
# ======================================

setup_monitoring() {
    echo -e "${YELLOW}📊 Configurando monitoreo...${NC}"
    
    # Instalar htop para monitoreo
    sudo apt install -y htop
    
    # Configurar logrotate para logs de aplicación
    cat > /etc/logrotate.d/intertravel << EOF
/var/www/intertravel/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    echo -e "${GREEN}✅ Monitoreo configurado${NC}"
}

# ======================================
# FUNCIÓN PRINCIPAL
# ======================================

main() {
    echo -e "${BLUE}🚀 Iniciando instalación completa...${NC}"
    
    # Comentar estas líneas hasta tener el repositorio en GitHub
    # install_project_dependencies
    # setup_environment
    # setup_nginx
    # setup_pm2
    
    setup_firewall
    setup_backups
    setup_monitoring
    
    # Solo configurar SSL después de que el dominio apunte al servidor
    # setup_ssl
    
    echo -e "${GREEN}🎉 ===============================================${NC}"
    echo -e "${GREEN}🎉 INSTALACIÓN COMPLETADA${NC}"
    echo -e "${GREEN}🎉 ===============================================${NC}"
    echo ""
    echo -e "${BLUE}📋 Información importante:${NC}"
    echo "   🗄️ DB Password: $DB_PASSWORD"
    echo "   📁 Proyecto: $PROJECT_DIR"
    echo "   🌐 URLs:"
    echo "      - Cliente: https://intertravel.com.ar"
    echo "      - Admin: https://intertravel.com.ar/admin"
    echo "      - API: https://intertravel.com.ar/api"
    echo ""
    echo -e "${YELLOW}📝 Próximos pasos:${NC}"
    echo "1. Subir código a GitHub"
    echo "2. Clonar repositorio en $PROJECT_DIR"
    echo "3. Ejecutar funciones comentadas en este script"
    echo "4. Configurar DNS para apuntar al servidor"
    echo "5. Configurar SSL con certbot"
    echo ""
    echo -e "${BLUE}💡 Comandos útiles:${NC}"
    echo "   pm2 status          # Ver estado de aplicaciones"
    echo "   pm2 logs            # Ver logs"
    echo "   sudo nginx -t       # Verificar configuración Nginx"
    echo "   sudo systemctl status nginx  # Estado de Nginx"
    echo ""
}

# Ejecutar instalación
main

echo -e "${GREEN}✅ Script completado${NC}"