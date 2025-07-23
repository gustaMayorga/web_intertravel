// ===============================================
// VERIFICACIÓN RÁPIDA PRE-DEPLOYMENT
// Chequeo de prerequisites y estado actual
// ===============================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();

class PreDeploymentCheck {
  constructor() {
    this.checks = {
      environment: false,
      database: false,
      files: false,
      ports: false,
      dependencies: false
    };
    
    this.issues = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const icons = {
      'info': 'ℹ️',
      'success': '✅', 
      'error': '❌',
      'warning': '⚠️',
      'check': '🔍'
    };
    
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  async checkEnvironmentVariables() {
    this.log('Verificando variables de entorno...', 'check');
    
    const requiredVars = [
      'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'JWT_SECRET', 'FRONTEND_PORT', 'BACKEND_PORT', 'APP_CLIENT_PORT'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.log(`Variables faltantes: ${missingVars.join(', ')}`, 'error');
      this.issues.push({
        type: 'environment',
        severity: 'critical',
        message: `Variables de entorno faltantes: ${missingVars.join(', ')}`,
        solution: 'Configurar archivo .env con todas las variables requeridas'
      });
      return false;
    }
    
    this.log('Variables de entorno OK', 'success');
    this.checks.environment = true;
    return true;
  }

  async checkDatabaseConnection() {
    this.log('Verificando conexión a PostgreSQL...', 'check');
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      await pool.end();
      
      this.log('Conexión PostgreSQL OK', 'success');
      this.checks.database = true;
      return true;
    } catch (error) {
      this.log(`Error conectando a PostgreSQL: ${error.message}`, 'error');
      this.issues.push({
        type: 'database',
        severity: 'critical',
        message: `No se puede conectar a PostgreSQL: ${error.message}`,
        solution: 'Verificar que PostgreSQL esté corriendo y las credenciales sean correctas'
      });
      return false;
    }
  }

  async checkCriticalFiles() {
    this.log('Verificando archivos críticos...', 'check');
    
    const criticalFiles = [
      'package.json',
      'backend/server.js',
      'frontend/package.json', 
      'app_cliete/package.json',
      'IMPLEMENTAR-SEO-COMPLETO.js',
      'IMPLEMENTAR-GA4-COMPLETO.js',
      'IMPLEMENTAR-ADMIN-USERS-COMPLETO.js'
    ];
    
    const missingFiles = [];
    
    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      this.log(`Archivos faltantes: ${missingFiles.join(', ')}`, 'error');
      this.issues.push({
        type: 'files',
        severity: 'critical',
        message: `Archivos críticos faltantes: ${missingFiles.join(', ')}`,
        solution: 'Asegurar que todos los archivos del proyecto estén presentes'
      });
      return false;
    }
    
    this.log('Archivos críticos OK', 'success');
    this.checks.files = true;
    return true;
  }

  async checkDependencies() {
    this.log('Verificando dependencias Node.js...', 'check');
    
    const directories = ['backend', 'frontend', 'app_cliete'];
    let allDependenciesOk = true;
    
    for (const dir of directories) {
      const nodeModulesPath = path.join(dir, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        this.log(`Dependencias faltantes en ${dir}`, 'warning');
        this.issues.push({
          type: 'dependencies',
          severity: 'warning',
          message: `Dependencias Node.js no instaladas en ${dir}`,
          solution: `Ejecutar 'cd ${dir} && npm install'`
        });
        allDependenciesOk = false;
      }
    }
    
    if (allDependenciesOk) {
      this.log('Dependencias Node.js OK', 'success');
      this.checks.dependencies = true;
    }
    
    return allDependenciesOk;
  }

  async runAllChecks() {
    console.log('==========================================');
    console.log('🔍 VERIFICACIÓN PRE-DEPLOYMENT INTERTRAVEL');
    console.log('==========================================\n');
    
    await this.checkEnvironmentVariables();
    await this.checkDatabaseConnection();
    await this.checkCriticalFiles();
    await this.checkDependencies();
    
    console.log('\n==========================================');
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('==========================================');
    
    Object.entries(this.checks).forEach(([check, status]) => {
      this.log(`${check.toUpperCase()}: ${status ? 'OK' : 'FALLO'}`, status ? 'success' : 'error');
    });
    
    if (this.issues.length > 0) {
      console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
      this.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        console.log(`   💡 Solución: ${issue.solution}`);
      });
    }
    
    const allChecksPass = Object.values(this.checks).every(check => check);
    
    if (allChecksPass) {
      console.log('\n🎉 SISTEMA LISTO PARA TESTING Y DEPLOYMENT');
      console.log('✅ Todos los prerequisites cumplidos');
      console.log('🚀 Proceder con testing completo');
    } else {
      console.log('\n⚠️ RESOLVER PROBLEMAS ANTES DE CONTINUAR');
      console.log('❌ Sistema no listo para deployment');
    }
    
    return allChecksPass;
  }
}

// Ejecutar verificación
if (require.main === module) {
  const checker = new PreDeploymentCheck();
  checker.runAllChecks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error en verificación:', error);
      process.exit(1);
    });
}

module.exports = PreDeploymentCheck;
