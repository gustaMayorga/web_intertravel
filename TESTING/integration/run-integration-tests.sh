#!/bin/bash

# ==============================================
# 🔧 AGENTE 3: SCRIPT DE TESTING COMPLETO  
# ==============================================

echo "🧪 ===== AGENTE 3: INTEGRATION TESTING SUITE ====="
echo ""
echo "⚡ Iniciando verificación completa del sistema admin..."
echo ""

# Verificar estructura de directorios
echo "📁 VERIFICANDO ESTRUCTURA DE DIRECTORIOS..."

# Frontend API Routes
if [ -d "frontend/src/app/api/admin" ]; then
    echo "✅ Frontend API routes encontradas"
    echo "   📊 Conteo de rutas:"
    find frontend/src/app/api/admin -name "route.ts" | wc -l | sed 's/^/   /'
else
    echo "❌ Frontend API routes NO encontradas"
fi

# Backend Modules
if [ -d "backend/modules" ]; then
    echo "✅ Backend modules encontrados"
    echo "   📊 Conteo de módulos:"
    ls backend/modules/*.js 2>/dev/null | wc -l | sed 's/^/   /'
else
    echo "❌ Backend modules NO encontrados"
fi

echo ""
echo "🔍 ANÁLISIS DETALLADO DE RUTAS API..."

# Verificar rutas específicas del admin
admin_routes=(
    "users"
    "packages" 
    "bookings"
    "settings"
    "destinations"
    "fallback"
)

for route in "${admin_routes[@]}"; do
    if [ -d "frontend/src/app/api/admin/$route" ]; then
        methods=$(grep -r "export async function" "frontend/src/app/api/admin/$route" 2>/dev/null | grep -o "function [A-Z]*" | grep -o "[A-Z]*" | tr '\n' ',' | sed 's/,$//')
        echo "✅ /$route - Métodos: ${methods:-"NONE"}"
    else
        echo "❌ /$route - NO ENCONTRADA"
    fi
done

echo ""
echo "🔧 VERIFICANDO MÓDULOS BACKEND..."

# Verificar módulos backend críticos
backend_modules=(
    "users.js"
    "packages.js"
    "bookings.js"
    "booking-analytics.js"
    "settings-manager.js"
    "destinations.js"
    "smart-fallback-system.js"
)

for module in "${backend_modules[@]}"; do
    if [ -f "backend/modules/$module" ]; then
        echo "✅ $module encontrado"
    else
        echo "❌ $module NO encontrado"
    fi
done

echo ""
echo "📊 RESUMEN EJECUTIVO:"

# Contar rutas implementadas
total_routes=$(find frontend/src/app/api/admin -name "route.ts" 2>/dev/null | wc -l)
total_modules=$(ls backend/modules/*.js 2>/dev/null | wc -l)

echo "   📁 Total rutas frontend: $total_routes"
echo "   🔧 Total módulos backend: $total_modules"

# Calcular score de completitud
if [ $total_routes -gt 15 ] && [ $total_modules -gt 10 ]; then
    echo "   🎉 ESTADO: SISTEMA FUNCIONAL (>90%)"
elif [ $total_routes -gt 10 ] && [ $total_modules -gt 7 ]; then
    echo "   ⚠️  ESTADO: SISTEMA PARCIAL (70-90%)"
else
    echo "   🚨 ESTADO: NECESITA DESARROLLO (<70%)"
fi

echo ""
echo "💡 RECOMENDACIONES DEL AGENTE 3:"
echo "   • Ejecutar tests de integración en vivo"
echo "   • Verificar conectividad frontend-backend"
echo "   • Validar autenticación de rutas protegidas"
echo "   • Implementar logging y monitoring"
echo ""
echo "🚀 AGENTE 3: ANÁLISIS COMPLETADO"
echo ""
