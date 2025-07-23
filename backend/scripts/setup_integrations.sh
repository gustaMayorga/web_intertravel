#!/bin/bash

# 🔗 SCRIPT DE INICIALIZACIÓN DE INTEGRACIONES - AGENTE 5
# ========================================================
# 
# Script para crear todas las tablas y datos necesarios
# para el sistema completo de integraciones

echo "🔗 Inicializando sistema de integraciones..."

# Variables de entorno
DB_NAME=${DATABASE_NAME:-intertravel}
DB_USER=${DATABASE_USER:-postgres}
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}

echo "📋 Configuración de base de datos:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Base de datos: $DB_NAME"
echo "   Usuario: $DB_USER"

# Función para ejecutar SQL
execute_sql() {
    local sql_file=$1
    echo "🔧 Ejecutando: $sql_file"
    
    if [ -f "$sql_file" ]; then
        PGPASSWORD=$DATABASE_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$sql_file"
        if [ $? -eq 0 ]; then
            echo "✅ $sql_file ejecutado exitosamente"
        else
            echo "❌ Error ejecutando $sql_file"
            exit 1
        fi
    else
        echo "⚠️ Archivo no encontrado: $sql_file"
    fi
}

# Crear tablas de integraciones
echo "📊 Creando esquema de integraciones..."
execute_sql "backend/scripts/create_integrations_schema.sql"

# Verificar instalación
echo "🔍 Verificando instalación..."

# Contar tablas creadas
TABLES_COUNT=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'integration_logs', 'user_loyalty', 'user_wishlist', 'uber_bookings',
    'insurance_policies', 'whatsapp_messages', 'loyalty_transactions',
    'integration_config', 'loyalty_rewards', 'loyalty_redemptions'
);")

echo "📈 Tablas de integraciones creadas: $TABLES_COUNT de 10"

if [ "$TABLES_COUNT" -eq 10 ]; then
    echo "✅ Sistema de integraciones instalado correctamente"
    
    # Mostrar resumen
    echo ""
    echo "🎯 SISTEMA DE INTEGRACIONES LISTO"
    echo "================================="
    echo "✅ Uber API - Traslados automáticos"
    echo "✅ Seguros de Viaje - Pólizas integradas"
    echo "✅ WhatsApp Business - Notificaciones"
    echo "✅ Sistema de Fidelización - Puntos y tiers"
    echo "✅ Analytics & BI - Métricas en tiempo real"
    echo ""
    echo "🔧 Panel de Control:"
    echo "   http://localhost:3005/admin/integrations"
    echo ""
    echo "🌐 APIs disponibles:"
    echo "   http://localhost:3002/api/integrations/status"
    echo "   http://localhost:3002/api/integrations/logs"
    echo ""
    echo "📚 Documentación:"
    echo "   - 6 módulos de integración"
    echo "   - Control admin completo"
    echo "   - Monitoreo en tiempo real"
    echo "   - Logs centralizados"
    echo ""
    
else
    echo "❌ Error: Solo se crearon $TABLES_COUNT de 10 tablas"
    echo "💡 Revisa los logs de PostgreSQL para más detalles"
    exit 1
fi

echo "🚀 ¡Listo! El sistema de integraciones está operativo."