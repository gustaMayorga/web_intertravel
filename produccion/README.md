# 🚀 InterTravel System - Producción

Sistema completo de gestión turística B2B2C desarrollado para InterTravel Group.

## 🏗️ Arquitectura del Sistema

- **Backend**: Node.js + Express + PostgreSQL (Puerto 3002)
- **Admin Panel**: Next.js - Panel administrativo (Puerto 3005)
- **Client App**: Next.js - Aplicación final para clientes (Puerto 3009)
- **Base de Datos**: PostgreSQL con sistema de usuarios y módulos
- **Proxy**: Nginx como reverse proxy
- **Process Manager**: PM2 para gestión de procesos

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Login seguro con roles (Super Admin, Admin Agencia)
- Gestión de tokens JWT
- Middleware de autorización

### 👥 Gestión de Usuarios y Módulos
- Sistema completo de usuarios
- Asignación dinámica de módulos por usuario
- Permisos granulares (view, create, edit, delete, manage)
- Navegación adaptativa según permisos

### 🎯 Funcionalidades B2B2C
- **Backend API**: Endpoints para paquetes, reservas, autenticación
- **Panel Admin**: Gestión completa del sistema
- **App Cliente**: Interfaz final para usuarios finales

### 📊 Integración de Datos
- Sistema de priorización de paquetes InterTravel
- Integración con múltiples proveedores
- Cache inteligente para optimización

## 🚀 Instalación en AWS LightSail

### Opción 1: Script Automático (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/intertravel-system.git
cd intertravel-system

# Ejecutar script de instalación
chmod +x deploy/setup.sh
sudo ./deploy/setup.sh
```

### Opción 2: Docker (Alternativo)

```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos

# Ejecutar con Docker
docker-compose up -d
```

### Opción 3: Instalación Manual

#### 1. Preparar Servidor Ubuntu

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2
```

#### 2. Configurar Base de Datos

```bash
# Crear base de datos
sudo -u postgres createdb intertravel_prod
sudo -u postgres createuser intertravel_user

# Configurar permisos
sudo -u postgres psql
ALTER USER intertravel_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE intertravel_prod TO intertravel_user;
```

#### 3. Configurar Aplicación

```bash
# Clonar y configurar
git clone https://github.com/TU_USUARIO/intertravel-system.git /var/www/intertravel
cd /var/www/intertravel

# Backend
cd backend
npm install --production
cp .env.example .env
# Editar .env con configuración

# Admin Panel
cd ../admin-panel
npm install
npm run build

# Client App
cd ../client-app
npm install
npm run build
```

#### 4. Configurar PM2

```bash
# Iniciar aplicaciones
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. Configurar Nginx

```bash
# Copiar configuración
sudo cp deploy/nginx.conf /etc/nginx/sites-available/intertravel
sudo ln -s /etc/nginx/sites-available/intertravel /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Verificar y reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Configurar SSL

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com
```

## 🔧 Configuración

### Variables de Entorno

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel_prod
DB_USER=intertravel_user
DB_PASSWORD=tu_password_seguro

# Aplicación
NODE_ENV=production
PORT=3002

# URLs
FRONTEND_URL=https://tu-dominio.com/admin
CLIENT_APP_URL=https://tu-dominio.com
DOMAIN_URL=https://tu-dominio.com

# Seguridad
ADMIN_PASSWORD=password_admin_seguro
AGENCY_PASSWORD=password_agencia_seguro
JWT_SECRET=jwt_secret_muy_largo_y_seguro
```

## 📁 Estructura del Proyecto

```
intertravel-system/
├── backend/              # API Backend (Puerto 3002)
│   ├── server.js         # Servidor principal
│   ├── database.js       # Configuración PostgreSQL
│   ├── routes/           # Rutas de API
│   └── package.json
├── admin-panel/          # Panel Administrativo (Puerto 3005)
│   ├── src/
│   ├── package.json
│   └── next.config.js
├── client-app/           # Aplicación Cliente (Puerto 3009)
│   ├── src/
│   ├── package.json
│   └── next.config.ts
├── database/             # Scripts de base de datos
├── deploy/               # Configuración de despliegue
│   ├── nginx.conf        # Configuración Nginx
│   ├── ecosystem.config.js # Configuración PM2
│   └── setup.sh          # Script de instalación
├── .github/              # GitHub Actions
└── docker-compose.yml    # Configuración Docker
```

## 🌐 URLs del Sistema

Una vez desplegado, el sistema estará disponible en:

- **🌍 Aplicación Principal**: `https://tu-dominio.com`
- **🔧 Panel Admin**: `https://tu-dominio.com/admin`
- **🔌 API**: `https://tu-dominio.com/api`

## 👤 Credenciales por Defecto

### Super Admin
- **Usuario**: `admin`
- **Password**: `admin123` (cambiar en producción)

### Admin Agencia
- **Usuario**: `agencia_admin`
- **Password**: `agencia123` (cambiar en producción)

## 🔍 Monitoreo y Mantenimiento

### Comandos PM2 Útiles

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs
pm2 logs

# Reiniciar aplicación específica
pm2 restart intertravel-backend

# Reiniciar todas las aplicaciones
pm2 restart ecosystem.config.js

# Monitoreo en tiempo real
pm2 monit
```

### Comandos Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log
```

### Base de Datos

```bash
# Backup manual
pg_dump intertravel_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql intertravel_prod < backup_file.sql

# Conectar a la base de datos
psql -h localhost -U intertravel_user -d intertravel_prod
```

## 🔒 Seguridad

### Configuración de Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### Actualizaciones de Seguridad

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Actualizar dependencias Node.js
npm audit fix
```

## 📊 Backup Automático

El sistema incluye backup automático configurado en `/var/www/intertravel/backups/backup.sh`:

- **Frecuencia**: Diario a las 2:00 AM
- **Retención**: 7 días
- **Ubicación**: `/var/www/intertravel/backups/`

## 🔧 Solución de Problemas

### Aplicación no responde

```bash
# Verificar estado PM2
pm2 status

# Reiniciar aplicaciones
pm2 restart all

# Ver logs
pm2 logs
```

### Error de base de datos

```bash
# Verificar estado PostgreSQL
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

### Problemas de Nginx

```bash
# Verificar configuración
sudo nginx -t

# Ver estado
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx
```

## 📞 Soporte

Para soporte técnico:
- **Email**: soporte@intertravel.com.ar
- **Documentación**: Ver carpeta `/docs`
- **Logs**: Revisar `/var/www/intertravel/logs/`

## 🎯 Roadmap

- [ ] Integración con sistemas de pago
- [ ] Dashboard de analytics avanzado
- [ ] API móvil nativa
- [ ] Sistema de notificaciones push
- [ ] Integración con CRM externos

---

**InterTravel Group** - Sistema de Gestión Turística B2B2C v4.0