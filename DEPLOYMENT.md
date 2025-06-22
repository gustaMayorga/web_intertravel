# Configuración de Despliegue - InterTravel

## 🌐 Requisitos del Servidor

### Especificaciones Mínimas
- **CPU**: 2 cores
- **RAM**: 4GB
- **Almacenamiento**: 20GB SSD
- **Ancho de banda**: 100 Mbps

### Software Requerido
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18.17.0+
- PostgreSQL 13+
- Nginx 1.18+
- PM2 (para gestión de procesos)
- Certbot (para SSL)

## 🔧 Configuración del Servidor

### 1. Configuración inicial
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configuración de PostgreSQL
```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE intertravel;
CREATE USER intertravel_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE intertravel TO intertravel_user;
\q
```

### 3. Configuración de Nginx

Crear archivo: `/etc/nginx/sites-available/intertravel`

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Certificados SSL (configurar con Certbot)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend (Next.js)
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

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Límites de tiempo para API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Archivos estáticos
    location /_next/static {
        proxy_cache_valid 200 60m;
        proxy_pass http://localhost:3005;
    }

    # Límites de upload
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/intertravel_access.log;
    error_log /var/log/nginx/intertravel_error.log;
}
```

### 4. Activar sitio Nginx
```bash
sudo ln -s /etc/nginx/sites-available/intertravel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🚀 Proceso de Despliegue

### 1. Clonar proyecto en servidor
```bash
cd /var/www
sudo git clone [URL_REPOSITORIO] intertravel
sudo chown -R $USER:$USER /var/www/intertravel
cd intertravel
```

### 2. Configurar variables de entorno

**Backend** (`backend/.env`):
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel
DB_USER=intertravel_user
DB_PASSWORD=tu_password_seguro
JWT_SECRET=tu_jwt_secret_muy_seguro_minimo_32_caracteres
API_URL=https://tu-dominio.com/api
CORS_ORIGIN=https://tu-dominio.com
```

**Frontend** (`frontend/.env.production`):
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

### 3. Instalar dependencias y compilar
```bash
# Backend
cd backend
npm ci --only=production
cd ..

# Frontend
cd frontend
npm ci
npm run build
cd ..
```

### 4. Configurar PM2
```bash
# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'intertravel-backend',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      max_memory_restart: '1G'
    },
    {
      name: 'intertravel-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      max_memory_restart: '1G'
    }
  ]
};
EOF

# Crear directorio de logs
mkdir -p logs

# Iniciar aplicaciones
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configurar SSL con Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 6. Configurar backup automático
```bash
# Crear script de backup
sudo tee /usr/local/bin/backup-intertravel.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/intertravel"
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -h localhost -U intertravel_user intertravel > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/intertravel

# Limpiar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-intertravel.sh

# Configurar cron para backup diario a las 2 AM
echo "0 2 * * * /usr/local/bin/backup-intertravel.sh" | sudo crontab -
```

## 🔍 Monitoreo y Mantenimiento

### Comandos útiles de PM2
```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar aplicaciones
pm2 restart all

# Reload sin downtime
pm2 reload all

# Monitoreo en tiempo real
pm2 monit
```

### Logs importantes
- Nginx: `/var/log/nginx/intertravel_*.log`
- PM2: `./logs/*.log`
- Sistema: `/var/log/syslog`

### Actualización de la aplicación
```bash
cd /var/www/intertravel
git pull origin main
cd frontend && npm run build && cd ..
pm2 reload all
```

## 🛡️ Seguridad

### Firewall (UFW)
```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
```

### Actualizaciones automáticas
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Configuración adicional de seguridad
- Cambiar puerto SSH por defecto
- Configurar fail2ban
- Usar claves SSH en lugar de contraseñas
- Configurar backups automáticos fuera del servidor
