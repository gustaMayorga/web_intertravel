#!/bin/bash

# =================================================================
# 🛡️ VERIFICACIÓN DE SEGURIDAD COMPLETA - INTERTRAVEL
# =================================================================
# Este script verifica todas las correcciones de seguridad aplicadas
# =================================================================

echo "🛡️ VERIFICANDO CORRECCIONES DE SEGURIDAD..."
echo "=============================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Función para verificar
check_security() {
    local description="$1"
    local file_path="$2"
    local search_pattern="$3"
    local should_exist="$4"  # true o false
    
    echo -n "🔍 $description... "
    
    if [ -f "$file_path" ]; then
        if [ "$search_pattern" != "" ]; then
            if grep -q "$search_pattern" "$file_path"; then
                if [ "$should_exist" = "true" ]; then
                    echo -e "${GREEN}✅ CORRECTO${NC}"
                    ((PASSED++))
                else
                    echo -e "${RED}❌ VULNERABLE${NC}"
                    ((FAILED++))
                    echo "   └─ Encontrado patrón no deseado: $search_pattern"
                fi
            else
                if [ "$should_exist" = "false" ]; then
                    echo -e "${GREEN}✅ SEGURO${NC}"
                    ((PASSED++))
                else
                    echo -e "${RED}❌ FALTA${NC}"
                    ((FAILED++))
                    echo "   └─ No encontrado patrón requerido: $search_pattern"
                fi
            fi
        else
            echo -e "${GREEN}✅ ARCHIVO EXISTE${NC}"
            ((PASSED++))
        fi
    else
        echo -e "${RED}❌ ARCHIVO NO EXISTE${NC}"
        ((FAILED++))
        echo "   └─ Ruta: $file_path"
    fi
}

check_warning() {
    local description="$1"
    local condition="$2"
    
    echo -n "⚠️  $description... "
    
    if eval "$condition"; then
        echo -e "${YELLOW}⚠️ ADVERTENCIA${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ OK${NC}"
        ((PASSED++))
    fi
}

echo ""
echo "📁 VERIFICANDO ARCHIVOS DE SEGURIDAD:"
echo "======================================"

# 1. Verificar middleware
check_security "Middleware de protección" \
    "src/middleware.ts" \
    "export function middleware" \
    "true"

# 2. Verificar páginas de redirección
check_security "Redirección /agency" \
    "src/app/agency/page.tsx" \
    "router.replace.*agency/login" \
    "true"

check_security "Redirección /admin" \
    "src/app/admin/page.tsx" \
    "router.replace.*admin/login" \
    "true"

# 3. Verificar sistema de auth-security
check_security "Sistema de seguridad de auth" \
    "src/lib/auth-security.ts" \
    "validateTokenFormat" \
    "true"

# 4. Verificar componente DemoCredentials
check_security "Componente DemoCredentials" \
    "src/components/ui/DemoCredentials.tsx" \
    "NODE_ENV.*development" \
    "true"

echo ""
echo "🔗 VERIFICANDO ENLACES Y NAVEGACIÓN:"
echo "===================================="

# 5. Verificar corrección en Header
check_security "Enlaces corregidos en Header" \
    "src/components/Header.tsx" \
    'href="/agency/login"' \
    "true"

# 6. Verificar que no hay enlaces rotos
check_security "Sin enlaces a /agency directo" \
    "src/components/Header.tsx" \
    'href="/agency"[^/]' \
    "false"

echo ""
echo "🛡️ VERIFICANDO PROTECCIONES:"
echo "============================="

# 7. Verificar protección en dashboards
check_security "Protección en agency dashboard" \
    "src/app/agency/dashboard/page.tsx" \
    "useAuthProtection.*agency" \
    "true"

check_security "Logout seguro en agency" \
    "src/app/agency/dashboard/page.tsx" \
    "secureLogout.*agency" \
    "true"

# 8. Verificar uso de DemoCredentials
check_security "DemoCredentials en admin login" \
    "src/app/admin/login/page.tsx" \
    "DemoCredentials.*admin" \
    "true"

check_security "DemoCredentials en agency login" \
    "src/app/agency/login/page.tsx" \
    "DemoCredentials.*agency" \
    "true"

echo ""
echo "🚨 VERIFICANDO VULNERABILIDADES:"
echo "================================="

# 9. Verificar que no hay credenciales hardcodeadas
check_security "Sin credenciales hardcodeadas en admin" \
    "src/app/admin/login/page.tsx" \
    "admin.*admin123" \
    "false"

check_security "Sin credenciales hardcodeadas en agency" \
    "src/app/agency/login/page.tsx" \
    "agencia_admin.*agencia123" \
    "false"

# 10. Verificar configuración del middleware
check_security "Configuración de rutas en middleware" \
    "src/middleware.ts" \
    "matcher.*admin.*agency" \
    "true"

echo ""
echo "⚙️ VERIFICANDO CONFIGURACIÓN:"
echo "============================="

# 11. Verificar variables de entorno
check_warning "Variables de entorno de desarrollo" \
    "[ -f '.env.local' ] && grep -q 'NEXT_PUBLIC.*=' .env.local"

check_warning "Archivos .env no en .gitignore" \
    "[ -f '.gitignore' ] && ! grep -q '.env' .gitignore"

echo ""
echo "📊 RESUMEN DE VERIFICACIÓN:"
echo "=========================="
echo -e "✅ ${GREEN}Verificaciones pasadas: $PASSED${NC}"
echo -e "❌ ${RED}Verificaciones fallidas: $FAILED${NC}"
echo -e "⚠️  ${YELLOW}Advertencias: $WARNINGS${NC}"

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODAS LAS CORRECCIONES DE SEGURIDAD APLICADAS CORRECTAMENTE!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Hay $WARNINGS advertencias que deberías revisar.${NC}"
    fi
    echo ""
    echo -e "${BLUE}🚀 El sistema está listo para deploy con seguridad mejorada.${NC}"
    exit 0
else
    echo -e "${RED}🚨 FALTAN $FAILED CORRECCIONES DE SEGURIDAD CRÍTICAS${NC}"
    echo ""
    echo -e "${YELLOW}📋 ACCIONES REQUERIDAS:${NC}"
    echo "1. Revisar los archivos marcados como ❌ FALTA"
    echo "2. Aplicar las correcciones necesarias"
    echo "3. Ejecutar este script nuevamente"
    echo ""
    echo -e "${RED}⚠️  NO DESPLEGAR A PRODUCCIÓN HASTA CORREGIR TODAS LAS FALLAS${NC}"
    exit 1
fi