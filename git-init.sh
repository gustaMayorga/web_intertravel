#!/bin/bash

# Script para inicializar Git en InterTravel
echo "🔧 Inicializando repositorio Git para InterTravel..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Git está instalado
if ! command -v git &> /dev/null; then
    print_error "Git no está instalado. Por favor, instala Git antes de continuar."
    exit 1
fi

print_success "Git $(git --version) detectado"

# Verificar si ya es un repositorio Git
if [ -d ".git" ]; then
    print_warning "Este directorio ya es un repositorio Git."
    read -p "¿Deseas reinicializarlo? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .git
        print_status "Repositorio Git anterior eliminado."
    else
        print_status "Manteniendo repositorio Git existente."
        exit 0
    fi
fi

# Inicializar repositorio Git
print_status "Inicializando repositorio Git..."
git init

if [ $? -eq 0 ]; then
    print_success "Repositorio Git inicializado correctamente"
else
    print_error "Error al inicializar el repositorio Git"
    exit 1
fi

# Configurar Git (si no está configurado globalmente)
if [ -z "$(git config --global user.name)" ]; then
    read -p "Ingresa tu nombre para Git: " git_name
    git config user.name "$git_name"
    print_success "Nombre de usuario configurado: $git_name"
fi

if [ -z "$(git config --global user.email)" ]; then
    read -p "Ingresa tu email para Git: " git_email
    git config user.email "$git_email"
    print_success "Email configurado: $git_email"
fi

# Verificar que los archivos importantes existan
print_status "Verificando archivos esenciales..."

required_files=(
    "README.md"
    ".gitignore"
    "package.json"
    "frontend/package.json"
    "backend/package.json"
    "ecosystem.config.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file existe"
    else
        print_warning "⚠ $file no encontrado"
    fi
done

# Agregar archivos al staging area
print_status "Agregando archivos al repositorio..."
git add .

# Crear commit inicial
print_status "Creando commit inicial..."
git commit -m "🚀 Initial commit - InterTravel Web System

- ✅ Frontend: Next.js 14 with TypeScript
- ✅ Backend: Express.js with PostgreSQL
- ✅ Mobile: Capacitor for iOS/Android
- ✅ Travel Compositor integration
- ✅ B2B2C system complete
- ✅ Production ready configuration
- ✅ PM2 ecosystem configuration
- ✅ Deployment documentation

Features:
- Modern landing page with 3D globe
- Admin panel for agencies
- Mobile application
- Travel booking system
- Authentication & security
- Payment integration ready"

if [ $? -eq 0 ]; then
    print_success "Commit inicial creado correctamente"
else
    print_error "Error al crear el commit inicial"
    exit 1
fi

print_success "🎉 Repositorio Git configurado correctamente!"
echo ""
print_status "Próximos pasos:"
echo "1. 📝 Crear repositorio en GitHub/GitLab/Bitbucket"
echo "2. 🔗 Agregar remote: git remote add origin <URL_DEL_REPOSITORIO>"
echo "3. 📤 Subir código: git push -u origin main"
echo ""
print_status "Comandos útiles:"
echo "  git status          - Ver estado de archivos"
echo "  git add .           - Agregar cambios"
echo "  git commit -m \"..\"  - Crear commit"
echo "  git push            - Subir cambios"
echo "  git pull            - Descargar cambios"
echo ""
print_warning "📋 Recordatorios importantes:"
echo "• Configura las variables de entorno antes del despliegue"
echo "• Nunca subas archivos .env al repositorio"
echo "• Revisa la documentación de despliegue en DEPLOYMENT.md"
echo "• Usa ramas para nuevas características: git checkout -b feature/nueva-funcionalidad"
