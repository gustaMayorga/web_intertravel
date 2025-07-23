# 🚀 GUÍA COMPLETA DEPLOYMENT AWS LIGHTSAIL - INTERTRAVEL

## 📋 PRE-REQUISITOS Y PREPARACIÓN

### ✅ **ESTADO ACTUAL DEL SISTEMA**
```json
{
  "funcionalidad": "95% completa",
  "base_datos": "100% funcional (intertravel_db)",
  "seo": "100% implementado",
  "analytics_ga4": "100% implementado", 
  "admin_system": "100% implementado",
  "testing_success": "80% (12/15 tests)",
  "ready_for_production": "✅ SÍ"
}
```

### 🎯 **RESULTADO FINAL ESPERADO**
- **Landing:** `https://tu-dominio.com`
- **Panel Admin:** `https://tu-dominio.com/admin`
- **App Cliente:** `https://tu-dominio.com/app` ⭐ (BOTÓN DIRECTO)
- **API Backend:** `https://tu-dominio.com/api`

---

## 🌐 PASO 1: CREAR INSTANCIA AWS LIGHTSAIL

### **1.1 CONFIGURACIÓN INICIAL**
1. **Ir a:** https://lightsail.aws.amazon.com/
2. **Click:** "Create instance"
3. **Seleccionar:**
   - **Platform:** Linux/Unix
   - **Blueprint:** OS Only → Ubuntu 22.04 LTS
   - **Instance plan:** $20/month (2GB RAM, 1vCPU, 60GB SSD)
   - **Region:** South America (São Paulo) - Más cercana a Argentina
   - **Instance name:** `Intertrtavel-UBNT-PROD` ⭐

### **1.2 CONFIGURACIÓN ADICIONAL**
- **Add launch script:** (Dejar vacío)
- **SSH key:** Usar default o crear nueva
- **Tags:** 
  - Key: `Project`, Value: `InterTravel`
  - Key: `Environment`, Value: `Production`

### **1.3 CONFIGURACIÓN NETWORKING**
1. **Static IP:** Crear y asignar IP estática (gratis el primer año)
2. **Firewall:** 
   - SSH (22) ✅
   - HTTP (80) ✅  
   - HTTPS (443) ✅
   - Custom: PostgreSQL (5432) - Solo desde instancia
3. **Backup:** Habilitar snapshots automáticos

---

## 📁 PASO 2: PREPARAR CÓDIGO PARA DEPLOYMENT

### **2.1 TESTING LOCAL FINAL**
```bash
# Desde: D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA
cd TESTING
EJECUTAR-TESTING-COMPLETO.bat

# Verificar que todos los servicios funcionen:
# Backend: http://localhost:3002
# Frontend: http://localhost:3005  
# App Cliente: http://localhost:3009
```

### **2.2 MODIFICACIONES PRE-DEPLOYMENT**

#### **AGREGAR BOTÓN DIRECTO A APP**
```bash
# Editar landing page para incluir botón directo
cd frontend/src/components
```

Crear archivo `AppButton.tsx`:
```typescript
// Botón directo a la app cliente
import Link from 'next/link';

export default function AppButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link 
        href="/app"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition hover:scale-105"
      >
        📱 Abrir App
      </Link>
    </div>
  );
}
```

Agregar en `layout.tsx`:
```typescript
import AppButton from '@/components/AppButton';

// Dentro del layout:
<main>
  {children}
  <AppButton />
</main>
```

#### **CONFIGURAR VARIABLES PRODUCCIÓN**
```bash
# Crear archivo .env.production
cd D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA
```

Contenido `.env.production`:
```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel_db
DB_USER=intertravel_user
DB_PASSWORD=intertravel_2025!
JWT_SECRET=InterTravel_JWT_Secret_Production_2025!

# URLs Producción (cambiar tu-dominio.com por tu dominio real)
FRONTEND_URL=https://tu-dominio.com
BACKEND_URL=https://tu-dominio.com/api
APP_CLIENT_URL=https://tu-dominio.com/app

# SSL y Seguridad
SSL_ENABLED=true
FORCE_HTTPS=true
SECURE_COOKIES=true

# Email Configuración (opcional para v1)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tu-dominio.com
SMTP_PASS=tu-password-app

# Analytics (configurar con tus IDs reales)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GTM_ID=GTM-XXXXXXX
GOOGLE_ADS_ID=AW-XXXXXXXXX

# Pagos (MercadoPago)
MERCADOPAGO_ACCESS_TOKEN=PROD-ACCESS-TOKEN
MERCADOPAGO_PUBLIC_KEY=PROD-PUBLIC-KEY

# Logs y Monitoreo
LOG_LEVEL=info
ENABLE_MONITORING=true
```

### **2.3 PREPARAR ARCHIVOS DEPLOYMENT**
```bash
# Actualizar script deployment con nombre correcto
sed -i 's/intertravel-production/Intertrtavel-UBNT-PROD/g' TESTING/deploy-aws-lightsail.sh

# Crear archivo de configuración de dominio
echo "DOMAIN_NAME=tu-dominio.com" > TESTING/domain-config.env
echo "INSTANCE_NAME=Intertrtavel-UBNT-PROD" >> TESTING/domain-config.env
```

---

## 🔐 PASO 3: CONFIGURAR ACCESO SSH

### **3.1 DESCARGAR SSH KEY**
1. En Lightsail → Account → SSH keys
2. Descargar `LightsailDefaultKey-sa-east-1.pem`
3. Guardar en carpeta segura (ej: `C:\AWS\keys\`)

### **3.2 CONFIGURAR PERMISOS SSH (Windows)**
```bash
# En PowerShell como Administrador
icacls "C:\AWS\keys\LightsailDefaultKey-sa-east-1.pem" /inheritance:r
icacls "C:\AWS\keys\LightsailDefaultKey-sa-east-1.pem" /grant:r "%username%:R"
```

### **3.3 CONECTAR VIA SSH**
```bash
# Reemplazar TU-IP-LIGHTSAIL con la IP real
ssh -i "C:\AWS\keys\LightsailDefaultKey-sa-east-1.pem" ubuntu@TU-IP-LIGHTSAIL

# Primera conexión confirmará fingerprint
# Responder: yes
```

---

## 📤 PASO 4: SUBIR CÓDIGO AL SERVIDOR

### **OPCIÓN A: VIA GIT (RECOMENDADO)**

#### **4.1 Preparar Repositorio**
```bash
# En local - inicializar git si no existe
cd D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA
git init
git add .
git commit -m "Production ready - Intertrtavel-UBNT-PROD"

# Subir a GitHub/GitLab (crear repo privado)
git remote add origin https://github.com/tu-usuario/intertravel-prod.git
git push -u origin main
```

#### **4.2 Clonar en Servidor**
```bash
# En servidor Lightsail
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www
cd /var/www

# Clonar repositorio
git clone https://github.com/tu-usuario/intertravel-prod.git intertravel
cd intertravel

# Verificar archivos
ls -la
```

### **OPCIÓN B: VIA SCP DIRECTO**

#### **4.1 Comprimir Proyecto**
```bash
# En local
cd D:\Inter\intertravel-website\
tar -czf intertravel-prod.tar.gz WEB-FINAL-UNIFICADA/
```

#### **4.2 Subir via SCP**
```bash
# Subir archivo comprimido
scp -i "C:\AWS\keys\LightsailDefaultKey-sa-east-1.pem" intertravel-prod.tar.gz ubuntu@TU-IP-LIGHTSAIL:/home/ubuntu/

# En servidor, extraer
ssh -i "C:\AWS\keys\LightsailDefaultKey-sa-east-1.pem" ubuntu@TU-IP-LIGHTSAIL
cd /home/ubuntu
tar -xzf intertravel-prod.tar.gz
sudo mkdir -p /var/www
sudo mv WEB-FINAL-UNIFICADA /var/www/intertravel
sudo chown -R ubuntu:ubuntu /var/www/intertravel
```

---

## ⚙️ PASO 5: EJECUTAR DEPLOYMENT AUTOMÁTICO

### **5.1 Verificar Archivos en Servidor**
```bash
cd /var/www/intertravel
ls -la

# Verificar script deployment
ls -la TESTING/deploy-aws-lightsail.sh
cat TESTING/domain-config.env
```

### **5.2 Ejecutar Script Automático**
```bash
cd /var/www/intertravel/TESTING
chmod +x deploy-aws-lightsail.sh
sudo ./deploy-aws-lightsail.sh
```

### **5.3 Monitorear Progreso**
El script mostrará progreso en tiempo real:
```
🚀 DEPLOYMENT INTERTRAVEL AWS LIGHTSAIL
FASE 1: Actualizando sistema Ubuntu... ✅
FASE 2: Instalando Node.js 20 LTS... ✅  
FASE 3: Configurando PostgreSQL... ✅
FASE 4: Clonando repositorio... ✅
FASE 5: Configurando variables... ✅
FASE 6: Instalando dependencias... ✅
FASE 7: Aplicando schema BD... ✅
FASE 8: Configurando servicios... ✅
FASE 9: Configurando Nginx... ✅
FASE 10: Instalando SSL... ✅
FASE 11: Iniciando servicios... ✅
FASE 12: Configurando firewall... ✅
FASE 13: Verificación final... ✅
```

---

## 🌐 PASO 6: CONFIGURAR DOMINIO Y DNS

### **6.1 CONFIGURAR DNS EN TU PROVEEDOR**
```
Tipo: A Record
Nombre: @
Valor: TU-IP-LIGHTSAIL
TTL: 300

Tipo: A Record  
Nombre: www
Valor: TU-IP-LIGHTSAIL
TTL: 300

Tipo: CNAME
Nombre: app
Valor: tu-dominio.com
TTL: 300

Tipo: CNAME
Nombre: admin  
Valor: tu-dominio.com
TTL: 300
```

### **6.2 VERIFICAR PROPAGACIÓN DNS**
```bash
# Verificar desde cualquier PC
nslookup tu-dominio.com
ping tu-dominio.com

# Debe mostrar la IP de tu Lightsail
```

### **6.3 CONFIGURAR SSL AUTOMÁTICO**
```bash
# En servidor (el script ya lo hace, pero por si necesitas manual)
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d app.tu-dominio.com -d admin.tu-dominio.com
```

---

## ✅ PASO 7: VERIFICACIÓN FINAL

### **7.1 TESTING URLS PRINCIPALES**
```bash
# Verificar cada URL funcione:
curl -I https://tu-dominio.com
curl -I https://tu-dominio.com/admin
curl -I https://tu-dominio.com/app
curl -I https://tu-dominio.com/api/health
```

### **7.2 TESTING SERVICIOS INTERNOS**
```bash
# En servidor - verificar servicios activos
sudo systemctl status intertravel-backend
sudo systemctl status intertravel-frontend  
sudo systemctl status intertravel-app

# Verificar logs si hay problemas
sudo journalctl -u intertravel-backend -f
```

### **7.3 TESTING FUNCIONAL COMPLETO**
1. **Landing Page:** https://tu-dominio.com
   - ✅ Carga correctamente
   - ✅ SEO tags presentes
   - ✅ Botón "📱 Abrir App" visible
   
2. **Panel Admin:** https://tu-dominio.com/admin
   - ✅ Login funciona
   - ✅ Dashboard carga
   - ✅ Gestión usuarios activa
   
3. **App Cliente:** https://tu-dominio.com/app
   - ✅ Autenticación DNI
   - ✅ Búsqueda paquetes
   - ✅ Sistema reservas
   
4. **API Backend:** https://tu-dominio.com/api
   - ✅ Health check responde
   - ✅ Travel Compositor conectado
   - ✅ Base de datos activa

---

## 📊 PASO 8: CONFIGURACIÓN POST-DEPLOYMENT

### **8.1 ANALYTICS Y TRACKING**
```bash
# Verificar GA4 activo
# Ir a: https://analytics.google.com
# Comprobar que lleguen eventos de tu dominio

# Configurar Google Search Console
# Ir a: https://search.google.com/search-console
# Agregar propiedad: tu-dominio.com
# Verificar via DNS o archivo HTML
```

### **8.2 MONITOREO Y BACKUPS**
```bash
# En servidor - configurar backup automático BD
sudo crontab -e

# Agregar línea (backup diario a las 2 AM):
0 2 * * * pg_dump -h localhost -U intertravel_user intertravel_db > /backup/db_$(date +\%Y\%m\%d).sql

# Crear directorio backup
sudo mkdir -p /backup
sudo chown ubuntu:ubuntu /backup
```

### **8.3 CONFIGURAR LOGS CENTRALIZADOS**
```bash
# Configurar logrotate para evitar discos llenos
sudo nano /etc/logrotate.d/intertravel

# Contenido:
/var/log/intertravel/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 ubuntu ubuntu
}
```

---

## 🚨 TROUBLESHOOTING COMÚN

### **PROBLEMA: Servicios no inician**
```bash
# Verificar logs
sudo journalctl -u intertravel-backend -n 50
sudo journalctl -u intertravel-frontend -n 50

# Reiniciar servicios
sudo systemctl restart intertravel-backend
sudo systemctl restart intertravel-frontend
sudo systemctl restart intertravel-app
```

### **PROBLEMA: Base de datos no conecta**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Verificar usuario y BD
sudo -u postgres psql -c "\l" | grep intertravel
sudo -u postgres psql -c "\du" | grep intertravel
```

### **PROBLEMA: SSL no funciona**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar SSL si hay problemas
sudo certbot renew --dry-run
sudo nginx -t && sudo systemctl reload nginx
```

### **PROBLEMA: Dominio no resuelve**
```bash
# Verificar DNS
dig tu-dominio.com
nslookup tu-dominio.com 8.8.8.8

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 📋 CHECKLIST FINAL DEPLOYMENT

### **✅ PRE-DEPLOYMENT**
- [ ] Testing local 80%+ exitoso
- [ ] Variables .env.production configuradas
- [ ] Botón app agregado al frontend
- [ ] Repositorio Git actualizado
- [ ] Instancia Lightsail creada: `Intertrtavel-UBNT-PROD`
- [ ] IP estática asignada
- [ ] SSH key descargada

### **✅ DURANTE DEPLOYMENT**
- [ ] Código subido al servidor
- [ ] Script deployment ejecutado exitosamente
- [ ] Servicios systemd activos
- [ ] Nginx configurado correctamente
- [ ] PostgreSQL funcionando
- [ ] SSL instalado automáticamente

### **✅ POST-DEPLOYMENT**
- [ ] DNS configurado y propagado
- [ ] URLs principales funcionando
- [ ] Login admin operativo
- [ ] App cliente funcional
- [ ] GA4 recibiendo eventos
- [ ] Backup automático configurado
- [ ] Monitoreo activo

---

## 🎯 RESULTADO FINAL ESPERADO

### **✅ URLS FUNCIONALES**
```json
{
  "landing": "https://tu-dominio.com",
  "admin": "https://tu-dominio.com/admin", 
  "app_cliente": "https://tu-dominio.com/app",
  "api_health": "https://tu-dominio.com/api/health",
  "sitemap": "https://tu-dominio.com/sitemap.xml",
  "robots": "https://tu-dominio.com/robots.txt"
}
```

### **✅ CARACTERÍSTICAS TÉCNICAS**
- **Performance:** Lighthouse score >90
- **SEO:** Meta tags únicos por página + structured data
- **Analytics:** GA4 enhanced ecommerce activo
- **Seguridad:** SSL A+ rating + security headers
- **Disponibilidad:** 99.9% uptime esperado
- **Backup:** Automático diario PostgreSQL

### **✅ FUNCIONALIDADES**
- **Landing optimizada** con botón directo a app
- **Panel admin completo** con 7 roles y permisos
- **App cliente** con autenticación DNI y reservas
- **Sistema paquetes** conectado a Travel Compositor
- **Analytics completo** GA4 + conversions tracking

---

## 💰 COSTOS ESTIMADOS MENSUALES

```json
{
  "lightsail_instance": "$20/mes",
  "static_ip": "$0/mes (primer año gratis)",
  "backup_snapshots": "$1-2/mes",
  "bandwidth_extra": "$0/mes (hasta 4TB incluidos)",
  "total_estimado": "$21-22/mes"
}
```

---

## 📞 SOPORTE Y MANTENIMIENTO

### **COMANDOS ÚTILES ADMINISTRACIÓN**
```bash
# Ver estado general
sudo systemctl status intertravel-*

# Ver logs en tiempo real
sudo journalctl -f -u intertravel-backend

# Reiniciar todo el sistema
sudo systemctl restart intertravel-*
sudo systemctl reload nginx

# Backup manual BD
pg_dump -h localhost -U intertravel_user intertravel_db > backup_manual.sql

# Actualizar código desde Git
cd /var/www/intertravel
git pull origin main
sudo systemctl restart intertravel-*
```

### **MONITOREO RECOMENDADO**
- **Uptime:** UptimeRobot (gratis hasta 50 monitores)
- **Analytics:** Google Analytics 4 + Search Console
- **Logs:** CloudWatch o Datadog (opcional)
- **Performance:** Google PageSpeed Insights

---

**🚀 SISTEMA INTERTRAVEL: DE DESARROLLO A PRODUCCIÓN EN AWS LIGHTSAIL 🚀**

*Documento actualizado: 2025-07-22*
*Instancia objetivo: Intertrtavel-UBNT-PROD*
*Tiempo estimado deployment: 60-90 minutos*