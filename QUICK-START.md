# ⚡ GUÍA DE INICIO RÁPIDO INTERTRAVEL

## 🚀 PASOS PARA INICIAR

### 1. Configurar Base de Datos
```bash
# Crear base de datos
createdb intertravel_dev

# Ejecutar script de inicialización
psql intertravel_dev < database-init.sql
```

### 2. Configurar Variables de Entorno
```bash
# Crear .env en la raíz del proyecto
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel_dev
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3002
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
```

### 3. Iniciar Servicios
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 4. Verificar Funcionamiento
```bash
# Test de conectividad
node test-connectivity.js

# Health check
node health-check.js
```

## 🎯 URLs de Acceso

- **Frontend:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Backend API:** http://localhost:3002

## 🆘 Solución de Problemas

### Backend no inicia
```bash
cd backend
rm -rf node_modules
npm install
npm start
```

### Error de base de datos
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql
```

## 🎉 ¡Sistema Funcional!

El sistema InterTravel ahora incluye:
- ✅ Gestión de usuarios y agencias
- ✅ Sistema de pagos
- ✅ Business Intelligence
- ✅ APIs completas
- ✅ Validaciones robustas

¡Listo para usar! 🚀
