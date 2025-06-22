# InterTravel - Sistema Web Unificado

![InterTravel](https://img.shields.io/badge/InterTravel-v3.1.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)

## 📋 Descripción

InterTravel es una plataforma web completa de gestión de viajes que integra:

- **Landing Page** moderna y responsiva
- **Panel de Administración** para agencias
- **Travel Compositor** - Sistema inteligente de composición de viajes
- **Aplicación Móvil** (iOS/Android) con Capacitor
- **Sistema B2B2C** completo

## 🚀 Tecnologías

### Frontend
- **Next.js 14** - Framework React para producción
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de utilidades CSS
- **Three.js** - Gráficos 3D
- **Framer Motion** - Animaciones
- **Capacitor** - Desarrollo móvil híbrido

### Backend
- **Node.js** con Express
- **PostgreSQL** - Base de datos principal
- **JWT** - Autenticación
- **Helmet** - Seguridad
- **CORS** - Política de origen cruzado

## 📁 Estructura del Proyecto

```
├── frontend/                 # Aplicación Next.js
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   └── styles/         # Estilos globales
│   ├── public/             # Archivos estáticos
│   └── package.json
├── backend/                 # API REST con Express
│   ├── routes/             # Rutas de la API
│   ├── modules/            # Módulos del sistema
│   ├── scripts/            # Scripts de utilidad
│   └── package.json
└── README.md
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 13+
- Git

### Configuración Rápida

1. **Clonar el repositorio**
```bash
git clone [URL_DEL_REPOSITORIO]
cd intertravel-website
```

2. **Configurar Backend**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm start
```

3. **Configurar Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Editar .env.local con tus configuraciones
npm run dev
```

### Variables de Entorno

#### Backend (.env)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intertravel
DB_USER=tu_usuario
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_muy_seguro
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3005
```

## 🏃‍♂️ Comandos de Ejecución

### Desarrollo
```bash
# Backend (puerto 3001)
cd backend && npm run dev

# Frontend (puerto 3005)
cd frontend && npm run dev
```

### Producción
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build && npm start
```

### Móvil
```bash
# Compilar para Android
cd frontend && npm run mobile:android

# Compilar para iOS
cd frontend && npm run mobile:ios
```

## 🌐 Despliegue

### Servidor Web

1. **Compilar Frontend**
```bash
cd frontend
npm run build
```

2. **Configurar variables de producción**
```bash
# Backend
cp .env.example .env.production

# Frontend
cp .env.example .env.production
```

3. **Iniciar servicios**
```bash
# Con PM2 (recomendado)
pm2 start backend/server.js --name "intertravel-backend"
pm2 start frontend/server.js --name "intertravel-frontend"
```

### Configuración del Servidor

- **Puerto Frontend**: 3005
- **Puerto Backend**: 3001
- **Base de datos**: PostgreSQL en puerto 5432

## 📱 Funcionalidades

### Landing Page
- Diseño moderno y responsivo
- Animaciones fluidas con Framer Motion
- Globo 3D interactivo con Three.js
- Sistema de búsqueda avanzada

### Panel de Administración
- Gestión completa de destinos
- Dashboard con métricas
- Sistema de usuarios y roles
- Travel Compositor integrado

### Aplicación Móvil
- Versión nativa iOS/Android
- Sincronización en tiempo real
- Notificaciones push
- Modo offline

## 🔒 Seguridad

- Autenticación JWT
- Validación de datos con Validator.js
- Rate limiting
- Headers de seguridad con Helmet
- Encriptación de contraseñas con bcrypt

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico, contactar a: [correo@intertravel.com]

---

**InterTravel Group** - Transformando la experiencia de viajes
