#!/bin/bash

# ===============================================
# SCRIPT DE VERIFICACIÓN - PAQUETES INTERTRAVEL
# ===============================================

echo "🚀 VERIFICANDO CORRECCIONES DE PAQUETES INTERTRAVEL..."
echo "=================================================="

# Leer el servidor principal
SERVER_FILE="D:/Inter/intertravel-website/WEB-FINAL-UNIFICADA/backend/server.js"

if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ ERROR: No se encuentra server.js"
    exit 1
fi

echo "✅ Archivo server.js encontrado"

# Verificar correcciones aplicadas
echo ""
echo "🔍 VERIFICANDO CORRECCIONES APLICADAS:"

# 1. Verificar función isIntertravelPackage mejorada
if grep -q "provider.includes('intertravel')" "$SERVER_FILE"; then
    echo "✅ Función isIntertravelPackage mejorada"
else
    echo "❌ Función isIntertravelPackage NO mejorada"
fi

# 2. Verificar generateMockPackages con InterTravel
if grep -q "intertravelPackages" "$SERVER_FILE"; then
    echo "✅ generateMockPackages incluye paquetes InterTravel"
else
    echo "❌ generateMockPackages NO incluye paquetes InterTravel"
fi

# 3. Verificar getPackagesFromSource corregida
if grep -q "requestedLimit" "$SERVER_FILE"; then
    echo "✅ getPackagesFromSource corregida"
else
    echo "❌ getPackagesFromSource NO corregida"
fi

# 4. Verificar límites aumentados
if grep -q "limit: 500" "$SERVER_FILE"; then
    echo "✅ Límites aumentados a 500 paquetes"
else
    echo "❌ Límites NO aumentados"
fi

echo ""
echo "🎯 RESUMEN DE LO QUE DEBERÍA PASAR AHORA:"
echo "============================================"
echo "1. 📦 Travel Compositor obtendrá TODOS los paquetes disponibles (no solo 40)"
echo "2. 🌟 Paquetes InterTravel/enzo.vingoli aparecerán PRIMERO en los resultados"
echo "3. 📊 Los logs mostrarán cuántos paquetes InterTravel se detectaron"
echo "4. ✨ En modo mock, 25% de los paquetes serán de InterTravel"
echo "5. 🔍 Mejor detección de paquetes InterTravel por múltiples criterios"
echo ""
echo "🚀 PASOS PARA PROBAR:"
echo "===================="
echo "1. Reinicia el servidor: cd backend && npm start"
echo "2. Visita: http://localhost:3002/api/packages/featured"
echo "3. Revisa los logs del servidor para ver la priorización"
echo "4. Los paquetes InterTravel deberían aparecer primero"
echo ""
echo "✅ VERIFICACIÓN COMPLETADA"
