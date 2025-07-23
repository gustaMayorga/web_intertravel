# GEMINI_SELF_MEMORY.md - Memoria de Contexto del Proyecto InterTravel

## Última Actualización: 4 de julio de 2025

### 1. Visión General del Proyecto
El sistema InterTravel se compone de tres módulos principales:
- **`backend/`**: Servidor Node.js (Express) con PostgreSQL y integración con Travel Compositor.
- **`frontend/`**: Aplicación web principal (Next.js) para landing, paquetes y panel de administración.
- **`app_cliete/`**: Aplicación cliente (Next.js) para usuarios finales (registro, login, dashboard, reservas).

### 2. Directivas Clave del Usuario
- **Prioridad:** Construir y mejorar sobre lo ya realizado.
- **Reutilización:** Reutilizar código existente cuando sea posible.
- **No Eliminación/Modificación sin Consenso:** No eliminar ni modificar código sin consenso o sin asegurar su corrección mediante pruebas.
- **Seguridad:** Prioridad alta en seguridad.
- **Despliegue:** AWS Lightsail con Ubuntu.
- **`app_cliete` y Firebase:** La `app_cliete` está basada y configurada para Firebase; esto es un punto crítico a revisar en una fase posterior (Fase 3).

### 3. Estado Actual del Análisis y Comprensión

#### 3.1. Backend (`backend/`)
- **Tecnologías:** Node.js/Express, PostgreSQL, Travel Compositor, `bcrypt`, `jsonwebtoken`, `axios`.
- **Estructura:** `server.js` (punto de entrada), `database.js` (PG), `travel-compositor-fast.js` (TC), `modules/` (`users.js`, `bookings.js`), `routes/` (APIs).
- **Mapeo de APIs (Confirmado):**
    - **Autenticación General:** `/api/auth/agency-login`, `/api/admin/login`, `/api/auth/verify`, `/api/auth/logout`.
    - **Paquetes Públicos:** `/api/packages/featured`, `/api/packages`, `/api/packages/search`, `/api/packages/:id`.
    - **Administración (Protegidas):** `/api/admin/stats`, `/api/admin/dashboard/stats`, `/api/admin/cache/stats`, `/api/admin/cache/clear`, `/api/admin/packages`.
    - **Administración (Clientes/Reservas - **¡Actualmente con datos MOCK!**):**
        - `/api/admin/clients` (GET, POST, PUT, DELETE)
        - `/api/admin/bookings/manual` (POST)
        - `/api/admin/bookings/:bookingId/associate-client` (PATCH)
        - `/api/admin/clients/:clientId/bookings` (GET)
        - `/api/admin/bookings` (GET, POST, PUT, PATCH, DELETE)
        - `/api/admin/bookings/:id` (GET, PUT, PATCH, DELETE)
        - `/api/admin/bookings/:id/status` (PATCH)
        - `/api/admin/bookings/:id/payment` (PATCH)
        - `/api/admin/bookings/bulk/status` (PATCH)
        - `/api/admin/bookings/bulk/notify` (POST)
        - `/api/admin/bookings-stats` (GET)
        - `/api/admin/bookings-analytics` (GET)
    - **App Cliente (`/api/app`):**
        - `/api/app/auth/register` (POST)
        - `/api/app/auth/login` (POST)
        - `/api/app/user/profile` (GET, PUT)
        - `/api/app/user/bookings` (GET, GET by ID)
        - `/api/app/user/stats` (GET)
        - `/api/app/health` (GET)
    - **Misceláneas:** `/api/health`, `/api/admin/whatsapp-config`, `/api/reviews`, `/api/frontend-logs`.
- **Lógica de BD (`database.js`):** Conexión PG, `initializeDatabase()` (crea tablas `users`, `bookings`, `priority_keywords`, `agencies`, etc.), `query()` (genérico).
- **Managers (`modules/`):**
    - `users.js` (`UsersManager`): **Confirma interacción real con tabla `users` en PG.** (Auth, CRUD, Roles, Logs, Stats).
    - `bookings.js` (`BookingsManager`): **Confirma interacción real con tabla `bookings` en PG.** (CRUD, Stats, Analytics).
- **Travel Compositor (`travel-compositor-fast.js`):** Autenticación, caché, obtención de paquetes y detalles.

#### 3.2. Frontend (`frontend/`)
- **Tecnologías:** Next.js, React, Tailwind CSS, Lucide React, Capacitor.
- **Interacción API:** Usa `src/lib/api-client.ts` para todas las llamadas al backend.
- **Páginas Clave:** `paquetes/page.tsx` (usa `/api/packages`), `admin/` (usa `/api/admin/*`).

#### 3.3. App Cliente (`app_cliete/`)
- **Tecnologías:** Next.js, React, Tailwind CSS, Lucide React, `@ducanh2912/next-pwa`, Firebase.
- **Interacción API:** Usa `src/services/api-client.ts` para todas las llamadas al backend.
- **Servicios Clave:** `auth-service.ts` (autenticación), `bookings-service.ts` (reservas).
- **Configuración:** `src/lib/config.ts` define `backendConfig.baseURL`.

### 4. Problemas Identificados y Estado de la Depuración

1.  **Error `Export bookingsService doesn't exist` (Resuelto):** Causado por importación incorrecta en `app_cliete/src/app/(main)/reservas/page.tsx`. Se corrigió usando `useBookingsService()`.
2.  **Error `GET /favicon.ico 500` (Resuelto):** Causado por la falta de `favicon.ico` en `app_cliete/public`. Se copió el archivo del `frontend`.
3.  **Errores de Precio en Modal (`$999`):** Corregido en `PackageDetailsModal.jsx` para mostrar "DLS" y el valor real.
4.  **Problema de Carga de Detalles de Paquetes (TC):** Corregido en `travel-compositor-fast.js` para manejar diferentes tipos de paquetes de TC.
5.  **Problema de Enrutamiento de Registro/Login (`Cannot POST /api/app/auth/register` / `Endpoint no encontrado`):**
    - **Síntomas:** Solicitudes de `app_cliete` al backend (`/api/app/auth/register`) resultan en 404 o "Cannot POST /" en el backend.
    - **Diagnóstico:** Se sospecha de un problema en el orden de los middlewares en `backend/server.js` o cómo Express.js interpreta la URL. El log `[DEBUG] Incoming Request Path: /` es clave.
    - **Acciones Tomadas:**
        - Se movió `app.use('/api/app', appClientRoutes)` a una posición más temprana en `server.js`.
        - Se añadió/modificó middleware de depuración en `server.js` para rastrear `req.path`, `req.originalUrl`, `req.baseUrl`.
        - Se eliminó el archivo `backend/routes/app-client-auth.js` redundante.
    - **Estado Actual:** El problema persiste. La depuración indica que la solicitud llega al backend como `/` en lugar de `/api/app/auth/register`.

### 5. Plan de Acción Consensuado

**Fase 1: Resolver el Problema de Enrutamiento de Registro/Login (Prioridad Alta)**
- **Objetivo:** Asegurar que las solicitudes de `app_cliete` (`/api/app/*`) sean correctamente enrutadas en el backend.
- **Acción Inmediata:** Realizar una depuración más profunda del enrutamiento en `backend/server.js`.
    - **Método:** Añadir un middleware de depuración muy temprano en `server.js` para imprimir `req.url`, `req.baseUrl`, `req.path` y `req.originalUrl` para cada solicitud.
    - **Estado:** Ya se implementó el middleware de depuración. **Esperando los logs del usuario para continuar el diagnóstico.**

**Fase 2: Conectar Rutas de Administración a la Base de Datos (Después de Fase 1)**
- **Objetivo:** Modificar `backend/routes/admin-clients.js` y `backend/routes/admin-bookings.js` para que utilicen `UsersManager` y `BookingsManager` (interacción real con PG) en lugar de datos mock.

**Fase 3: Refinar la `app_cliete` (Después de Fases 1 y 2)**
- **Objetivo:** Mejorar la gestión de imágenes en `app_cliete/src/services/bookings-service.ts` (eliminar referencias a `.jfif`).
- **Revisión Firebase:** Analizar la integración de Firebase en `app_cliete` para asegurar su correcta configuración y uso.

---
