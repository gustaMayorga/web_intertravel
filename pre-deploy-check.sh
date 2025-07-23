#!/bin/bash

# Script de verificación pre-despliegue para InterTravel
echo "🔍 Verificando configuración para despliegue..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

print_check() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((ERRORS++))
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo "========================================="
echo "🚀 VERIFICACIÓN PRE-DESPLIEGUE INTERTRAVEL"
echo "========================================="
echo

# 1. Verificar estructura de archivos
print_info "1. Verificando estructura de archivos..."

required_files=(
    "README.md:Documentación principal"
    ".gitignore:Configuración Git"
    "ecosystem.config.js:Configuración PM2"
    "DEPLOYMENT.md:Guía de despliegue"
    "frontend/package.json:Configuración Frontend"
    "backend/package.json:Configuración Backend"
    "frontend/.env.example:Variables Frontend"
    "backend/.env.example:Variables Backend"
)

for item in "${required_files[@]}"; do
    file=$(echo $item | cut -d':' -f1)
    desc=$(echo $item | cut -d':' -f2)
    
    if [ -f "$file" ]; then
        print_check "$desc encontrado"
    else
        print_error "$desc faltante: $file"
    fi
done

echo

# 2. Verificar configuración de package.json
print_info "2. Verificando configuración de dependencias..."

# Verificar Frontend
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm ls >/dev/null 2>&1; then
        print_check "Dependencias Frontend válidas"
    else
        print_warning "Dependencias Frontend necesitan instalación"
    fi
    cd ..
else
    print_error "package.json Frontend no encontrado"
fi

# Verificar Backend
if [ -f "backend/package.json" ]; then
    cd backend
    if npm ls >/dev/null 2>&1; then
        print_check "Dependencias Backend válidas"
    else
        print_warning "Dependencias Backend necesitan instalación"
    fi
    cd ..
else
    print_error "package.json Backend no encontrado"
fi

echo

# 3. Verificar configuración de entorno
print_info "3. Verificando configuración de entorno..."

# Verificar .env examples
if [ -f "frontend/.env.example" ]; then
    if grep -q "NEXT_PUBLIC_" frontend/.env.example; then
        print_check "Variables de entorno Frontend configuradas"
    else
        print_warning "Variables Frontend incompletas"
    fi
else
    print_error "Archivo .env.example Frontend faltante"
fi

if [ -f "backend/.env.example" ]; then
    if grep -q "JWT_SECRET" backend/.env.example && grep -q "DB_" backend/.env.example; then
        print_check "Variables de entorno Backend configuradas"
    else
        print_warning "Variables Backend incompletas"
    fi
else
    print_error "Archivo .env.example Backend faltante"
fi

# Verificar que no haya archivos .env en el repo
if [ -f "frontend/.env" ] || [ -f "frontend/.env.local" ]; then
    print_warning "Archivos .env detectados en Frontend (no deben estar en Git)"
fi

if [ -f "backend/.env" ]; then
    print_warning "Archivo .env detectado en Backend (no debe estar en Git)"
fi

echo

# 4. Verificar .gitignore
print_info "4. Verificando configuración Git..."

if [ -f ".gitignore" ]; then
    if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
        print_check "Archivo .gitignore configurado correctamente"
    else
        print_warning "Archivo .gitignore incompleto"
    fi
else
    print_error "Archivo .gitignore faltante"
fi

# Verificar estado Git
if [ -d ".git" ]; then
    print_check "Repositorio Git inicializado"
    
    # Verificar si hay cambios sin commit
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Hay cambios sin hacer commit"
    else
        print_check "Todos los cambios están en commit"
    fi
    
    # Verificar configuración de usuario
    if [ -n "$(git config user.name)" ] && [ -n "$(git config user.email)" ]; then
        print_check "Configuración Git completa"
    else
        print_warning "Configuración Git incompleta"
    fi
else
    print_error "Repositorio Git no inicializado"
fi

echo

# 5. Verificar configuración de build
print_info "5. Verificando configuración de build..."

if [ -f "frontend/next.config.js" ]; then
    print_check "Configuración Next.js encontrada"
else
    print_warning "Configuración Next.js no encontrada"
fi

if [ -f "frontend/tailwind.config.js" ]; then
    print_check "Configuración Tailwind encontrada"
else
    print_warning "Configuración Tailwind no encontrada"
fi

echo

# 6. Verificar configuración de PM2
print_info "6. Verificando configuración PM2..."

if [ -f "ecosystem.config.js" ]; then
    if grep -q "intertravel-backend" ecosystem.config.js && grep -q "intertravel-frontend" ecosystem.config.js; then
        print_check "Configuración PM2 completa"
    else
        print_warning "Configuración PM2 incompleta"
    fi
else
    print_error "Archivo ecosystem.config.js faltante"
fi

echo

# 7. Verificar scripts de instalación
print_info "7. Verificando scripts de utilidad..."

if [ -f "setup.sh" ]; then
    print_check "Script de instalación disponible"
else
    print_warning "Script de instalación faltante"
fi

if [ -f "git-init.sh" ] || [ -f "git-init.bat" ]; then
    print_check "Script de inicialización Git disponible"
else
    print_warning "Script de Git faltante"
fi

echo

# Resumen final
echo "========================================="
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡PERFECTO! El proyecto está listo para despliegue${NC}"
    echo
    echo "✅ Todos los archivos están en su lugar"
    echo "✅ Configuración completa"
    echo "✅ Git configurado correctamente"
    echo
    echo "🚀 Próximos pasos:"
    echo "1. Crear repositorio remoto (GitHub/GitLab)"
    echo "2. git remote add origin <URL>"
    echo "3. git push -u origin main"
    echo "4. Configurar servidor según DEPLOYMENT.md"
    
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  CASI LISTO - ${WARNINGS} advertencias encontradas${NC}"
    echo
    echo "El proyecto puede desplegarse, pero hay algunos puntos a revisar."
    echo "Consulta las advertencias mostradas arriba."
    
else
    echo -e "${RED}❌ NO LISTO - ${ERRORS} errores y ${WARNINGS} advertencias${NC}"
    echo
    echo "Se encontraron errores críticos que deben corregirse antes del despliegue."
    echo "Revisa los errores mostrados arriba."
fi

echo
echo "📖 Para más información consulta:"
echo "   • README.md - Documentación general"
echo "   • DEPLOYMENT.md - Guía de despliegue"
echo "   • setup.sh - Script de instalación"
echo

exit $ERRORS
