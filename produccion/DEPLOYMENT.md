# 🎯 FASE 3: CONFIGURACIÓN AWS LIGHTSAIL

## 📋 GUÍA COMPLETA DE DEPLOY

### 1. PREPARACIÓN DEL DOMINIO

```bash
# Configurar DNS en tu proveedor de dominio
# Apuntar a la IP de tu instancia LightSail:

A    @              XXX.XXX.XXX.XXX
A    www            XXX.XXX.XXX.XXX
A    admin          XXX.XXX.XXX.XXX
A    app            XXX.XXX.XXX.XXX
```

### 2. CONFIGURACIÓN LIGHTSAIL

#### Crear Instancia
- **OS**: Ubuntu 20.04 LTS
- **Plan**: Al menos $10/mes (2GB RAM)
- **Región**: Closest to Argentina (US East)

#### Configurar Networking
```bash
# Abrir puertos en LightSail Console:
SSH     22    ✅
HTTP    80    ✅
HTTPS   443   ✅
Custom  3002  ✅ (Backend API)
Custom  3005  ✅ (Admin Panel)
Custom  3009  ✅ (Client App)
```

### 3. CONEXIÓN SSH

```bash
# Conectar a la instancia
ssh -i LightsailDefaultKey-REGION.pem ubuntu@YOUR_IP

# O usar el terminal web de LightSail
```

### 4. INSTALACIÓN AUTOMÁTICA

```bash
# Clonar el repositorio de producción
git clone https://github.com/TU_USUARIO/intertravel-system.git /var/www/intertravel
cd /var/www/intertravel

# Ejecutar script de instalación
chmod +x deploy/setup.sh
sudo ./deploy/setup.sh
```

### 5. CONFIGURACIÓN MANUAL (Si es necesario)

#### Configurar Variables de Entorno
```bash
# Backend
cd /var/www/intertravel/backend
cp .env.example .env
nano .env

# Configurar con datos reales:
DB_PASSWORD=tu_password_real
ADMIN_PASSWORD=password_admin_seguro
AGENCY_PASSWORD=password_agencia_seguro
JWT_SECRET=jwt_secret_muy_largo
```

#### Inicializar Base de Datos
```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE intertravel_prod;
CREATE USER intertravel_user WITH ENCRYPTED PASSWORD 'tu_password_real';
GRANT ALL PRIVILEGES ON DATABASE intertravel_prod TO intertravel_user;
```

#### Instalar Dependencias
```bash
# Backend
cd /var/www/intertravel/backend
npm install --production

# Admin Panel
cd /var/www/intertravel/admin-panel
npm install
npm run build

# Client App
cd /var/www/intertravel/client-app
npm install
npm run build
```

#### Configurar PM2
```bash
cd /var/www/intertravel
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Configurar Nginx
```bash
# Copiar configuración
sudo cp deploy/nginx.conf /etc/nginx/sites-available/intertravel
sudo ln -s /etc/nginx/sites-available/intertravel /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t
sudo systemctl restart nginx
```

#### Configurar SSL
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificados SSL
sudo certbot --nginx -d intertravel.com.ar -d www.intertravel.com.ar

# Configurar renovación automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 6. VERIFICACIÓN DEL DEPLOY

#### Health Checks
```bash
# Verificar servicios
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Verificar conectividad
curl http://localhost:3002/api/health
curl http://localhost:3005
curl http://localhost:3009

# Verificar desde exterior
curl https://tu-dominio.com/api/health
```

#### Testing de Funcionalidades
1. **API Backend**: `https://tu-dominio.com/api/health`
2. **Admin Panel**: `https://tu-dominio.com/admin`
3. **Client App**: `https://tu-dominio.com`

#### Credenciales de Prueba
- **Admin**: admin / [password configurado]
- **Agencia**: agencia_admin / [password configurado]

### 7. MONITOREO POST-DEPLOY

#### Logs en Tiempo Real
```bash
# PM2 Logs
pm2 logs

# Nginx Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistema
htop
df -h
```

#### Comandos Útiles
```bash
# Reiniciar aplicaciones
pm2 restart all

# Recargar Nginx
sudo nginx -s reload

# Backup base de datos
pg_dump intertravel_prod > backup_$(date +%Y%m%d).sql

# Ver espacio en disco
df -h

# Ver memoria
free -h

# Ver procesos
ps aux | grep node
```

### 8. MANTENIMIENTO

#### Actualizaciones de Código
```bash
cd /var/www/intertravel
git pull origin main
npm install --production
npm run build
pm2 restart all
sudo nginx -s reload
```

#### Backups Automáticos
```bash
# Ya configurado en el script de instalación
# Backups diarios a las 2:00 AM
# Retención: 7 días
# Ubicación: /var/www/intertravel/backups/
```

### 9. SOLUCIÓN DE PROBLEMAS

#### Aplicación no responde
```bash
pm2 status
pm2 restart all
pm2 logs --lines 50
```

#### Error 502 Bad Gateway
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

#### Error de base de datos
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

#### Espacio en disco lleno
```bash
df -h
sudo apt autoremove
sudo apt autoclean
find /var/log -name "*.log" -size +100M -delete
```

### 10. OPTIMIZACIONES DE PRODUCCIÓN

#### Configurar Cache
```bash
# Redis para cache (opcional)
sudo apt install redis-server
sudo systemctl enable redis-server
```

#### Monitoring
```bash
# Instalar htop
sudo apt install htop

# Configurar alertas de disco
echo "df -h | awk 'NR>1 && \$5+0 > 80 {print \$0}'" > /tmp/disk_check.sh
echo "0 */6 * * * /bin/bash /tmp/disk_check.sh" | crontab -
```

---

## 🎉 DEPLOY COMPLETADO

Una vez seguidos todos los pasos:

### ✅ URLs Activas
- **🌍 Cliente**: https://tu-dominio.com
- **🔧 Admin**: https://tu-dominio.com/admin  
- **🔌 API**: https://tu-dominio.com/api

### ✅ Funcionalidades Verificadas
- [ ] Login admin funcionando
- [ ] API respondiendo
- [ ] Base de datos conectada
- [ ] SSL configurado
- [ ] Backups automáticos
- [ ] Monitoreo activo

### 📞 Soporte Post-Deploy
- **Logs**: `/var/www/intertravel/logs/`
- **Backups**: `/var/www/intertravel/backups/`
- **Configuración**: `/var/www/intertravel/deploy/`

**¡Sistema InterTravel desplegado exitosamente en AWS LightSail!** 🚀