// ===============================================
// VERIFICACIÓN ESPECÍFICA BASE DE DATOS
// Testing conexión PostgreSQL y esquema completo
// ===============================================

const { Pool } = require('pg');
const fs = require('fs').promises;

class DatabaseVerifier {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'intertravel_prod',
      user: process.env.DB_USER || 'intertravel_user',
      password: process.env.DB_PASSWORD || 'intertravel_2025!',
    };
    
    this.pool = null;
    this.issues = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = {
      'info': '✅',
      'error': '❌', 
      'warning': '⚠️',
      'test': '🧪',
      'success': '🎉',
      'critical': '🚨'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  logIssue(severity, description, solution = null) {
    const issue = {
      id: this.issues.length + 1,
      timestamp: new Date().toISOString(),
      severity,
      component: 'Database',
      description,
      solution,
      status: 'open'
    };
    
    this.issues.push(issue);
    this.log(`ISSUE #${issue.id}: ${description}`, severity === 'critical' ? 'critical' : 'error');
    if (solution) {
      this.log(`  💡 Solución: ${solution}`, 'info');
    }
  }

  async connect() {
    try {
      this.log('Conectando a PostgreSQL...', 'test');
      this.pool = new Pool(this.dbConfig);
      
      // Test de conexión básica
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      client.release();
      
      this.log(`Conexión exitosa a PostgreSQL`, 'success');
      this.log(`Versión: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`, 'info');
      this.log(`Hora servidor: ${result.rows[0].current_time}`, 'info');
      
      return true;
    } catch (error) {
      this.logIssue('critical', 
        `No se puede conectar a PostgreSQL: ${error.message}`,
        'Verificar que PostgreSQL esté ejecutándose y las credenciales sean correctas'
      );
      return false;
    }
  }

  async verifyDatabase() {
    try {
      const client = await this.pool.connect();
      
      // Verificar que la base de datos correcta esté seleccionada
      const dbResult = await client.query('SELECT current_database() as db_name');
      const currentDb = dbResult.rows[0].db_name;
      
      if (currentDb !== this.dbConfig.database) {
        this.logIssue('high', 
          `Base de datos incorrecta: conectado a '${currentDb}', esperado '${this.dbConfig.database}'`,
          `Crear base de datos: CREATE DATABASE ${this.dbConfig.database};`
        );
        client.release();
        return false;
      }
      
      this.log(`Base de datos correcta: ${currentDb}`, 'success');
      client.release();
      return true;
    } catch (error) {
      this.logIssue('critical', 
        `Error verificando base de datos: ${error.message}`,
        'Verificar configuración de base de datos'
      );
      return false;
    }
  }

  async verifyTables() {
    try {
      const client = await this.pool.connect();
      
      // Lista de tablas esperadas
      const expectedTables = [
        'users', 'agencies', 'packages', 'bookings', 'passengers',
        'payments', 'reviews', 'system_config', 'priority_keywords',
        'activity_logs', 'user_sessions'
      ];
      
      // Verificar tablas existentes
      const tableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const existingTables = tableResult.rows.map(row => row.table_name);
      this.log(`Tablas encontradas: ${existingTables.length}`, 'info');
      
      // Verificar cada tabla esperada
      const missingTables = [];
      for (const table of expectedTables) {
        if (existingTables.includes(table)) {
          this.log(`Tabla ${table}: ✅ OK`, 'success');
        } else {
          missingTables.push(table);
          this.log(`Tabla ${table}: ❌ FALTANTE`, 'error');
        }
      }
      
      if (missingTables.length > 0) {
        this.logIssue('high',
          `Tablas faltantes: ${missingTables.join(', ')}`,
          'Ejecutar esquema_completo_intertravel.sql para crear tablas'
        );
      } else {
        this.log('Todas las tablas están presentes', 'success');
      }
      
      client.release();
      return missingTables.length === 0;
    } catch (error) {
      this.logIssue('critical',
        `Error verificando tablas: ${error.message}`,
        'Verificar permisos de usuario en base de datos'
      );
      return false;
    }
  }

  async verifyData() {
    try {
      const client = await this.pool.connect();
      
      // Verificar datos críticos
      const checks = [
        {
          name: 'Usuario Admin',
          query: "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
          expected: 'count > 0',
          solution: 'Ejecutar script para crear usuario admin'
        },
        {
          name: 'Agencias',
          query: "SELECT COUNT(*) as count FROM agencies WHERE is_active = true",
          expected: 'count > 0',
          solution: 'Insertar agencia por defecto'
        },
        {
          name: 'Configuración Sistema',
          query: "SELECT COUNT(*) as count FROM system_config",
          expected: 'count > 0',
          solution: 'Insertar configuraciones básicas del sistema'
        },
        {
          name: 'Keywords Priorización',
          query: "SELECT COUNT(*) as count FROM priority_keywords WHERE is_active = true",
          expected: 'count > 0',
          solution: 'Insertar keywords de priorización por defecto'
        }
      ];
      
      let allDataOk = true;
      
      for (const check of checks) {
        try {
          const result = await client.query(check.query);
          const count = parseInt(result.rows[0].count);
          
          if (count > 0) {
            this.log(`${check.name}: ${count} registros ✅`, 'success');
          } else {
            this.log(`${check.name}: Sin datos ❌`, 'warning');
            this.logIssue('medium',
              `No hay datos en ${check.name}`,
              check.solution
            );
            allDataOk = false;
          }
        } catch (error) {
          this.log(`${check.name}: Error - ${error.message} ❌`, 'error');
          allDataOk = false;
        }
      }
      
      client.release();
      return allDataOk;
    } catch (error) {
      this.logIssue('critical',
        `Error verificando datos: ${error.message}`,
        'Verificar estructura y contenido de tablas'
      );
      return false;
    }
  }

  async verifyPerformance() {
    try {
      const client = await this.pool.connect();
      
      // Test de performance básico
      const startTime = Date.now();
      
      const performanceTests = [
        "SELECT COUNT(*) FROM users",
        "SELECT COUNT(*) FROM packages WHERE is_active = true",
        "SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'",
        "SELECT u.email, COUNT(b.id) as booking_count FROM users u LEFT JOIN bookings b ON u.id = b.user_id GROUP BY u.id, u.email LIMIT 10"
      ];
      
      for (const [index, query] of performanceTests.entries()) {
        const queryStart = Date.now();
        await client.query(query);
        const queryTime = Date.now() - queryStart;
        
        if (queryTime < 100) {
          this.log(`Query ${index + 1}: ${queryTime}ms ✅`, 'success');
        } else if (queryTime < 500) {
          this.log(`Query ${index + 1}: ${queryTime}ms ⚠️`, 'warning');
        } else {
          this.log(`Query ${index + 1}: ${queryTime}ms ❌`, 'error');
          this.logIssue('medium',
            `Query lenta (${queryTime}ms): ${query.substring(0, 50)}...`,
            'Revisar índices y optimizar queries'
          );
        }
      }
      
      const totalTime = Date.now() - startTime;
      this.log(`Performance total: ${totalTime}ms`, totalTime < 1000 ? 'success' : 'warning');
      
      client.release();
      return totalTime < 2000; // Menos de 2 segundos para todas las queries
    } catch (error) {
      this.logIssue('medium',
        `Error en test de performance: ${error.message}`,
        'Verificar optimización de base de datos'
      );
      return false;
    }
  }

  async verifyIndexes() {
    try {
      const client = await this.pool.connect();
      
      // Verificar índices críticos
      const indexResult = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);
      
      const indexes = indexResult.rows;
      this.log(`Índices encontrados: ${indexes.length}`, 'info');
      
      // Verificar índices críticos específicos
      const criticalIndexes = [
        'idx_users_email',
        'idx_packages_package_id',
        'idx_bookings_reference',
        'idx_sessions_user_id'
      ];
      
      let indexesOk = true;
      for (const criticalIndex of criticalIndexes) {
        const found = indexes.some(idx => idx.indexname === criticalIndex);
        if (found) {
          this.log(`Índice ${criticalIndex}: ✅`, 'success');
        } else {
          this.log(`Índice ${criticalIndex}: ❌ FALTANTE`, 'warning');
          this.logIssue('low',
            `Índice crítico faltante: ${criticalIndex}`,
            'Ejecutar comandos CREATE INDEX para optimización'
          );
          indexesOk = false;
        }
      }
      
      client.release();
      return indexesOk;
    } catch (error) {
      this.logIssue('medium',
        `Error verificando índices: ${error.message}`,
        'Verificar estructura de índices'
      );
      return false;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      database_config: {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.database,
        user: this.dbConfig.user
      },
      verification_results: {
        connection: false,
        database: false,
        tables: false,
        data: false,
        performance: false,
        indexes: false
      },
      issues: this.issues,
      recommendations: []
    };

    // Ejecutar todas las verificaciones
    this.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE BASE DE DATOS', 'test');
    
    report.verification_results.connection = await this.connect();
    if (report.verification_results.connection) {
      report.verification_results.database = await this.verifyDatabase();
      report.verification_results.tables = await this.verifyTables();
      report.verification_results.data = await this.verifyData();
      report.verification_results.performance = await this.verifyPerformance();
      report.verification_results.indexes = await this.verifyIndexes();
    }

    // Generar recomendaciones
    if (this.issues.length === 0) {
      report.recommendations.push('✅ Base de datos completamente operativa');
    } else {
      report.recommendations.push('🔧 Resolver issues identificados antes de producción');
      
      const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
      const highIssues = this.issues.filter(i => i.severity === 'high').length;
      
      if (criticalIssues > 0) {
        report.recommendations.push('🚨 CRÍTICO: Resolver issues críticos inmediatamente');
      }
      if (highIssues > 0) {
        report.recommendations.push('⚠️ URGENTE: Resolver issues altos en < 24h');
      }
    }

    // Guardar reporte
    try {
      await fs.writeFile('database-verification-report.json', JSON.stringify(report, null, 2));
      this.log('Reporte guardado: database-verification-report.json', 'success');
    } catch (error) {
      this.log(`Error guardando reporte: ${error.message}`, 'error');
    }

    return report;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.log('Conexión a base de datos cerrada', 'info');
    }
  }

  printSummary(report) {
    console.log('\n📊 ===============================================');
    console.log('📊 RESUMEN VERIFICACIÓN BASE DE DATOS');
    console.log('📊 ===============================================');
    
    const results = report.verification_results;
    console.log(`🔗 Conexión: ${results.connection ? '✅ OK' : '❌ FAIL'}`);
    console.log(`🗄️ Base Datos: ${results.database ? '✅ OK' : '❌ FAIL'}`);
    console.log(`📋 Tablas: ${results.tables ? '✅ OK' : '❌ FAIL'}`);
    console.log(`📊 Datos: ${results.data ? '✅ OK' : '❌ FAIL'}`);
    console.log(`⚡ Performance: ${results.performance ? '✅ OK' : '❌ FAIL'}`);
    console.log(`🔍 Índices: ${results.indexes ? '✅ OK' : '❌ FAIL'}`);
    
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(r => r).length;
    const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
    
    console.log(`\n📈 Success Rate: ${successRate}% (${passedChecks}/${totalChecks})`);
    console.log(`🐛 Issues Encontrados: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🔧 ISSUES IDENTIFICADOS:');
      this.issues.forEach(issue => {
        const emoji = {
          'critical': '🚨',
          'high': '⚠️',
          'medium': '⚡',
          'low': '💡'
        }[issue.severity];
        console.log(`${emoji} #${issue.id}: ${issue.description}`);
        if (issue.solution) {
          console.log(`   💡 ${issue.solution}`);
        }
      });
    }
    
    console.log('\n📋 RECOMENDACIONES:');
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    
    console.log('\n📊 ===============================================');
  }
}

// Ejecución principal
async function main() {
  const verifier = new DatabaseVerifier();
  
  try {
    const report = await verifier.generateReport();
    verifier.printSummary(report);
    
    const allGood = Object.values(report.verification_results).every(r => r);
    process.exit(allGood ? 0 : 1);
  } catch (error) {
    console.error('💥 Error crítico en verificación:', error.message);
    process.exit(1);
  } finally {
    await verifier.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseVerifier };
