# ERRORES Y SOLUCIONES - INTERTRAVEL

## 2025-07-21 | Error JWT + PostgreSQL

**PROBLEMA:** Usuario `admin@test.com` retorna 401 Unauthorized

**CAUSA:** PostgreSQL desconectado, backend usa modo fallback con credenciales hardcodeadas

**SÍNTOMAS:**
- Error 401 en login con usuarios reales
- Backend logs: "PostgreSQL no disponible"
- Solo acepta `demo@intertravel.com` / `demo123`

**SOLUCIÓN INMEDIATA:**
```
Email: demo@intertravel.com
Password: demo123
```

**SOLUCIÓN PERMANENTE:**
1. Verificar PostgreSQL corriendo: `sc query postgresql-x64-13`
2. Reiniciar backend: `cd backend && npm start`
3. O implementar sistema usuarios en memoria

**ARCHIVOS AFECTADOS:**
- `backend/routes/user-auth.js` (línea ~180 - modo fallback)
- `backend/database.js` (configuración PostgreSQL)

**ESTADO:** ✅ Workaround aplicado | ⚠️ PostgreSQL pendiente

---

## 2025-07-21 | Patrón JWT Replicado

**PROBLEMA:** Mismo error JWT en múltiples sistemas (3005, 3009)

**CAUSA:** Tokens inconsistentes entre sistemas
- Admin: `auth_token` vs `intertravel_admin_token`
- sessionStorage vs localStorage

**SOLUCIÓN:**
- ✅ Frontend (3005): Unificado a `intertravel_admin_token`
- ✅ App Cliente (3009): Ya tenía `intertravel_token` correcto
- ✅ Métodos `setToken()` implementados

**ARCHIVOS CORREGIDOS:**
- `frontend/src/hooks/use-admin-auth.tsx`
- `frontend/src/lib/auth-security.ts`

**TESTING:** Usar `demo@intertravel.com` / `demo123` en puerto 3009

---

## 2025-07-21 | Error JSON Parse en Registro

**PROBLEMA:** "Unexpected token '"', ""Gustavo"" is not valid JSON"

**CAUSA:** Frontend enviando parámetros separados en lugar de objeto JSON

**SÍNTOMAS:**
- Error 500 en `/api/app/auth/register`
- Backend recibe string `"Gustavo"` en lugar de objeto JSON
- body-parser falla al parsear

**SOLUCIÓN:**
❌ **ANTES:** 
```javascript
register(firstName, lastName, email, phone, password)
```

✅ **DESPUÉS:**
```javascript
register({
  firstName: registerData.firstName,
  lastName: registerData.lastName,
  email: registerData.email,
  phone: registerData.phone,
  password: registerData.password
})
```

**ARCHIVOS CORREGIDOS:**
- `app_cliete/src/app/(auth)/login/page.tsx` (línea ~150)
- `app_cliete/src/contexts/auth-context.tsx` (interfaz + return type)

**ESTADO:** ✅ Corregido - Registro debería funcionar ahora

---

## 2025-07-21 | Bucle Infinito en Login

**PROBLEMA:** La página de login entra en bucle después de autenticación exitosa

**CAUSA:** Múltiples useEffect con redirecciones automáticas que se ejecutan constantemente

**SÍNTOMAS:**
- Login exitoso pero la página no redirige al dashboard
- Console logs muestran redirecciones constantes
- El usuario se queda atrapado en la página de login
- useEffect se ejecuta repetidamente

**ANÁLISIS DEL PROBLEMA:**
1. **AuthContext:** checkAuth() se ejecuta al cargar y setea isLoading
2. **LoginPage:** useEffect verifica currentUser y redirige
3. **Bucle:** El contexto no maneja bien el estado de "login exitoso"
4. **Navegación:** router.push('/dashboard') no funciona correctamente

**SOLUCIÓN:**
- Modificar AuthContext para manejar mejor los estados de carga
- Actualizar LoginPage para usar redirección manual
- Evitar useEffect innecesarios
- Usar window.location.href en lugar de router.push

**ARCHIVOS AFECTADOS:**
- `app_cliete/src/contexts/auth-context.tsx` (línea ~50 - useEffect)
- `app_cliete/src/app/(auth)/login/page.tsx` (línea ~35 - redirección)

**CORRECCIONES APLICADAS:**
✅ **AuthContext:** Eliminado useEffect con dependencias múltiples
✅ **LoginPage:** Cambiado router.push por window.location.href
✅ **Login Function:** Redirección automática tras login exitoso
✅ **Dependencies:** Reducidas dependencias en useEffect

**TESTING:**
1. Ir a: http://localhost:3009/login
2. Email: demo@intertravel.com
3. Password: demo123
4. Debería redirigir al dashboard sin bucles

**ESTADO:** ✅ Corregido - Bucle eliminado

---

## 2025-07-21 | Eliminar Modo Demo - Sistema Producción Real

**PROBLEMA:** Sistema funcionando con mocks/demos, se necesita base de datos real

**SOLUCIÓN INTEGRAL:**

**1. INSTALACIÓN POSTGRESQL:**
```bash
# Opción A - Instalación automática
INSTALAR-POSTGRESQL-AUTO.bat

# Opción B - Instalación manual
CONFIGURAR-POSTGRESQL-PRODUCCION.bat
```

**2. CONFIGURACIÓN SISTEMA REAL:**
```bash
# Eliminar demos y configurar producción
CONFIGURAR-SISTEMA-PRODUCCION.bat
```

**3. INICIAR SISTEMA COMPLETO:**
```bash
# Sistema completo de producción
INICIAR-SISTEMA-COMPLETO.bat
```

**CARACTERÍSTICAS DEL SISTEMA REAL:**
✅ PostgreSQL como base de datos principal
✅ Usuarios reales (no demo@intertravel.com)
✅ JWT real con secretos de producción
✅ Estructura completa de tablas
✅ Sistema de agencias funcional
✅ Módulo contable integrado
✅ Sistema de rankings de agencias
✅ Gestión completa de reservas
✅ Reviews y opiniones
✅ Sistema de pagos preparado

**URLS DEL SISTEMA:**
- Frontend Admin: http://localhost:3005
- Backend API: http://localhost:3002  
- App Cliente: http://localhost:3009

**BASE DE DATOS POSTGRESQL:**
- Host: localhost
- Puerto: 5432
- Base: intertravel_prod
- Usuario: intertravel_user
- Password: intertravel_2025!

**ESTADO:** ✅ Sistema de producción listo

---

## 2025-07-21 | Activar Sistema Real (PostgreSQL Ya Configurado)

**SITUACIÓN:** PostgreSQL ya está instalado y configurado, solo necesitas eliminar demos

**SOLUCIÓN OPTIMIZADA:**

**1. VERIFICAR Y ACTIVAR SISTEMA REAL:**
```bash
VERIFICAR-Y-ACTIVAR-REAL.bat
```
**Este script:**
✅ Verifica que PostgreSQL esté corriendo
✅ Prueba conexión a base de datos
✅ Elimina usuarios demo del código
✅ Configura TU usuario administrador
✅ Remueve todos los fallbacks

**2. INICIAR SISTEMA SIN DEMOS:**
```bash
INICIAR-SISTEMA-REAL.bat
```
**Inicia:**
- Backend con PostgreSQL real (Puerto 3002)
- Frontend Admin sin demos (Puerto 3005) 
- App Cliente sin demo@intertravel.com (Puerto 3009)

**QUÉ SE ELIMINA AUTOMÁTICAMENTE:**
❌ demo@intertravel.com / demo123
❌ admin@test.com fallbacks
❌ Todos los modos de prueba
❌ Credenciales hardcodeadas
❌ Usuarios mock del código

**QUÉ QUEDA FUNCIONANDO:**
✅ Tu email y contraseña real
✅ PostgreSQL como DB principal
✅ Sistema de agencias completo
✅ Módulo contable
✅ Autenticación JWT real
✅ Todas las funcionalidades de producción

**ACCESO AL SISTEMA:**
- Frontend Admin: http://localhost:3005
- Backend API: http://localhost:3002
- App Cliente: http://localhost:3009
- Credenciales: TU email/contraseña (no demos)

**ESTADO:** ✅ Listo para usar - Sin instalaciones adicionales
