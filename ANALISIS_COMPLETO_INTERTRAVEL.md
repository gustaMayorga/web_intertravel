# Análisis Completo del Sistema InterTravel

## 1. Introducción
Este documento detalla la arquitectura, funcionalidades y mapeo de APIs del sistema InterTravel, abarcando el Backend, el Frontend (web principal) y la App Cliente. El objetivo es proporcionar una comprensión exhaustiva para futuras actualizaciones y desarrollos, asegurando la adherencia a las directrices de construir sobre lo existente, reutilizar y evitar modificaciones/eliminaciones sin consenso.

## 2. Estructura General del Proyecto
El proyecto InterTravel se compone de tres módulos principales:
- **`backend/`**: Servidor Node.js (Express) que maneja la lógica de negocio, la base de datos (PostgreSQL) y la integración con Travel Compositor.
- **`frontend/`**: Aplicación web principal (Next.js) que sirve la landing page, la página de paquetes y el panel de administración.
- **`app_cliete/`**: Aplicación cliente (Next.js) diseñada para usuarios finales, con funcionalidades como registro, login, dashboard y gestión de reservas.

## 3. Análisis del Backend (`backend/`)

### 3.1. Tecnologías Clave
- Node.js / Express
- PostgreSQL
- Travel Compositor
- `dotenv`, `cors`, `helmet`, `compression`, `express-rate-limit`
- `bcrypt`, `jsonwebtoken`
- `axios`

### 3.2. Estructura de Archivos Clave
- `server.js`: Punto de entrada principal, configura middlewares y carga rutas.
- `database.js`: Gestión de la conexión y consultas a PostgreSQL.
- `travel-compositor-fast.js`: Lógica de integración con Travel Compositor.
- `package-cache.js`: Módulo para cachear datos de paquetes.
- `detailed-logger.js`: Utilidad de logging.
- `middleware/`: Middlewares personalizados.
- `routes/`: Directorio de definición de rutas de la API.
- `modules/`: Contiene la lógica de negocio principal y la interacción con la base de datos (ej. `users.js`, `bookings.js`).

### 3.3. Mapeo de APIs del Backend (Detallado)

#### 3.3.1. Rutas de Autenticación (General)
- `POST /api/auth/agency-login`
  - **Request Body**: `{ username: string, password: string }`
  - **Response**: `{ success: boolean, user: { username, name, role, agency, permissions }, token: string, expiresAt: string, message: string }`
- `POST /api/admin/login`
  - **Request Body**: `{ username: string, password: string }`
  - **Response**: `{ success: boolean, user: { username, name, role, agency, permissions }, token: string, expiresAt: string, message: string }`
- `GET /api/auth/verify`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, user: { username, name, role, agency, permissions }, valid: boolean, expiresAt: string }`
- `POST /api/auth/logout`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, message: string }`

#### 3.3.2. Rutas de Paquetes (Públicas)
- `GET /api/packages/featured`
  - **Query Params**: `limit?: number` (default: 6)
  - **Response**: `{ success: boolean, packages: Package[], total: number, source: string, composition: { intertravel: number, others: number }, prioritization: object }`
- `GET /api/packages`
  - **Query Params**: `search?: string`, `country?: string`, `category?: string`, `page?: number` (default: 1), `limit?: number` (default: 20)
  - **Response**: `{ success: boolean, packages: Package[], data: Package[], pagination: { page, limit, total, totalPages, hasNext, hasPrev }, source: string, filters: object }`
- `GET /api/packages/search`
  - **Query Params**: `destination?: string`, `search?: string`, `country?: string`, `category?: string`, `startDate?: string`, `endDate?: string`, `adults?: number`, `page?: number` (default: 1), `pageSize?: number` (default: 20), `limit?: number`
  - **Response**: `{ success: boolean, data: Package[], packages: Package[], pagination: object, searchInfo: object, source: string }`
- `GET /api/packages/:id`
  - **URL Params**: `id: string`
  - **Response**: `{ success: boolean, package: Package, source: string, cached: boolean }`

#### 3.3.3. Rutas de Administración (Protegidas - Requieren Autenticación)
- `GET /api/admin/stats`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, stats: object, timestamp: string, user: string, services: object }`
- `GET /api/admin/dashboard/stats`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, stats: object, timestamp: string, user: string, services: object }`
- `GET /api/admin/cache/stats`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, cache: object, timestamp: string }`
- `POST /api/admin/cache/clear`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, message: string, clearedBy: string, timestamp: string }`
- `GET /api/admin/packages`
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `search?: string`, `status?: string`, `page?: number` (default: 1), `limit?: number` (default: 20)
  - **Response**: `{ success: boolean, packages: Package[], pagination: object, filters: object, source: string }`
- **`GET /api/admin/clients`**: Obtiene la lista de usuarios/clientes.
  - **Descripción**: **Actualmente utiliza datos mock. No consulta la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `page?: number`, `limit?: number`, `search?: string`, `status?: string`, `sortBy?: string`, `sortOrder?: string`
  - **Response**: `{ success: boolean, data: Client[], pagination: object }`
- **`POST /api/admin/clients`**: Crea un nuevo cliente manual.
  - **Descripción**: **Actualmente utiliza datos mock. No inserta en la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**: `{ name: string, email: string, phone: string, dni: string, birth_date?: string, address?: string, city?: string, country?: string, notes?: string }`
  - **Response**: `{ success: boolean, message: string, data: Client }`
- **`PUT /api/admin/clients/:id`**: Actualiza un cliente existente.
  - **Descripción**: **Actualmente utiliza datos mock. No actualiza la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Request Body**: `{ firstName?: string, lastName?: string, email?: string, phone?: string, role?: string, isActive?: boolean }`
  - **Response**: `{ success: boolean, message: string, data: Client }`
- **`DELETE /api/admin/clients/:id`**: Elimina un cliente.
  - **Descripción**: **Actualmente utiliza datos mock. No elimina de la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Response**: `{ success: boolean, message: string }`
- **`POST /api/admin/bookings/manual`**: Crea una reserva manual y la asocia a un cliente.
  - **Descripción**: **Actualmente utiliza datos mock. No inserta en la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**: `{ client_id?: string, client_email?: string, package_id: string, package_title: string, destination: string, country: string, travelers_count?: number, travel_date: string, return_date: string, duration_days: number, total_amount: number, currency?: string, special_requests?: string, payment_method?: string, payment_status?: string, client_name?: string, client_phone?: string, client_dni?: string, create_client_if_not_exists?: boolean }`
  - **Response**: `{ success: boolean, message: string, data: { booking: Booking, client: Client, new_client_created: boolean } }`
- **`PATCH /api/admin/bookings/:bookingId/associate-client`**: Asocia una reserva existente a un cliente.
  - **Descripción**: **Actualmente utiliza datos mock. No actualiza la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `bookingId: string`
  - **Request Body**: `{ client_id?: string, app_user_id?: string }`
  - **Response**: `{ success: boolean, message: string, data: Association }`
- **`GET /api/admin/clients/:clientId/bookings`**: Obtiene historial de reservas por cliente.
  - **Descripción**: **Actualmente utiliza datos mock. No consulta la base de datos directamente.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `clientId: string`
  - **Response**: `{ success: boolean, data: Booking[], total: number }`
- **`GET /api/admin/bookings`**: Obtiene la lista de reservas para el admin.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `page?: number`, `limit?: number`, `search?: string`, `status?: string`, `paymentStatus?: string`, `source?: string`, `startDate?: string`, `endDate?: string`, `sortBy?: string`, `sortOrder?: string`
  - **Response**: `{ success: boolean, data: { bookings: Booking[], pagination: object } }`
- **`POST /api/admin/bookings`**: Crea una nueva reserva.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**: `{ package_id: string, package_title: string, package_source?: string, destination: string, country: string, customer_name: string, customer_email: string, customer_phone?: string, travelers_count?: number, travel_date: string, return_date?: string, duration_days?: number, total_amount: number, currency?: string, special_requests?: string, source?: string }`
  - **Response**: `{ success: boolean, booking: Booking, message: string }`
- **`GET /api/admin/bookings/:id`**: Obtiene reserva específica.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Response**: `{ success: boolean, booking: Booking }`
- **`PUT /api/admin/bookings/:id`**: Actualiza reserva completa.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Request Body**: `{ ...Booking }`
  - **Response**: `{ success: boolean, booking: Booking, message: string }`
- **`PATCH /api/admin/bookings/:id/status`**: Actualiza estado de reserva.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Request Body**: `{ status: 'pending' | 'confirmed' | 'cancelled' | 'completed', notes?: string }`
  - **Response**: `{ success: boolean, booking: Booking, message: string }`
- **`PATCH /api/admin/bookings/:id/payment`**: Actualiza estado de pago de reserva.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Request Body**: `{ payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed', paid_amount?: number, payment_method?: string }`
  - **Response**: `{ success: boolean, booking: Booking, message: string }`
- **`DELETE /api/admin/bookings/:id`**: Cancela/Elimina reserva.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `id: string`
  - **Request Body**: `{ reason?: string }`
  - **Response**: `{ success: boolean, message: string, booking: Booking }`
- **`PATCH /api/admin/bookings/bulk/status`**: Actualización masiva de estado.
  - **Descripción**: **Actualmente utiliza datos mock.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**: `{ booking_ids: string[], status: 'pending' | 'confirmed' | 'cancelled' | 'completed', notes?: string }`
  - **Response**: `{ success: boolean, message: string, updated: number, bookings: Booking[] }`
- **`POST /api/admin/bookings/bulk/notify`**: Envío de comunicación masiva.
  - **Descripción**: **Actualmente utiliza datos mock.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**: `{ booking_ids: string[], message_type: 'confirmation' | 'reminder' | 'update' | 'custom', custom_message?: string }`
  - **Response**: `{ success: boolean, message: string, sent: number, notifications: Notification[] }`
- **`GET /api/admin/bookings-stats`**: Estadísticas completas de reservas.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `period?: string`, `groupBy?: string`
  - **Response**: `{ success: boolean, data: Stats }`
- **`GET /api/admin/bookings-analytics`**: Analíticas de ingresos.
  - **Descripción**: **Actualmente utiliza datos mock si BookingsManager no está disponible.**
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `period?: string`
  - **Response**: `{ success: boolean, data: Analytics }`

#### 3.3.4. Rutas de la Aplicación Cliente (`/api/app`)
- `POST /api/app/auth/register`
  - **Request Body**: `{ firstName: string, lastName: string, email: string, phone?: string, password: string }`
  - **Response**: `{ success: boolean, message: string, user: { id, firstName, lastName, fullName, email, role }, token: string }`
- `POST /api/app/auth/login`
  - **Request Body**: `{ email: string, password: string }`
  - **Response**: `{ success: boolean, message: string, user: { id, firstName, lastName, fullName, email, phone, role }, token: string }`
- `GET /api/app/user/profile`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, user: { id, firstName, lastName, fullName, email, phone, role, joinDate } }`
- `PUT /api/app/user/profile`
  - **Headers**: `Authorization: Bearer <token>`
  - **Request Body**: `{ firstName?: string, lastName?: string, phone?: string }`
  - **Response**: `{ success: boolean, message: string, user: { id, firstName, lastName, fullName, email, phone } }`
- `GET /api/app/user/bookings`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, bookings: Booking[], total: number, user: { id, email } }`
- `GET /api/app/user/bookings/:bookingId`
  - **Headers**: `Authorization: Bearer <token>`
  - **URL Params**: `bookingId: string`
  - **Response**: `{ success: boolean, booking: Booking }`
- `GET /api/app/user/stats`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: boolean, stats: UserStats }`
- `GET /api/app/health`
  - **Response**: `{ success: boolean, message: string, timestamp: string, endpoints: object }`

#### 3.3.5. Otras Rutas Misceláneas
- `GET /api/health`
- `GET /api/admin/whatsapp-config`
- `GET /api/reviews`
- `POST /api/frontend-logs`

### 3.4. Lógica de Base de Datos (`database.js`)
- **Conexión**: Utiliza `pg` para conectar a PostgreSQL.
- **`initializeDatabase()`**: Crea la tabla `users` y `priority_keywords` si no existen.
- **`query(sql, params)`**: Método genérico para ejecutar consultas SQL.

### 3.5. Integración con Travel Compositor (`travel-compositor-fast.js`)
- **Autenticación**: `authenticate()` obtiene un `auth-token` de TC.
- **Cache**: Implementa un caché en memoria para paquetes (`packagesCache`).
- **`getAllPackages()`**: Obtiene todos los paquetes de TC, paginando si es necesario.
- **`getPackages()`**: Obtiene un número limitado de paquetes.
- **`getHolidayPackagesPage()`**: Realiza la llamada HTTP a la API de TC para obtener una página de paquetes.
- **`getPackageDetails(packageId)`**: Obtiene detalles de un paquete específico de TC.
- **`normalizePackage(pkg)`**: Transforma la estructura de datos de TC a un formato interno consistente.
- **`extractCountry(pkg)`, `extractDestination(pkg)`, `extractCategory(pkg)`, `calculateDuration(pkg)`**: Funciones para extraer y normalizar datos de paquetes de TC.

## 4. Análisis del Frontend (`frontend/`)

### 4.1. Tecnologías Clave
- Next.js
- React
- Tailwind CSS
- Lucide React
- Capacitor

### 4.2. Estructura de Archivos Clave
- `next.config.js`
- `src/app/`: App Router pages.
- `src/components/`: Reusable UI components.
- `src/lib/api-client.ts`: Cliente API para interactuar con el backend.

### 4.3. Interacción con el Backend
- El `frontend` utiliza `src/lib/api-client.ts` para todas las comunicaciones con el backend.
- **Página de Paquetes (`src/app/paquetes/page.tsx`)**:
  - Llama a `/api/packages` y `/api/packages/featured` para obtener datos de paquetes.
  - Utiliza `PackageDetailsModal` para mostrar detalles, que a su vez llama a `/api/packages/:id`.
- **Panel de Administración (`src/app/admin/`)**:
  - Llama a `/api/admin/stats`, `/api/admin/packages`, `/api/admin/clients`, etc.

## 5. Análisis de la Aplicación Cliente (`app_cliete/`)

### 5.1. Tecnologías Clave
- Next.js
- React
- Tailwind CSS
- Lucide React
- `@ducanh2912/next-pwa`
- Firebase (para notificaciones/analytics, no core auth/DB)

### 5.2. Estructura de Archivos Clave
- `next.config.ts`
- `src/app/`: App Router pages (`(auth)/`, `(main)/`).
- `src/components/`: UI components.
- `src/services/`: Business logic and API communication.
  - `api-client.ts`: App client's API client.
  - `auth-service.ts`: Authentication logic.
  - `bookings-service.ts`: Bookings logic.
- `src/lib/config.ts`: Backend URL configuration.

### 5.3. Interacción con el Backend
- La `app_cliete` utiliza `src/services/api-client.ts` para todas las comunicaciones con el backend.
- **Páginas de Autenticación (`src/app/(auth)/`)**:
  - Utilizan `auth-service.ts` para interactuar con `/api/app/auth/login` y `/api/app/auth/auth/register`.
- **Página de Reservas (`src/app/(main)/reservas/page.tsx`)**:
  - Utiliza `bookings-service.ts` para interactuar con `/api/app/user/bookings` y `/api/app/user/stats`.

## 6. Mapeo Conceptual de la Base de Datos (PostgreSQL)

### 6.1. Tabla `users`
- `id` (PK)
- `username` (VARCHAR, UNIQUE)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `role` (VARCHAR, ej. 'user', 'admin')
- `full_name` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `phone` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 6.2. Tabla `bookings`
- `id` (PK)
- `booking_reference` (VARCHAR, UNIQUE)
- `package_id` (VARCHAR)
- `package_title` (VARCHAR)
- `package_source` (VARCHAR)
- `destination` (VARCHAR)
- `country` (VARCHAR)
- `customer_name` (VARCHAR)
- `customer_email` (VARCHAR)
- `customer_phone` (VARCHAR)
- `travelers_count` (INTEGER)
- `travel_date` (DATE)
- `return_date` (DATE)
- `duration_days` (INTEGER)
- `total_amount` (NUMERIC)
- `paid_amount` (NUMERIC)
- `currency` (VARCHAR)
- `status` (VARCHAR, ej. 'pending', 'confirmed', 'cancelled', 'completed')
- `payment_status` (VARCHAR, ej. 'pending', 'paid', 'partial', 'refunded', 'failed')
- `special_requests` (TEXT)
- `metadata` (JSONB - para servicios, imágenes, etc.)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 6.3. Tabla `priority_keywords`
- `id` (PK)
- `keyword` (VARCHAR, UNIQUE)
- `priority` (INTEGER)
- `category` (VARCHAR)
- `active` (BOOLEAN)

## 7. Interdependencias y Flujos Clave

### 7.1. Flujo de Autenticación de Usuario (App Cliente)
1.  **Registro**: `app_cliete` (AuthService) -> `backend` (`/api/app/auth/register`) -> `backend` (inserta en `users` table).
2.  **Login**: `app_cliete` (AuthService) -> `backend` (`/api/app/auth/login`) -> `backend` (verifica `users` table, genera JWT).
3.  **Sesión**: JWT almacenado en `localStorage` en `app_cliete`. Todas las solicitudes subsiguientes incluyen este token.

### 7.2. Flujo de Gestión de Reservas (App Cliente)
1.  **Obtener Reservas**: `app_cliete` (BookingsService) -> `backend` (`/api/app/user/bookings`) -> `backend` (consulta `bookings` table por `customer_email` del token).
2.  **Detalles de Reserva**: `app_cliete` (BookingsService) -> `backend` (`/api/app/user/bookings/:bookingId`).

### 7.3. Flujo de Paquetes
1.  **Listado de Paquetes**: `frontend` (`paquetes/page.tsx`) -> `backend` (`/api/packages` o `/api/packages/featured`).
2.  **Detalles de Paquete**: `frontend` (`PackageDetailsModal`) -> `backend` (`/api/packages/:id`).
3.  **Fuente de Datos de Paquetes**: `backend` intenta obtener de Travel Compositor (`travel-compositor-fast.js`). Si falla, usa datos mock (`generateMockPackages`).

## 8. Comprensión y Adherencia a Directivas

### 8.1. Comprensión del Software
Basado en el análisis de la estructura de directorios, los archivos `package.json`, los archivos de configuración de Next.js, y el contenido de los archivos clave del backend y los clientes, tengo una comprensión clara de:
- **Arquitectura General:** Cómo los tres módulos principales (backend, frontend, app_cliete) se relacionan y se comunican.
- **Funcionalidad del Backend:** Las responsabilidades del servidor, incluyendo la gestión de APIs, la interacción con la base de datos y la integración con Travel Compositor.
- **Funcionalidad del Frontend (Web Principal):** Cómo se renderizan las páginas, se consumen las APIs del backend y se gestiona la interfaz de usuario.
- **Funcionalidad de la App Cliente:** El flujo de autenticación, la gestión de perfiles y la visualización de reservas, y cómo interactúa con el backend a través de su propio conjunto de APIs.
- **Mapeo de APIs:** He identificado y detallado los endpoints clave, sus métodos y las estructuras de datos esperadas, lo cual es fundamental para cualquier interacción.
- **Base de Datos:** Comprendo el esquema de las tablas principales y cómo se utilizan para almacenar información de usuarios, reservas y palabras clave.

### 8.2. Adherencia a Directivas
- **Construir y Mejorar sobre lo ya realizado:** Mi enfoque será siempre identificar el código existente y proponer mejoras o adiciones que se integren de forma natural, siguiendo los patrones y estilos ya establecidos.
- **Reutilizar en caso sean necesarios cambios:** Cuando sea posible, se priorizará la modificación de componentes o funciones existentes para extender su funcionalidad, en lugar de crear duplicados.
- **NO ELIMINAR Y MODIFICAR CÓDIGO SIN ANTES CONSENSUAR o ASEGURAR que este correcto:** Cada cambio propuesto será justificado y, si es significativo o implica una reestructuración, se buscará consenso antes de la implementación. Para cambios críticos, se realizarán pruebas exhaustivas para asegurar su corrección.

---
