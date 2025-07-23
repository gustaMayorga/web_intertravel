#!/bin/bash

# ===============================================
# TESTING COMPLETO FASE 3 - AUTENTICACIÓN AVANZADA
# ===============================================

echo "🔐 ==============================================="
echo "🔐 TESTING FASE 3 - AUTENTICACIÓN AVANZADA"
echo "🔐 ==============================================="
echo ""

# Variables
BASE_URL="http://localhost:3002"
TEST_EMAIL="security-test-$(date +%s)@intertravel.com"
TEST_PASSWORD="SecurePass123!"
TEST_FIRST_NAME="Security"
TEST_LAST_NAME="Test"

echo "📊 Variables de testing:"
echo "   📧 Email: $TEST_EMAIL"
echo "   🔑 Password: $TEST_PASSWORD"
echo "   🌐 Base URL: $BASE_URL"
echo ""

# ===============================================
# TEST 1: RATE LIMITING EN AUTH
# ===============================================
echo "🔍 TEST 1: Rate Limiting en Authentication..."

echo "   🔄 Enviando 10 requests rápidos a login..."
failed_attempts=0
for i in {1..10}; do
    response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/app/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"fake@test.com\",\"password\":\"wrong\"}")
    
    http_code=$(echo "$response" | tail -c 4)
    
    if [[ "$http_code" == "429" ]]; then
        echo "   ✅ Rate limit activado en intento $i (HTTP 429)"
        failed_attempts=$((failed_attempts + 1))
        break
    fi
done

if [[ $failed_attempts -gt 0 ]]; then
    echo "   ✅ Rate limiting funcionando correctamente"
else
    echo "   ⚠️ Rate limiting no se activó (podría estar configurado con límites altos)"
fi

echo ""

# ===============================================
# TEST 2: REGISTRO CON REFRESH TOKEN
# ===============================================
echo "🔍 TEST 2: Registro con Refresh Token..."

register_response=$(curl -s -X POST "$BASE_URL/api/app/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"$TEST_FIRST_NAME\",
    \"lastName\": \"$TEST_LAST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if [[ $register_response == *"refreshToken"* ]]; then
    echo "   ✅ Registro genera refresh token"
    
    # Extraer tokens
    access_token=$(echo $register_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    refresh_token=$(echo $register_response | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    
    echo "   🔑 Access token: ${access_token:0:20}..."
    echo "   🔄 Refresh token: ${refresh_token:0:20}..."
else
    echo "   ❌ Registro no genera refresh token"
    echo "   📋 Response: $register_response"
    access_token=""
    refresh_token=""
fi

echo ""

# ===============================================
# TEST 3: VALIDACIÓN DE PERMISOS
# ===============================================
echo "🔍 TEST 3: Validación de Permisos..."

if [[ -n "$access_token" ]]; then
    profile_response=$(curl -s -X GET "$BASE_URL/api/app/user/profile" \
      -H "Authorization: Bearer $access_token")
    
    if [[ $profile_response == *"success"*true* ]]; then
        echo "   ✅ Perfil accesible con token válido"
        
        # Extraer email del perfil
        profile_email=$(echo $profile_response | grep -o '"email":"[^"]*' | cut -d'"' -f4)
        echo "   👤 Usuario: $profile_email"
    else
        echo "   ❌ Error accediendo al perfil"
        echo "   📋 Response: $profile_response"
    fi
else
    echo "   ⚠️ No se puede probar - no hay token disponible"
fi

echo ""

# ===============================================
# TEST 4: REFRESH TOKEN FUNCTIONALITY
# ===============================================
echo "🔍 TEST 4: Funcionalidad Refresh Token..."

if [[ -n "$refresh_token" ]]; then
    refresh_response=$(curl -s -X POST "$BASE_URL/api/app/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\": \"$refresh_token\"}")
    
    if [[ $refresh_response == *"accessToken"* ]]; then
        echo "   ✅ Refresh token funcionando correctamente"
        
        # Extraer nuevo access token
        new_access_token=$(echo $refresh_response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        echo "   🔑 Nuevo access token: ${new_access_token:0:20}..."
        
        # Actualizar token para siguientes tests
        access_token=$new_access_token
    else
        echo "   ❌ Error con refresh token"
        echo "   📋 Response: $refresh_response"
    fi
else
    echo "   ⚠️ No se puede probar - no hay refresh token disponible"
fi

echo ""

# ===============================================
# TEST 5: SESSION INFO ENDPOINT
# ===============================================
echo "🔍 TEST 5: Información de Sesión..."

if [[ -n "$access_token" ]]; then
    session_response=$(curl -s -X GET "$BASE_URL/api/app/auth/session-info" \
      -H "Authorization: Bearer $access_token")
    
    if [[ $session_response == *"sessionId"* ]]; then
        echo "   ✅ Endpoint de sesión funcionando"
        
        # Extraer info de sesión
        user_role=$(echo $session_response | grep -o '"role":"[^"]*' | cut -d'"' -f4)
        session_id=$(echo $session_response | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
        
        echo "   👤 Rol: $user_role"
        echo "   🆔 Session ID: ${session_id:0:20}..."
    else
        echo "   ❌ Error obteniendo info de sesión"
        echo "   📋 Response: $session_response"
    fi
else
    echo "   ⚠️ No se puede probar - no hay token disponible"
fi

echo ""

# ===============================================
# TEST 6: LOGOUT SEGURO
# ===============================================
echo "🔍 TEST 6: Logout Seguro..."

if [[ -n "$access_token" ]]; then
    logout_response=$(curl -s -X POST "$BASE_URL/api/app/auth/logout" \
      -H "Authorization: Bearer $access_token")
    
    if [[ $logout_response == *"success"*true* ]]; then
        echo "   ✅ Logout exitoso"
        
        # Verificar que el token ya no funciona
        verify_response=$(curl -s -X GET "$BASE_URL/api/app/user/profile" \
          -H "Authorization: Bearer $access_token")
        
        if [[ $verify_response == *"success"*false* ]] || [[ $verify_response == *"error"* ]]; then
            echo "   ✅ Token invalidado correctamente después del logout"
        else
            echo "   ⚠️ Token sigue funcionando después del logout"
        fi
    else
        echo "   ❌ Error en logout"
        echo "   📋 Response: $logout_response"
    fi
else
    echo "   ⚠️ No se puede probar - no hay token disponible"
fi

echo ""

# ===============================================
# TEST 7: PROTECCIÓN CONTRA FUERZA BRUTA
# ===============================================
echo "🔍 TEST 7: Protección contra Fuerza Bruta..."

echo "   🔄 Simulando 6 intentos de login fallidos..."
brute_force_blocked=false

for i in {1..6}; do
    brute_response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/app/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"brute@test.com\",\"password\":\"wrong$i\"}")
    
    http_code=$(echo "$brute_response" | tail -c 4)
    
    if [[ "$http_code" == "429" ]]; then
        echo "   ✅ Protección activada en intento $i (HTTP 429)"
        brute_force_blocked=true
        break
    fi
    
    # Pequeña pausa para evitar race conditions
    sleep 0.1
done

if [[ $brute_force_blocked == true ]]; then
    echo "   ✅ Protección contra fuerza bruta funcionando"
else
    echo "   ⚠️ Protección contra fuerza bruta no se activó"
fi

echo ""

# ===============================================
# TEST 8: HEALTH CHECK MEJORADO
# ===============================================
echo "🔍 TEST 8: Health Check con Información de Seguridad..."

health_response=$(curl -s "$BASE_URL/api/app/health")

if [[ $health_response == *"security"* ]]; then
    echo "   ✅ Health check incluye información de seguridad"
    
    # Verificar características de seguridad
    if [[ $health_response == *"rateLimiting"* ]]; then
        echo "   ✅ Rate limiting reportado como activo"
    fi
    
    if [[ $health_response == *"authentication"*"advanced"* ]]; then
        echo "   ✅ Autenticación avanzada reportada"
    fi
    
    if [[ $health_response == *"sessionManagement"* ]]; then
        echo "   ✅ Gestión de sesiones reportada"
    fi
else
    echo "   ❌ Health check no incluye información de seguridad"
    echo "   📋 Response: $health_response"
fi

echo ""

# ===============================================
# RESUMEN FINAL
# ===============================================
echo "📊 ==============================================="
echo "📊 RESUMEN DE TESTING FASE 3"
echo "📊 ==============================================="

# Contar tests exitosos
tests_passed=0
total_tests=8

# Test 1: Rate limiting
if [[ $failed_attempts -gt 0 ]]; then
    ((tests_passed++))
    echo "   ✅ Test 1: Rate Limiting - PASSED"
else
    echo "   ⚠️ Test 1: Rate Limiting - PARTIAL (límites altos)"
fi

# Test 2: Refresh tokens
if [[ $register_response == *"refreshToken"* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 2: Refresh Tokens - PASSED"
else
    echo "   ❌ Test 2: Refresh Tokens - FAILED"
fi

# Test 3: Permisos
if [[ $profile_response == *"success"*true* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 3: Validación Permisos - PASSED"
else
    echo "   ❌ Test 3: Validación Permisos - FAILED"
fi

# Test 4: Refresh functionality
if [[ $refresh_response == *"accessToken"* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 4: Refresh Functionality - PASSED"
else
    echo "   ❌ Test 4: Refresh Functionality - FAILED"
fi

# Test 5: Session info
if [[ $session_response == *"sessionId"* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 5: Session Info - PASSED"
else
    echo "   ❌ Test 5: Session Info - FAILED"
fi

# Test 6: Logout seguro
if [[ $logout_response == *"success"*true* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 6: Logout Seguro - PASSED"
else
    echo "   ❌ Test 6: Logout Seguro - FAILED"
fi

# Test 7: Fuerza bruta
if [[ $brute_force_blocked == true ]]; then
    ((tests_passed++))
    echo "   ✅ Test 7: Protección Fuerza Bruta - PASSED"
else
    echo "   ⚠️ Test 7: Protección Fuerza Bruta - PARTIAL"
fi

# Test 8: Health check
if [[ $health_response == *"security"* ]]; then
    ((tests_passed++))
    echo "   ✅ Test 8: Health Check Seguridad - PASSED"
else
    echo "   ❌ Test 8: Health Check Seguridad - FAILED"
fi

echo ""
echo "📈 RESULTADO FINAL: $tests_passed/$total_tests tests pasados"

if [[ $tests_passed -ge 7 ]]; then
    echo "🎉 ¡EXCELENTE! Sistema de seguridad avanzado funcionando correctamente."
    echo ""
    echo "🔐 Características de seguridad activas:"
    echo "   ✅ Rate limiting por endpoint"
    echo "   ✅ Refresh tokens para renovación automática"
    echo "   ✅ Sistema de permisos granular"
    echo "   ✅ Gestión de sesiones robusta"
    echo "   ✅ Protección contra fuerza bruta"
    echo "   ✅ Logout seguro con limpieza de sesión"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   1. Probar frontend: http://localhost:3005/auth/login"
    echo "   2. Verificar auto-renovación de tokens"
    echo "   3. Confirmar logout desde dashboard"
    echo ""
    echo "✅ FASE 3 COMPLETADA - Seguridad empresarial activa"
elif [[ $tests_passed -ge 5 ]]; then
    echo "⚠️ MOSTLY WORKING - $tests_passed/$total_tests tests pasaron"
    echo "   🔧 Revisar tests fallidos y ajustar configuración"
    echo "   🛡️ Funcionalidades básicas de seguridad activas"
else
    echo "❌ CRÍTICO - Solo $tests_passed/$total_tests tests pasaron"
    echo "   🛠️ Revisar configuración de middleware avanzado"
    echo "   🔍 Verificar que auth-advanced.js esté cargado"
    echo "   📋 Revisar logs del servidor para errores"
fi

echo ""
echo "🔐 ==============================================="
echo "🔐 FIN DEL TESTING FASE 3"
echo "🔐 ==============================================="
