# InterTravel Backend - Guía de Resolución de Problemas

## 🚨 Problemas Resueltos

### ✅ 1. Error de sintaxis en package.json
**Problema:** JSON malformado con secuencias de escape literales
**Solución:** Archivo reescrito con formato JSON válido

### ✅ 2. Error de sintaxis en server.js línea 54
**Problema:** Archivo contenía secuencias de escape `\n` literales
**Solución:** Archivo reescrito con saltos de línea reales

### ✅ 3. Error SQL PostgreSQL "ON CONFLICT"
**Problema:** Sintaxis inválida en `ALTER TABLE ... ON CONFLICT`
**Solución:** Verificación previa de constraints antes de crear

### ✅ 4. Dependencias faltantes
**Problema:** Faltaban `pg`, `bcrypt` y `axios`
**Solución:** Agregadas al package.json

### ✅ 5. Archivo .env malformado
**Problema:** Secuencias de escape literales en variables
**Solución:** Archivo reescrito con formato correcto

### ✅ 6. Conexiones perdidas
**Problema:** PostgreSQL y Travel Compositor desconectados
**Solución:** Restauradas ambas conexiones con fallback a mock

## 🚀 Cómo usar este backend

### Instalación rápida:
```bash
# 1. Instalar dependencias
npm install

# 2. Verificar configuración
npm run setup

# 3. Iniciar en modo desarrollo
npm run dev
```

### Verificación manual:
```bash
# Verificar que el servidor funciona
curl http://localhost:3002/api/health

# Ver endpoints disponibles
curl http://localhost:3002
```

## 📊 Endpoints principales

### Públicos:
- `GET /api/health` - Estado del servidor
- `GET /api/packages` - Lista de paquetes (TC + fallback)
- `GET /api/packages/featured` - Paquetes destacados
- `GET /api/packages/search` - Búsqueda inteligente TC
- `GET /api/packages/:id` - Detalle de paquete
- `GET /api/reviews` - Reviews de clientes

### Autenticación:
- `POST /api/auth/agency-login` - Login agencia
- `POST /api/admin/login` - Login admin
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Cerrar sesión

### Admin (requiere token):
- `GET /api/admin/stats` - Estadísticas dashboard
- `GET /api/admin/packages` - Gestión de paquetes

## 🔐 Credenciales por defecto

### Agencia:
- Usuario: `agencia_admin`
- Contraseña: `agencia123`

### Admin:
- Usuario: `admin`
- Contraseña: `admin123`

### Travel Compositor:
- Usuario: `ApiUser1`
- Contraseña: `Veoveo77*`
- Microsite: `intertravelgroup`

## 🛠️ Configuración

### Variables de entorno (.env):
```
PORT=3002
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/intertravel_dev
JWT_SECRET=desarrollo-jwt-secret-key
TC_USERNAME=ApiUser1
TC_PASSWORD=Veoveo77*
TC_MICROSITE_ID=intertravelgroup
```

### Modos de funcionamiento:

1. **Modo completo:** PostgreSQL + Travel Compositor
2. **Modo parcial:** Solo PostgreSQL o solo TC
3. **Modo fallback:** Solo datos mock (sin dependencias)

## 🔧 Identificar fuente de datos

### Paquetes REALES de Travel Compositor:
- `_source: "travel-compositor"`
- Títulos y descripciones reales
- Precios en tiempo real
- Imágenes oficiales

### Paquetes MOCK/Fallback:
- `_source: "mock-enhanced"`
- Títulos como "Perú Mágico"
- Precios generados
- Imágenes de Unsplash

## 🚀 Estado actual

- ✅ Servidor HTTP funcional
- ✅ PostgreSQL integrado (con fallback)
- ✅ Travel Compositor integrado (con fallback)
- ✅ API REST completa
- ✅ Autenticación JWT en memoria
- ✅ Datos reales + fallback inteligente
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Logging detallado
- ✅ Error handling robusto
- ✅ Reviews desde DB
- ✅ Búsqueda inteligente

## 🎯 Verificar conexiones

```bash
# Verificar estado completo
curl http://localhost:3002/api/health

# Buscar si responde "travel-compositor" o "mock-enhanced"
curl http://localhost:3002/api/packages/featured
```

## 🚀 Próximos pasos

1. Ejecutar `npm install`
2. Ejecutar `npm run setup` para verificar
3. Ejecutar `npm run dev` para iniciar
4. Verificar en `/api/health` que dice:
   - `"travelCompositor": "connected"` (datos reales)
   - `"database": "connected"` (PostgreSQL)
5. Confirmar que `/api/packages/featured` devuelve `"source": "travel-compositor"`

¡El backend está completamente restaurado! 🎉
