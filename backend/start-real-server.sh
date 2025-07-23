#!/bin/bash

echo "🚀 ==============================================="
echo "🚀 INICIANDO SERVIDOR BACKEND REAL - FASE 1"
echo "🚀 ==============================================="
echo ""

# Verificar si PostgreSQL está corriendo
echo "🔍 Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    if pg_isready -q; then
        echo "✅ PostgreSQL está corriendo"
    else
        echo "❌ PostgreSQL no está corriendo"
        echo "💡 Inicie PostgreSQL antes de continuar"
        echo "   - Windows: Abrir Services y iniciar PostgreSQL"
        echo "   - Linux/Mac: sudo systemctl start postgresql"
        exit 1
    fi
else
    echo "⚠️ PostgreSQL no encontrado en PATH"
    echo "💡 Verifique que PostgreSQL esté instalado"
fi

echo ""

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."
if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
else
    echo "❌ Archivo .env no encontrado"
    echo "💡 Copie .env.example a .env y configure las variables"
    exit 1
fi

echo ""

# Verificar dependencias
echo "🔍 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules encontrado"
else
    echo "❌ node_modules no encontrado"
    echo "💡 Ejecute: npm install"
    exit 1
fi

echo ""

# Matar procesos en puerto 3002 si existen
echo "🔍 Verificando puerto 3002..."
PORT_PID=$(lsof -t -i:3002 2>/dev/null)
if [ ! -z "$PORT_PID" ]; then
    echo "⚠️ Puerto 3002 en uso por proceso $PORT_PID"
    echo "🔄 Terminando proceso anterior..."
    kill -9 $PORT_PID 2>/dev/null
    sleep 2
    echo "✅ Puerto 3002 liberado"
else
    echo "✅ Puerto 3002 disponible"
fi

echo ""

# Parar emergency server si está corriendo
echo "🛑 Parando emergency server si está corriendo..."
pkill -f "emergency-server.js" 2>/dev/null
echo "✅ Emergency server detenido"

echo ""

# Iniciar servidor real
echo "🚀 ==============================================="
echo "🚀 INICIANDO SERVIDOR BACKEND REAL"
echo "🚀 Puerto: 3002"
echo "🚀 Base de datos: PostgreSQL"
echo "🚀 Rutas admin: TODAS IMPLEMENTADAS"
echo "🚀 ==============================================="
echo ""
echo "💡 URLs importantes:"
echo "   🏥 Health: http://localhost:3002/api/health"
echo "   👑 Admin: http://localhost:3002/api/admin/*"
echo "   📱 App: http://localhost:3002/api/app/*"
echo ""
echo "🔄 Iniciando en 3 segundos..."
sleep 3

# Ejecutar servidor real
node server-real.js
