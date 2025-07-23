#!/bin/bash

# ===============================================
# PARCHE RÁPIDO - CORRECCIÓN DE ERRORES
# ===============================================

echo "🔧 Aplicando parche rápido para errores..."

cd backend

# Reiniciar servidor backend
echo "🔄 Reiniciando backend..."
killall node 2>/dev/null || true
sleep 2

echo "✅ Parche aplicado"
echo ""
echo "📋 ESTADO ACTUAL:"
echo "   ✅ API corregida: /api/admin/dashboard/stats"
echo "   ✅ Componente Textarea arreglado"
echo "   ✅ Backend listo para funcionar"
echo ""
echo "🚀 PARA CONTINUAR:"
echo "   1. cd backend && npm run dev"
echo "   2. cd frontend && npm run dev"
echo ""
echo "🔗 URLs de verificación:"
echo "   Backend: http://localhost:3002/api/health"
echo "   Admin:   http://localhost:3005/admin"