# PROBLEMAS Y SOLUCIONES - SISTEMA INTERTRAVEL

## ANALISIS COMPLETO DEL SISTEMA

### ARQUITECTURA ACTUAL

**FRONTEND WEB (Puerto 3005) - Sin usuarios por ahora**
- Sistema web publico sin autenticacion
- No tiene login implementado actualmente
- Conecta al backend via API

**ADMIN PANEL (Puerto 3005/admin) - Usuarios internos empresa**
- Login: `admin` / `admin123` (hardcodeado)
- Gestión interna de reservas, agencias, clientes
- Diferentes tipos de usuarios admin
- Conecta a PostgreSQL via backend

**APP CLIENTE (Puerto 3009) - Auto-gestion usuarios**
- Login con email/password
- Registro de usuarios
- Dashboard personal
- Vinculacion por DNI con reservas
- Conecta a PostgreSQL via backend

**BACKEND API (Puerto 3002)**
- Sistema unificado con endpoints:
  - `/api/admin/*` - Panel administrativo
  - `/api/app/*` - App cliente  
  - `/api/agencies/*` - Portal agencias
- PostgreSQL 17 como base datos principal
- JWT para autenticacion

### PROBLEMAS IDENTIFICADOS

#### 1. SISTEMA ADMIN HARDCODEADO
**Problema:**
- Login admin usa credenciales fijas: `admin` / `admin123`
- No conecta a base datos PostgreSQL para usuarios
- No hay gestion de usuarios admin reales

**Solucion:**
- Crear tabla `admin_users` separada de `users`
- Modificar `/api/admin/auth/login` para consultar PostgreSQL
- Crear usuario admin real: `gustavo.mayorga@intertravel.com.ar`

#### 2. CONFUSION ENTRE TIPOS DE USUARIOS
**Problema:**
- Tabla `users` mezcla usuarios admin y usuarios cliente
- App cliente y admin panel usan misma tabla
- No hay separacion clara de roles

**Solucion:**
- Crear tablas separadas:
  - `admin_users` - Usuarios internos empresa
  - `client_users` - Usuarios app cliente (3009)
- Modificar rutas para usar tablas correctas

#### 3. VINCULACION DNI COMPLEJA
**Problema:**
- Sistema DNI esta implementado pero no es claro
- Usuarios app cliente se vinculan a `customers` por DNI
- Reservas en tabla `bookings` se relacionan por DNI
- No hay interfaz clara para administrar vinculaciones

**Solucion:**
- Simplificar flujo DNI
- Admin crea reservas que se vinculan automaticamente
- App cliente ve sus reservas por DNI
- Dashboard admin muestra vinculaciones

#### 4. BASE DATOS NO INICIALIZADA CORRECTAMENTE
**Problema:**
- PostgreSQL configurado pero tablas vacias
- Usuario admin no existe en base datos
- Sistema funciona con fallbacks/mocks

**Solucion:**
- Ejecutar migraciones completas
- Crear datos iniciales
- Eliminar todos los fallbacks

#### 5. FRONTEND WEB SIN LOGIN
**Problema:**
- Puerto 3005 es web publico sin autenticacion
- Confunde con admin panel que esta en 3005/admin

**Solucion:**
- Clarificar que 3005 es web publico
- Admin panel esta en 3005/admin/login
- O separar completamente admin en otro puerto

### PLAN DE SOLUCION

#### PASO 1: SEPARAR USUARIOS ADMIN Y CLIENTE
```sql
-- Crear tabla admin_users separada
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear usuario admin real
INSERT INTO admin_users (username, email, password_hash, role, permissions)
VALUES ('gustavo.mayorga@intertravel.com.ar', 'gustavo.mayorga@intertravel.com.ar', 
        '$2b$10$...', 'super_admin', '["all"]');
```

#### PASO 2: MODIFICAR RUTAS ADMIN
- Cambiar `/backend/routes/admin/auth.js` para usar `admin_users`
- Eliminar credenciales hardcodeadas
- Implementar JWT real para admin

#### PASO 3: CLARIFICAR APP CLIENTE
- Tabla `users` solo para usuarios app cliente (3009)
- Vinculacion DNI con tabla `customers`
- Dashboard muestra reservas por DNI

#### PASO 4: INICIALIZAR BASE DATOS COMPLETA
- Ejecutar todas las migraciones
- Crear datos de prueba
- Eliminar todos los mocks y fallbacks

#### PASO 5: TESTING INTEGRAL
- Admin login con usuario real PostgreSQL
- App cliente registro y login funcionando
- Vinculacion DNI operativa
- Reservas visibles en ambos lados

### ACCIONES INMEDIATAS REQUERIDAS

1. **Crear usuario admin en PostgreSQL**
2. **Modificar rutas admin para usar base datos real**
3. **Verificar tablas necesarias esten creadas**
4. **Eliminar credenciales hardcodeadas**
5. **Testing completo de flujos de usuario**

### ESTADO ACTUAL
- PostgreSQL 17: ✅ Funcionando
- Base datos configurada: ✅ Si
- Tablas creadas: ⚠️ Verificar
- Usuario admin: ❌ No existe
- App cliente: ⚠️ Funciona con demos
- Vinculacion DNI: ⚠️ Implementada pero no probada

### NEXT STEPS
1. Ejecutar SQL para crear usuario admin real
2. Modificar backend admin auth
3. Testing login admin con PostgreSQL
4. Testing app cliente sin demos
5. Verificar vinculacion DNI completa
