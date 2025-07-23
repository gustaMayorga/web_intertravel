#!/bin/bash

# ===============================================
# TESTING COMPLETO FASE 2 - APP CLIENT
# ===============================================

echo "🧪 ==============================================="
echo "🧪 TESTING COMPLETO FASE 2 - SISTEMA APP CLIENT"
echo "🧪 ==============================================="
echo ""

# Variables
BASE_URL="http://localhost:3002"
TEST_EMAIL="test-$(date +%s)@intertravel.com"
TEST_PASSWORD="123456"
TEST_FIRST_NAME="Usuario"
TEST_LAST_NAME="Prueba"
TEST_PHONE="+54 9 261 555-1234"

echo "📊 Variables de testing:"
echo "   📧 Email: $TEST_EMAIL"
echo "   🔑 Password: $TEST_PASSWORD"
echo "   🌐 Base URL: $BASE_URL"
echo ""

# ===============================================
# TEST 1: HEALTH CHECK BACKEND
# ===============================================
echo "🔍 TEST 1: Health Check Backend..."

health_response=$(curl -s "$BASE_URL/api/health")
app_health_response=$(curl -s "$BASE_URL/api/app/health")

if [[ $health_response == *"success"* ]]; then
    echo "   ✅ Backend principal: OK"
else
    echo "   ❌ Backend principal: FAIL"
    echo "   📋 Response: $health_response"
fi

if [[ $app_health_response == *"success"* ]]; then
    echo "   ✅ App client API: OK"
else
    echo "   ❌ App client API: FAIL"
    echo "   📋 Response: $app_health_response"
fi

echo ""

# ===============================================
# TEST 2: REGISTRO DE USUARIO
# ===============================================
echo "🔍 TEST 2: Registro de Usuario..."

register_response=$(curl -s -X POST "$BASE_URL/api/app/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"$TEST_FIRST_NAME\",
    \"lastName\": \"$TEST_LAST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"phone\": \"$TEST_PHONE\"
  }")

if [[ $register_response == *"success"*true* ]]; then
    echo "   ✅ Registro exitoso"
    
    # Extraer token del response
    token=$(echo $register_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   🔑 Token obtenido: ${token:0:20}..."
else
    echo "   ❌ Registro fallido"
    echo "   📋 Response: $register_response"
    token=""
fi

echo ""

# ===============================================
# TEST 3: LOGIN DE USUARIO
# ===============================================
echo "🔍 TEST 3: Login de Usuario..."

login_response=$(curl -s -X POST "$BASE_URL/api/app/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if [[ $login_response == *"success"*true* ]]; then
    echo "   ✅ Login exitoso"
    
    # Extraer token del login (should be same)
    login_token=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   🔑 Token login: ${login_token:0:20}..."
    
    # Usar el token del login para siguientes tests
    token=$login_token
else
    echo "   ❌ Login fallido"
    echo "   📋 Response: $login_response"
fi

echo ""

# ===============================================
# TEST 4: PERFIL DE USUARIO (AUTENTICADO)
# ===============================================
echo "🔍 TEST 4: Obtener Perfil de Usuario..."

if [[ -n "$token" ]]; then
    profile_response=$(curl -s -X GET "$BASE_URL/api/app/user/profile" \
      -H "Authorization: Bearer $token")
    
    if [[ $profile_response == *"success"*true* ]]; then
        echo "   ✅ Perfil obtenido exitosamente"
        
        # Extraer datos del perfil
        full_name=$(echo $profile_response | grep -o '"fullName":"[^"]*' | cut -d'"' -f4)
        email=$(echo $profile_response | grep -o '"email":"[^"]*' | cut -d'"' -f4)
        echo "   👤 Usuario: $full_name ($email)"
    else
        echo "   ❌ Error obteniendo perfil"
        echo "   📋 Response: $profile_response"
    fi
else
    echo "   ⚠️ No se puede probar - no hay token disponible"
fi

echo ""

# ===============================================
# TEST 5: RESERVAS DE USUARIO (AUTENTICADO) 
# ===============================================
echo "🔍 TEST 5: Obtener Reservas de Usuario..."

if [[ -n "$token" ]]; then
    bookings_response=$(curl -s -X GET "$BASE_URL/api/app/user/bookings" \
      -H "Authorization: Bearer $token")
    
    if [[ $bookings_response == *"success"*true* ]]; then
        echo "   ✅ Reservas obtenidas exitosamente"
        
        # Contar reservas
        bookings_count=$(echo $bookings_response | grep -o '"totalBookings":[0-9]*' | cut -d':' -f2)
        echo "   📋 Número de reservas: $bookings_count"
    else
        echo "   ❌ Error obteniendo reservas"
        echo "   📋 Response: $bookings_response"
    fi
else
    echo "   ⚠️ No se puede probar - no hay token disponible"
fi

echo ""

# ===============================================
# TEST 6: AUTENTICACIÓN INVÁLIDA
# ===============================================
echo "🔍 TEST 6: Test de Autenticación Inválida..."

invalid_auth_response=$(curl -s -X GET "$BASE_URL/api/app/user/profile" \
  -H "Authorization: Bearer invalid-token")

if [[ $invalid_auth_response == *"success"*false* ]] || [[ $invalid_auth_response == *"error"* ]]; then
    echo "   ✅ Autenticación inválida rechazada correctamente"
else
    echo "   ❌ Sistema de autenticación vulnerable"
    echo "   📋 Response: $invalid_auth_response"
fi

echo ""

# ===============================================
# RESUMEN FINAL
# ===============================================
echo "📊 ==============================================="
echo "📊 RESUMEN DE TESTING FASE 2"
echo "📊 ==============================================="

# Contar tests exitosos
tests_passed=0
total_tests=6

# Test 1: Health check
if [[ $health_response == *"success"* ]] && [[ $app_health_response == *"success"* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 1: Health Check - PASSED"
else
    echo "   ❌ Test 1: Health Check - FAILED"
fi

# Test 2: Registro
if [[ $register_response == *"success"*true* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 2: Registro Usuario - PASSED"
else
    echo "   ❌ Test 2: Registro Usuario - FAILED"
fi

# Test 3: Login
if [[ $login_response == *"success"*true* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 3: Login Usuario - PASSED"
else
    echo "   ❌ Test 3: Login Usuario - FAILED"
fi

# Test 4: Perfil
if [[ $profile_response == *"success"*true* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 4: Perfil Usuario - PASSED"
else
    echo "   ❌ Test 4: Perfil Usuario - FAILED"
fi

# Test 5: Reservas
if [[ $bookings_response == *"success"*true* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 5: Reservas Usuario - PASSED"
else
    echo "   ❌ Test 5: Reservas Usuario - FAILED"
fi

# Test 6: Auth inválida
if [[ $invalid_auth_response == *"success"*false* ]] || [[ $invalid_auth_response == *"error"* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 6: Auth Inválida - PASSED"
else
    echo "   ❌ Test 6: Auth Inválida - FAILED"
fi

echo ""
echo "📈 RESULTADO FINAL: $tests_passed/$total_tests tests pasados"

if [[ $tests_passed -eq $total_tests ]]; then
    echo "🎉 ¡TODOS LOS TESTS PASARON! Sistema app-client funcionando perfectamente."
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   1. Iniciar frontend: cd frontend && npm run dev"
    echo "   2. Probar registro: http://localhost:3005/auth/register"  
    echo "   3. Probar login: http://localhost:3005/auth/login"
    echo "   4. Probar dashboard: http://localhost:3005/account/dashboard"
    echo ""
    echo "✅ FASE 2 COMPLETADA - Sistema app-client 100% funcional"
elif [[ $tests_passed -ge 4 ]]; then
    echo "⚠️ MOSTLY WORKING - $tests_passed/$total_tests tests pasaron"
    echo "   🔧 Revisar tests fallidos y corregir"
    echo "   🚀 Sistema básico funcional"
else
    echo "❌ CRÍTICO - Solo $tests_passed/$total_tests tests pasaron"
    echo "   🛠️ Revisar configuración del backend"
    echo "   🔍 Verificar que server-real.js esté corriendo"
    echo "   📋 Revisar logs del servidor"
fi

echo ""
echo "🎯 ==============================================="
echo "🎯 FIN DEL TESTING FASE 2"
echo "🎯 ==============================================="
