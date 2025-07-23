#!/bin/bash

# 🔧 SCRIPT DE SOLUCIÓN RÁPIDA - ERROR DE MÓDULO
# ===============================================

echo "🔧 Solucionando error de módulo de autenticación..."

# Ir al directorio del frontend
cd "D:/Inter/intertravel-website/WEB-FINAL-UNIFICADA/frontend"

# Matar procesos de Next.js si existen
echo "🛑 Deteniendo procesos existentes..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Limpiar caches
echo "🧹 Limpiando caches..."
rm -rf .next
rm -rf dist
rm -rf out
rm -rf node_modules/.cache

# Verificar que no hay archivos problemáticos
echo "🔍 Verificando archivos de hooks..."
ls -la src/hooks/

# Reinstalar dependencias
echo "📦 Reinstalando dependencias..."
npm install --force

# Verificar estructura de archivos
echo "📁 Verificando estructura..."
if [ -f "src/hooks/use-auth.tsx" ]; then
    echo "✅ use-auth.tsx encontrado"
else
    echo "❌ use-auth.tsx NO encontrado"
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
npm run dev
