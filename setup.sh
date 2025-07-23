#!/bin/bash

# Script de inicialización para InterTravel
echo "🚀 Iniciando configuración de InterTravel..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
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

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor, instala Node.js 18+ antes de continuar."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detectado"

# Configurar Backend
print_status "Configurando Backend..."
cd backend

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Archivo .env creado desde .env.example. Por favor, configura las variables de entorno."
    else
        print_error "No se encontró .env.example en el backend"
    fi
fi

print_status "Instalando dependencias del backend..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencias del backend instaladas correctamente"
else
    print_error "Error al instalar dependencias del backend"
    exit 1
fi

# Configurar Frontend
print_status "Configurando Frontend..."
cd ../frontend

if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_warning "Archivo .env.local creado desde .env.example. Por favor, configura las variables de entorno."
    else
        print_error "No se encontró .env.example en el frontend"
    fi
fi

print_status "Instalando dependencias del frontend..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencias del frontend instaladas correctamente"
else
    print_error "Error al instalar dependencias del frontend"
    exit 1
fi

# Volver al directorio raíz
cd ..

print_success "🎉 Configuración completada!"
echo ""
print_status "Para iniciar el proyecto:"
echo "  Backend:  cd backend && npm start"
echo "  Frontend: cd frontend && npm run dev"
echo ""
print_status "URLs de desarrollo:"
echo "  Frontend: http://localhost:3005"
echo "  Backend:  http://localhost:3001"
echo ""
print_warning "Recuerda configurar las variables de entorno en los archivos .env antes de usar en producción."
