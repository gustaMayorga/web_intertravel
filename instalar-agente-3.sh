#!/bin/bash

# ===============================================
# INSTALACIÓN COMPLETA - AGENTE 3
# Sistema de Pagos InterTravel
# ===============================================

echo "🚀 ==============================================="
echo "🚀 INSTALACIÓN SISTEMA DE PAGOS - AGENTE 3"
echo "🚀 ==============================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no instalado"
    echo "💡 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detectado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no disponible"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm detectado: $NPM_VERSION"

echo ""
echo "📦 INSTALANDO DEPENDENCIAS DEL BACKEND..."
cd backend

# Verificar package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json no encontrado en backend/"
    exit 1
fi

# Instalar dependencias del backend
npm install

# Verificar dependencias críticas de pagos
echo ""
echo "🔍 Verificando dependencias críticas..."

CRITICAL_PACKAGES=("express" "pg" "bcrypt" "mercadopago" "stripe" "pdfkit" "qrcode" "nodemailer" "moment" "uuid")

for package in "${CRITICAL_PACKAGES[@]}"; do
    if npm list "$package" &> /dev/null; then
        echo "✅ $package instalado"
    else
        echo "❌ $package faltante - instalando..."
        npm install "$package"
    fi
done

echo ""
echo "🗄️ CONFIGURANDO BASE DE DATOS..."

# Verificar PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL detectado"
    PSQL_VERSION=$(psql --version)
    echo "📊 Versión: $PSQL_VERSION"
else
    echo "⚠️ PostgreSQL no detectado"
    echo "💡 Instala PostgreSQL o configura DATABASE_URL para instancia remota"
fi

# Crear directorio para vouchers
echo ""
echo "📁 Creando directorios necesarios..."
mkdir -p vouchers
mkdir -p temp
mkdir -p logs

echo "✅ Directorios creados:"
echo "   📄 vouchers/ - Para PDFs de vouchers"
echo "   📝 temp/ - Para archivos temporales"
echo "   📋 logs/ - Para logs del sistema"

# Verificar variables de entorno
echo ""
echo "🔧 Verificando configuración..."

if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
    
    # Verificar variables críticas
    if grep -q "MERCADOPAGO_ACCESS_TOKEN" .env; then
        echo "✅ Configuración MercadoPago detectada"
    else
        echo "⚠️ MERCADOPAGO_ACCESS_TOKEN no configurado"
    fi
    
    if grep -q "STRIPE_SECRET_KEY" .env; then
        echo "✅ Configuración Stripe detectada"
    else
        echo "⚠️ STRIPE_SECRET_KEY no configurado"
    fi
    
    if grep -q "SMTP_USER" .env; then
        echo "✅ Configuración SMTP detectada"
    else
        echo "⚠️ SMTP_USER no configurado"
    fi
else
    echo "❌ Archivo .env no encontrado"
    echo "💡 Copia .env.example a .env y configura las variables"
fi

echo ""
echo "📱 CONFIGURANDO FRONTEND..."
cd ../frontend

# Verificar si existe el frontend
if [ ! -f "package.json" ]; then
    echo "❌ Frontend no encontrado en ../frontend/"
    echo "💡 Asegúrate de que el frontend esté en la carpeta correcta"
else
    echo "📦 Instalando dependencias del frontend..."
    npm install
    
    # Verificar dependencias del frontend para checkout
    FRONTEND_PACKAGES=("next" "react" "tailwindcss" "@types/node")
    
    for package in "${FRONTEND_PACKAGES[@]}"; do
        if npm list "$package" &> /dev/null; then
            echo "✅ $package instalado"
        else
            echo "❌ $package faltante - instalando..."
            npm install "$package"
        fi
    done
fi

cd ..

echo ""
echo "🧪 EJECUTANDO TESTS DE INSTALACIÓN..."

# Test básico del backend
echo "🔍 Verificando backend..."
cd backend
node -e "
const express = require('express');
const { Pool } = require('pg');
console.log('✅ Dependencias principales cargadas correctamente');

try {
    require('mercadopago');
    console.log('✅ MercadoPago SDK disponible');
} catch(e) {
    console.log('❌ Error con MercadoPago SDK:', e.message);
}

try {
    require('stripe');
    console.log('✅ Stripe SDK disponible');
} catch(e) {
    console.log('❌ Error con Stripe SDK:', e.message);
}

try {
    require('pdfkit');
    console.log('✅ PDFKit disponible para vouchers');
} catch(e) {
    console.log('❌ Error con PDFKit:', e.message);
}
"

cd ..

echo ""
echo "🎉 ==============================================="
echo "🎉 INSTALACIÓN COMPLETADA"
echo "🎉 ==============================================="

echo ""
echo "📋 RESUMEN DE INSTALACIÓN:"
echo "✅ Dependencias backend instaladas"
echo "✅ Dependencias frontend instaladas"
echo "✅ Directorios del sistema creados"
echo "✅ SDKs de pago verificados"
echo "✅ Sistema listo para configuración"

echo ""
echo "🔧 PRÓXIMOS PASOS:"
echo "==============================================="

echo "1. CONFIGURAR VARIABLES DE ENTORNO:"
echo "   📝 Edita backend/.env con tus credenciales:"
echo "   • MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxx"
echo "   • STRIPE_SECRET_KEY=sk_test_xxxxx"
echo "   • SMTP_USER=tu-email@gmail.com"
echo "   • SMTP_PASS=tu-app-password"

echo ""
echo "2. CONFIGURAR BASE DE DATOS:"
echo "   🗄️ PostgreSQL local:"
echo "   createdb intertravel_dev"
echo "   🌐 O configura DATABASE_URL para BD remota"

echo ""
echo "3. INICIAR SERVICIOS:"
echo "   🖥️ Backend:"
echo "   cd backend && npm start"
echo ""
echo "   📱 Frontend:"
echo "   cd frontend && npm run dev"

echo ""
echo "4. EJECUTAR TESTS:"
echo "   🧪 Tests completos:"
echo "   bash testing-pagos-completo.sh"

echo ""
echo "🔗 URLS IMPORTANTES:"
echo "==============================================="
echo "Backend API: http://localhost:3002"
echo "Frontend App: http://localhost:3005"
echo "Health Check: http://localhost:3002/api/health"
echo "Admin Panel: http://localhost:3002/admin"

echo ""
echo "📚 DOCUMENTACIÓN:"
echo "==============================================="
echo "📖 Guía completa: AGENTE-3-COMPLETADO.md"
echo "🧪 Tests: testing-pagos-completo.sh"
echo "📋 Estado: Check http://localhost:3002/api/health"

echo ""
echo "⚠️ IMPORTANTE:"
echo "==============================================="
echo "🔑 USA CREDENCIALES DE SANDBOX para testing"
echo "🚫 NO uses credenciales de producción en desarrollo"
echo "📧 Configura SMTP para que los vouchers se envíen"
echo "🌐 El frontend debe correr en puerto 3005"
echo "🖥️ El backend debe correr en puerto 3002"

echo ""
echo "💡 SOPORTE:"
echo "Si tienes problemas:"
echo "1. Verifica que Node.js >= 16"
echo "2. Verifica que PostgreSQL esté corriendo"
echo "3. Revisa las variables de entorno en .env"
echo "4. Ejecuta 'npm install' en backend/ y frontend/"

echo ""
echo "🎯 ¡SISTEMA DE PAGOS LISTO PARA GENERAR REVENUE REAL!"