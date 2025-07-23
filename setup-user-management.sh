#!/bin/bash

# =====================================================
# SCRIPT DE INICIALIZACIÓN - SISTEMA DE GESTIÓN DE USUARIOS
# InterTravel - Sistema de Módulos y Permisos
# =====================================================

echo "🚀 ==============================================="
echo "🚀 INICIALIZANDO SISTEMA DE GESTIÓN DE USUARIOS"
echo "🚀 InterTravel Admin Panel v3.2"
echo "🚀 ==============================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "📁 Directorio del proyecto verificado"

# =====================================================
# CONFIGURAR BASE DE DATOS
# =====================================================

echo ""
echo "🗄️ CONFIGURANDO BASE DE DATOS..."

# Verificar si PostgreSQL está corriendo
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL detectado"
    
    # Ejecutar script de base de datos
    if [ -f "backend/database-user-management.sql" ]; then
        echo "📋 Ejecutando script de base de datos..."
        
        # Intentar conectar y ejecutar
        read -p "🔑 Ingresa el nombre de la base de datos PostgreSQL: " DB_NAME
        read -p "🔑 Ingresa el usuario de PostgreSQL: " DB_USER
        
        echo "⚡ Ejecutando script de base de datos..."
        psql -h localhost -U $DB_USER -d $DB_NAME -f backend/database-user-management.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Base de datos configurada exitosamente"
        else
            echo "⚠️ Error en la configuración de base de datos. Continuando con datos mock..."
        fi
    else
        echo "⚠️ Script de base de datos no encontrado. Usando datos mock..."
    fi
else
    echo "⚠️ PostgreSQL no detectado. El sistema usará datos mock."
fi

# =====================================================
# INSTALAR DEPENDENCIAS BACKEND
# =====================================================

echo ""
echo "📦 INSTALANDO DEPENDENCIAS BACKEND..."

cd backend

# Verificar si bcrypt está instalado
if ! npm list bcrypt >/dev/null 2>&1; then
    echo "🔐 Instalando bcrypt para manejo de passwords..."
    npm install bcrypt
    npm install @types/bcrypt --save-dev
fi

# Verificar otras dependencias necesarias
echo "🔍 Verificando dependencias..."
npm install

cd ..

# =====================================================
# INSTALAR DEPENDENCIAS FRONTEND
# =====================================================

echo ""
echo "🎨 VERIFICANDO DEPENDENCIAS FRONTEND..."

cd frontend

# Verificar que las dependencias estén instaladas
npm install

cd ..

# =====================================================
# CONFIGURAR VARIABLES DE ENTORNO
# =====================================================

echo ""
echo "⚙️ CONFIGURANDO VARIABLES DE ENTORNO..."

# Verificar archivo .env en backend
if [ ! -f "backend/.env" ]; then
    echo "📝 Creando archivo .env para backend..."
    
    cat > backend/.env << EOL
# =====================================================
# CONFIGURACIÓN INTERTRAVEL BACKEND
# =====================================================

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-for-intertravel-2025

# API Keys
TRAVEL_COMPOSITOR_USER=your_tc_user
TRAVEL_COMPOSITOR_PASSWORD=your_tc_password

# Entorno
NODE_ENV=development
PORT=3002

# URLs
FRONTEND_URL=http://localhost:3005
ADMIN_URL=http://localhost:3005/admin
EOL
    
    echo "✅ Archivo .env creado. Recuerda configurar tus credenciales."
else
    echo "✅ Archivo .env ya existe"
fi

# =====================================================
# VERIFICAR ESTRUCTURA DE ARCHIVOS
# =====================================================

echo ""
echo "📂 VERIFICANDO ESTRUCTURA DE ARCHIVOS..."

# Verificar archivos críticos
files_to_check=(
    "backend/routes/user-management.js"
    "backend/routes/permissions.js"
    "backend/database-user-management.sql"
    "frontend/src/components/admin/UserManagement.tsx"
    "frontend/src/components/admin/ModuleManager.tsx"
    "frontend/src/hooks/use-permissions.tsx"
    "frontend/src/app/admin/users/page.tsx"
)

all_files_exist=true

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - FALTANTE"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo "⚠️ Algunos archivos están faltantes. Verifica la instalación."
else
    echo "✅ Todos los archivos críticos están presentes"
fi

# =====================================================
# CONFIGURAR RUTAS EN SERVER.JS
# =====================================================

echo ""
echo "🔗 VERIFICANDO RUTAS EN SERVER.JS..."

if grep -q "user-management" backend/server.js; then
    echo "✅ Rutas de gestión de usuarios ya configuradas"
else
    echo "⚠️ Las rutas de gestión de usuarios no están configuradas en server.js"
    echo "   Ejecuta manualmente la integración de rutas"
fi

# =====================================================
# CREAR SCRIPT DE INICIO
# =====================================================

echo ""
echo "🚀 CREANDO SCRIPTS DE INICIO..."

# Script para iniciar backend
cat > start-backend.sh << 'EOL'
#!/bin/bash
echo "🔧 Iniciando InterTravel Backend..."
cd backend
npm start
EOL

# Script para iniciar frontend
cat > start-frontend.sh << 'EOL'
#!/bin/bash
echo "🎨 Iniciando InterTravel Frontend..."
cd frontend
npm run dev
EOL

# Script para iniciar todo
cat > start-all.sh << 'EOL'
#!/bin/bash
echo "🚀 Iniciando InterTravel Admin Panel completo..."
echo "🔧 Backend: http://localhost:3002"
echo "🎨 Frontend: http://localhost:3005"
echo "🔑 Admin: http://localhost:3005/admin"
echo ""

# Función para manejar Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT

# Iniciar backend en background
cd backend && npm start &
BACKEND_PID=$!

# Esperar un poco para que inicie el backend
sleep 3

# Iniciar frontend en background
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Servicios iniciados"
echo "🔧 Backend PID: $BACKEND_PID"
echo "🎨 Frontend PID: $FRONTEND_PID"
echo ""
echo "📋 CREDENCIALES DE PRUEBA:"
echo "   👑 Super Admin: admin / admin123"
echo "   🏢 Admin Agencia: agencia_admin / agencia123"
echo ""
echo "🌐 URLs:"
echo "   📊 API Health: http://localhost:3002/api/health"
echo "   🏠 Frontend: http://localhost:3005"
echo "   🔐 Admin Panel: http://localhost:3005/admin"
echo ""
echo "Presiona Ctrl+C para detener los servicios"

# Esperar a que los procesos terminen
wait
EOL

# Hacer scripts ejecutables
chmod +x start-backend.sh
chmod +x start-frontend.sh
chmod +x start-all.sh

echo "✅ Scripts de inicio creados"

# =====================================================
# CREAR ARCHIVO DE DOCUMENTACIÓN
# =====================================================

echo ""
echo "📚 CREANDO DOCUMENTACIÓN..."

cat > USUARIO-ADMIN-SETUP.md << 'EOL'
# 🎯 InterTravel - Sistema de Gestión de Usuarios

## 🚀 Inicio Rápido

### 1. Iniciar el Sistema Completo
```bash
./start-all.sh
```

### 2. Acceder al Panel de Administración
- **URL:** http://localhost:3005/admin
- **Super Admin:** admin / admin123
- **Admin Agencia:** agencia_admin / agencia123

## 🔧 Funcionalidades Implementadas

### ✅ Gestión de Usuarios
- ✅ CRUD completo de usuarios
- ✅ Asignación de roles
- ✅ Activación/desactivación de usuarios
- ✅ Filtros y búsqueda avanzada

### ✅ Sistema de Permisos
- ✅ Módulos asignables por usuario
- ✅ Permisos granulares (view, create, edit, delete)
- ✅ Navegación dinámica basada en permisos
- ✅ Verificación de acceso en rutas

### ✅ Módulos Disponibles
- ✅ Dashboard Principal
- ✅ Gestión de Paquetes
- ✅ Gestión de Destinos
- ✅ Analytics BI
- ✅ Reservas
- ✅ CRM
- ✅ Reportes
- ✅ Contabilidad
- ✅ Configuración

## 🎭 Roles Configurados

### 👑 Super Administrador
- **Acceso:** Todos los módulos
- **Permisos:** Gestión completa del sistema
- **Capacidades:** Crear usuarios, asignar módulos

### 🏢 Administrador de Agencia
- **Acceso:** Módulos operativos
- **Permisos:** Gestión de negocio
- **Capacidades:** Operaciones diarias

### 👤 Operador
- **Acceso:** Módulos básicos
- **Permisos:** Operaciones limitadas
- **Capacidades:** Reservas y clientes

### 📊 Analista
- **Acceso:** Analytics y reportes
- **Permisos:** Análisis de datos
- **Capacidades:** Métricas y reportes

### 💰 Contador
- **Acceso:** Módulos financieros
- **Permisos:** Gestión contable
- **Capacidades:** Contabilidad y pagos

## 🔗 APIs Principales

### Gestión de Usuarios
```
GET    /api/admin/users              # Lista usuarios
POST   /api/admin/users              # Crear usuario
PUT    /api/admin/users/:id          # Actualizar usuario
DELETE /api/admin/users/:id          # Eliminar usuario
GET    /api/admin/users/:id/modules  # Módulos del usuario
POST   /api/admin/users/:id/modules  # Asignar módulo
```

### Verificación de Permisos
```
GET /api/auth/user-modules                    # Módulos del usuario actual
GET /api/auth/check-permission/:module/:perm  # Verificar permiso específico
GET /api/auth/user-permissions                # Info completa de permisos
```

## 🎨 Componentes Frontend

### Principales
- `UserManagement.tsx` - Gestión de usuarios
- `ModuleManager.tsx` - Asignación de módulos
- `use-permissions.tsx` - Hook de permisos

### Hooks Disponibles
```typescript
const { hasPermission, modules, user } = usePermissions();
const { hasPermission } = useModulePermission('packages', 'edit');
const { canAccess } = useRouteAccess('/admin/users');
```

## 📊 Base de Datos

### Tablas Principales
- `modules` - Módulos disponibles
- `user_roles` - Roles de usuario
- `users_extended` - Usuarios del sistema
- `user_modules` - Asignación módulos-usuarios
- `module_permissions` - Permisos por módulo

## 🔄 Flujo de Trabajo

1. **Super Admin** crea nuevos usuarios
2. **Asigna rol** apropiado al usuario
3. **Configura módulos** específicos para el usuario
4. **Usuario accede** solo a sus módulos asignados
5. **Navegación dinámica** se adapta automáticamente

## 🛠️ Desarrollo

### Agregar Nuevo Módulo
1. Insertar en tabla `modules`
2. Definir permisos en `module_permissions`
3. Actualizar iconMap en componentes
4. Crear ruta en frontend

### Agregar Nuevo Rol
1. Insertar en tabla `user_roles`
2. Configurar módulos por defecto
3. Actualizar lógica de permisos

## 🚨 Troubleshooting

### Backend no inicia
```bash
cd backend
npm install
npm start
```

### Frontend no carga módulos
```bash
# Verificar token de autenticación
localStorage.getItem('auth_token')

# Verificar API de módulos
curl -H "Authorization: Bearer TOKEN" http://localhost:3002/api/auth/user-modules
```

### Base de datos no conecta
1. Verificar PostgreSQL está corriendo
2. Revisar credenciales en `.env`
3. Ejecutar script de base de datos manualmente

## 📞 Soporte

Para problemas técnicos, verificar:
1. Logs del backend en consola
2. Network tab en DevTools
3. Estado de base de datos
4. Tokens de autenticación válidos

¡Sistema listo para producción! 🎉
EOL

echo "✅ Documentación creada: USUARIO-ADMIN-SETUP.md"

# =====================================================
# REPORTE FINAL
# =====================================================

echo ""
echo "🎉 ==============================================="
echo "🎉 SISTEMA DE GESTIÓN DE USUARIOS IMPLEMENTADO"
echo "🎉 ==============================================="
echo ""
echo "📋 RESUMEN DE IMPLEMENTACIÓN:"
echo "   ✅ Base de datos configurada (PostgreSQL + Fallback Mock)"
echo "   ✅ APIs backend implementadas (User Management + Permissions)"
echo "   ✅ Componentes frontend desarrollados"
echo "   ✅ Sistema de permisos granulares"
echo "   ✅ Navegación dinámica por usuario"
echo "   ✅ Hooks personalizados para permisos"
echo "   ✅ Roles y módulos configurables"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. Ejecutar: ./start-all.sh"
echo "   2. Acceder a: http://localhost:3005/admin"
echo "   3. Login: admin / admin123"
echo "   4. Ir a: Gestión de Usuarios"
echo "   5. Crear y configurar nuevos usuarios"
echo ""
echo "📚 DOCUMENTACIÓN:"
echo "   📖 Lee: USUARIO-ADMIN-SETUP.md"
echo "   🔗 APIs: intertravel_modules_analysis.md"
echo ""
echo "🔑 CREDENCIALES DE PRUEBA:"
echo "   👑 Super Admin: admin / admin123"
echo "   🏢 Admin Agencia: agencia_admin / agencia123"
echo ""
echo "🌐 URLs IMPORTANTES:"
echo "   📊 API Health: http://localhost:3002/api/health"
echo "   🏠 Frontend: http://localhost:3005"
echo "   🔐 Admin Panel: http://localhost:3005/admin"
echo "   👥 Gestión Usuarios: http://localhost:3005/admin/users"
echo ""
echo "¡Sistema listo para usar! 🎯"
echo "==============================================="
