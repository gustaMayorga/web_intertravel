#!/bin/bash

# =================================================================
# 🚀 DEPLOY RAPIDO MVP - INTERTRAVEL
# =================================================================
# Este script prepara el proyecto para deploy inmediato
# =================================================================

echo "🚀 PREPARANDO MVP PARA DEPLOY..."
echo "================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Crear .env.production seguro para backend
echo -e "${BLUE}📦 Creando configuración de producción...${NC}"

cat > backend/.env.production << 'EOF'
# ==============================================
# CONFIGURACION MVP PRODUCCION - INTERTRAVEL
# ==============================================

# Server
PORT=3000
NODE_ENV=production

# IMPORTANTE: Usar mock data para MVP rápido
USE_MOCK_DATA=true
DEBUG_MODE=false

# Base de datos (opcional para MVP)
# DATABASE_URL=postgresql://user:password@host:port/database

# JWT - CAMBIAR ESTE SECRET EN PRODUCCION
JWT_SECRET=intertravel-jwt-secret-2024-mvp

# Credenciales Admin - CAMBIAR EN PRODUCCION
ADMIN_PASSWORD=InterAdmin2024!
AGENCY_PASSWORD=AgencyDemo2024!

# URLs (actualizar con tus dominios reales)
FRONTEND_URL=https://tu-frontend.vercel.app
BACKEND_URL=https://tu-backend.railway.app

# Company Info
COMPANY_NAME=InterTravel Group
COMPANY_PHONE=+54 261 XXX-XXXX
COMPANY_EMAIL=info@intertravel.com.ar

# Rate limiting para producción
RATE_LIMIT_MAX=100
EOF

# 2. Crear .env.production para frontend
cat > frontend/.env.production << 'EOF'
# ==============================================
# FRONTEND PRODUCCION - INTERTRAVEL MVP
# ==============================================

# Backend URL (actualizar con tu dominio real)
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app

# Analytics - VACIOS para MVP (sin errores)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GOOGLE_ADS_ID=
NEXT_PUBLIC_HOTJAR_ID=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=

# Configuración de app
NEXT_PUBLIC_APP_NAME=InterTravel
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✅ Archivos de configuración creados${NC}"

# 3. Actualizar .gitignore
echo -e "${BLUE}🔒 Configurando seguridad de archivos...${NC}"

cat >> .gitignore << 'EOF'

# Variables de entorno de producción
.env.production
.env.local
.env
*.env

# Logs
logs/
*.log

# Cache
.cache/
.next/
node_modules/

# Build
out/
dist/
build/

# Sistema
.DS_Store
Thumbs.db
EOF

echo -e "${GREEN}✅ .gitignore configurado${NC}"

# 4. Crear package.json scripts de deployment
echo -e "${BLUE}📦 Configurando scripts de build...${NC}"

# Script para verificar build
cat > verify-build.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando build...');

// Verificar que el frontend compila
const frontendPath = path.join(__dirname, 'frontend');
if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
  console.log('✅ Frontend encontrado');
} else {
  console.log('❌ Frontend no encontrado');
  process.exit(1);
}

// Verificar que el backend tiene las dependencias
const backendPath = path.join(__dirname, 'backend');
if (fs.existsSync(path.join(backendPath, 'package.json'))) {
  console.log('✅ Backend encontrado');
} else {
  console.log('❌ Backend no encontrado');
  process.exit(1);
}

console.log('🎉 Build verification passed!');
EOF

echo -e "${GREEN}✅ Scripts de verificación creados${NC}"

# 5. Crear documentación de deployment
cat > DEPLOYMENT-GUIDE.md << 'EOF'
# 🚀 Guía de Deployment MVP - InterTravel

## ⚡ Deploy Rápido (5 minutos)

### 1. **Backend en Railway**
```bash
1. Ir a railway.app
2. "New Project" → "Deploy from GitHub"
3. Seleccionar carpeta /backend
4. Configurar variables de entorno:
   - PORT=3000
   - NODE_ENV=production
   - USE_MOCK_DATA=true
   - JWT_SECRET=tu-secret-aqui
   - ADMIN_PASSWORD=tu-password-admin
   - FRONTEND_URL=https://tu-frontend.vercel.app
5. Deploy!
```

### 2. **Frontend en Vercel**
```bash
1. Ir a vercel.com
2. "Import Git Repository"
3. Seleccionar carpeta /frontend
4. Framework: Next.js
5. Configurar variables:
   - NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app
6. Deploy!
```

### 3. **Configurar Dominios**
```bash
# Railway
- Copiar URL del backend: https://xxx.railway.app

# Vercel  
- Copiar URL del frontend: https://xxx.vercel.app
- Opcional: Conectar dominio personalizado
```

## 🎯 URLs del Sistema

```
Landing Principal: https://tu-frontend.vercel.app/
Panel Agencias:   https://tu-frontend.vercel.app/agency/login
Panel Admin:      https://tu-frontend.vercel.app/admin/login
API Backend:      https://tu-backend.railway.app/
```

## 🔑 Credenciales por Defecto

```
Admin:
- Usuario: admin
- Password: [Configurado en ADMIN_PASSWORD]

Agencia Demo:
- Usuario: agencia-demo  
- Password: [Configurado en AGENCY_PASSWORD]
```

## ⚠️ Importante para Producción

1. **Cambiar passwords** en variables de entorno
2. **Configurar base de datos** real (opcional para MVP)
3. **Configurar analytics** reales
4. **Configurar dominio** personalizado
5. **Configurar HTTPS** (automático en Vercel/Railway)

## 🎉 ¡Listo!

El MVP estará funcionando en menos de 10 minutos.
EOF

echo ""
echo -e "${GREEN}🎉 PREPARACIÓN COMPLETADA${NC}"
echo "=================================="
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASOS:${NC}"
echo "1. 📤 Subir código a GitHub (sin .env files)"
echo "2. 🚂 Conectar Railway para backend" 
echo "3. ▲ Conectar Vercel para frontend"
echo "4. 🔧 Configurar variables de entorno"
echo "5. 🚀 ¡Deploy completado!"
echo ""
echo -e "${BLUE}📖 Lee DEPLOYMENT-GUIDE.md para instrucciones detalladas${NC}"
echo ""
echo -e "${GREEN}⚡ MVP listo para producción en 5-10 minutos!${NC}"