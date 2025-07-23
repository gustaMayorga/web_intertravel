#!/bin/bash

echo "🔧 REPARACIÓN RÁPIDA DE SERVICIOS INTERTRAVEL"
echo "============================================"

SERVER_IP="18.224.68.191"
SSH_KEY="aws-key.pem"

# Verificar SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key no encontrada: $SSH_KEY"
    echo "💡 Mueve la key desde Descargas:"
    echo "   copy \"C:\\Users\\diego\\Downloads\\LightsailDefaultKey-us-east-2 (1).pem\" \"aws-key.pem\""
    exit 1
fi

echo "🔍 Verificando estado de servicios..."

ssh -i "$SSH_KEY" ubuntu@"$SERVER_IP" << 'EOF'
    echo "📊 Estado actual de servicios:"
    
    echo "🔹 Backend:"
    sudo systemctl is-active intertravel-backend
    
    echo "🔹 Frontend:"
    sudo systemctl is-active intertravel-frontend
    
    echo "🔹 App Cliente:"
    sudo systemctl is-active intertravel-app
    
    echo ""
    echo "🔄 Reiniciando servicios que no responden..."
    
    # Reiniciar frontend
    echo "🔄 Reiniciando frontend..."
    sudo systemctl restart intertravel-frontend
    sleep 5
    
    # Reiniciar app cliente
    echo "🔄 Reiniciando app cliente..."
    sudo systemctl restart intertravel-app
    sleep 5
    
    # Verificar puertos
    echo "🔍 Verificando puertos activos:"
    sudo netstat -tlnp | grep -E "(3002|3005|3009)"
    
    echo ""
    echo "📊 Estado final:"
    sudo systemctl is-active intertravel-backend
    sudo systemctl is-active intertravel-frontend
    sudo systemctl is-active intertravel-app
    
    echo "✅ Reparación completada"
EOF

echo ""
echo "🔍 Verificando URLs finales:"
sleep 10

# Verificar API
if curl -f "http://$SERVER_IP/api/health" &> /dev/null; then
    echo "✅ API Backend: FUNCIONANDO"
else
    echo "❌ API Backend: NO RESPONDE"
fi

# Verificar frontend
if curl -f "http://$SERVER_IP" &> /dev/null; then
    echo "✅ Frontend: FUNCIONANDO"
else
    echo "❌ Frontend: NO RESPONDE"
fi

# Verificar app
if curl -f "http://$SERVER_IP/app" &> /dev/null; then
    echo "✅ App Cliente: FUNCIONANDO"
else
    echo "❌ App Cliente: NO RESPONDE"
fi

echo ""
echo "🌐 URLs finales:"
echo "📱 Landing: http://$SERVER_IP/"
echo "👑 Admin: http://$SERVER_IP/admin"
echo "📱 App DNI: http://$SERVER_IP/app"
echo "🔧 API: http://$SERVER_IP/api/health"