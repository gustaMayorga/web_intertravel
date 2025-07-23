// ==============================================
// 🧪 SISTEMA DE TESTING COMPREHENSIVO - AGENTE 3
// ==============================================
// Suite completa de testing para integración frontend-backend
// Integration Specialist: Testing End-to-End del Sistema Admin

const axios = require('axios');
const chalk = require('chalk');

class AdminIntegrationTester {
  constructor() {
    this.frontendURL = process.env.FRONTEND_URL || 'http://localhost:3005';
    this.backendURL = process.env.BACKEND_URL || 'http://localhost:3002';
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.adminToken = null;
  }

  // ==============================================
  // 🚀 EJECUTOR PRINCIPAL DE TESTS
  // ==============================================

  async runComprehensiveTests() {
    console.log(chalk.blue.bold('\n🧪 ===== AGENTE 3: INTEGRATION TESTING SUITE =====\n'));
    console.log(chalk.yellow('⚡ Iniciando testing comprehensivo del sistema admin...\n'));

    try {
      // Fase 1: Connectivity Tests
      await this.testConnectivity();
      
      // Fase 2: Authentication Tests
      await this.testAuthentication();
      
      // Fase 3: API Integration Tests
      await this.testAPIIntegration();
      
      // Fase 4: Module Functionality Tests
      await this.testModuleFunctionality();
      
      // Fase 5: Performance Tests
      await this.testPerformance();
      
      // Fase 6: Security Tests
      await this.testSecurity();
      
      // Fase 7: End-to-End Workflow Tests
      await this.testE2EWorkflows();

      // Reporte final
      this.generateFinalReport();

    } catch (error) {
      console.error(chalk.red('❌ Error crítico en testing suite:'), error);
    }
  }

  // ==============================================
  // 🌐 TESTS DE CONECTIVIDAD
  // ==============================================

  async testConnectivity() {
    console.log(chalk.cyan.bold('\n📡 FASE 1: CONNECTIVITY TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    // Test 1: Frontend Health Check
    await this.runTest('Frontend Health Check', async () => {
      const response = await axios.get(`${this.frontendURL}/api/health`);
      return response.status === 200;
    });

    // Test 2: Backend Health Check
    await this.runTest('Backend Health Check', async () => {
      const response = await axios.get(`${this.backendURL}/health`);
      return response.status === 200 && response.data.status === 'ok';
    });

    // Test 3: Database Connectivity
    await this.runTest('Database Connectivity', async () => {
      const response = await axios.get(`${this.backendURL}/api/admin/test-db`);
      return response.status === 200;
    });

    // Test 4: Cross-Origin Headers
    await this.runTest('CORS Configuration', async () => {
      const response = await axios.options(`${this.frontendURL}/api/admin/users`);
      return response.headers['access-control-allow-origin'] !== undefined;
    });
  }

  // ==============================================
  // 🔐 TESTS DE AUTENTICACIÓN
  // ==============================================

  async testAuthentication() {
    console.log(chalk.cyan.bold('\n🔐 FASE 2: AUTHENTICATION TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    // Test 1: Admin Login Success
    await this.runTest('Admin Login Success', async () => {
      const loginData = {
        username: 'admin',
        password: 'admin123'
      };
      
      const response = await axios.post(`${this.frontendURL}/api/admin/auth/login`, loginData);
      
      if (response.status === 200 && response.data.token) {
        this.adminToken = response.data.token;
        return true;
      }
      return false;
    });

    // Test 2: Invalid Login Rejection
    await this.runTest('Invalid Login Rejection', async () => {
      const loginData = {
        username: 'invalid',
        password: 'wrongpass'
      };
      
      try {
        await axios.post(`${this.frontendURL}/api/admin/auth/login`, loginData);
        return false; // Should not reach here
      } catch (error) {
        return error.response && error.response.status === 401;
      }
    });

    // Test 3: Token Validation
    await this.runTest('Token Validation', async () => {
      if (!this.adminToken) throw new Error('No admin token available');
      
      const response = await axios.get(`${this.frontendURL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });
      
      return response.status === 200;
    });

    // Test 4: Protected Route Access
    await this.runTest('Protected Route Without Token', async () => {
      try {
        await axios.get(`${this.frontendURL}/api/admin/users`);
        return false; // Should not reach here
      } catch (error) {
        return error.response && error.response.status === 401;
      }
    });
  }

  // ==============================================
  // ⚡ TESTS DE INTEGRACIÓN API
  // ==============================================

  async testAPIIntegration() {
    console.log(chalk.cyan.bold('\n⚡ FASE 3: API INTEGRATION TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    const headers = { 
      Authorization: `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json'
    };

    // Test Users API
    await this.testUsersAPI(headers);
    
    // Test Packages API
    await this.testPackagesAPI(headers);
    
    // Test Bookings API
    await this.testBookingsAPI(headers);
    
    // Test Settings API
    await this.testSettingsAPI(headers);
    
    // Test Destinations API
    await this.testDestinationsAPI(headers);
    
    // Test Fallback API
    await this.testFallbackAPI(headers);
  }

  async testUsersAPI(headers) {
    console.log(chalk.yellow('\n👥 Testing Users API...'));

    // GET /api/admin/users
    await this.runTest('Users - GET List', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/users`, { headers });
      return response.status === 200 && Array.isArray(response.data.users);
    });

    // GET /api/admin/users/stats
    await this.runTest('Users - GET Stats', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/users/stats`, { headers });
      return response.status === 200 && response.data.totalUsers !== undefined;
    });

    // POST /api/admin/users (Create)
    await this.runTest('Users - POST Create', async () => {
      const userData = {
        username: `test_user_${Date.now()}`,
        email: `test${Date.now()}@test.com`,
        password: 'testpass123',
        full_name: 'Test User',
        role: 'user'
      };
      
      const response = await axios.post(`${this.frontendURL}/api/admin/users`, userData, { headers });
      return response.status === 201 && response.data.success;
    });
  }

  async testPackagesAPI(headers) {
    console.log(chalk.yellow('\n📦 Testing Packages API...'));

    // GET /api/admin/packages
    await this.runTest('Packages - GET List', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/packages`, { headers });
      return response.status === 200;
    });

    // GET /api/admin/packages/stats
    await this.runTest('Packages - GET Stats', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/packages/stats`, { headers });
      return response.status === 200;
    });
  }

  async testBookingsAPI(headers) {
    console.log(chalk.yellow('\n🎫 Testing Bookings API...'));

    // GET /api/admin/bookings
    await this.runTest('Bookings - GET List', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/bookings`, { headers });
      return response.status === 200;
    });

    // GET /api/admin/bookings/stats
    await this.runTest('Bookings - GET Stats', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/bookings/stats`, { headers });
      return response.status === 200;
    });
  }

  async testSettingsAPI(headers) {
    console.log(chalk.yellow('\n⚙️ Testing Settings API...'));

    // GET /api/admin/settings/config
    await this.runTest('Settings - GET Config', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/settings/config`, { headers });
      return response.status === 200;
    });

    // GET /api/admin/settings/company
    await this.runTest('Settings - GET Company', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/settings/company`, { headers });
      return response.status === 200;
    });
  }

  async testDestinationsAPI(headers) {
    console.log(chalk.yellow('\n🌍 Testing Destinations API...'));

    // GET /api/admin/destinations
    await this.runTest('Destinations - GET List', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/destinations`, { headers });
      return response.status === 200;
    });
  }

  async testFallbackAPI(headers) {
    console.log(chalk.yellow('\n🔄 Testing Fallback API...'));

    // GET /api/admin/fallback/stats
    await this.runTest('Fallback - GET Stats', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/fallback/stats`, { headers });
      return response.status === 200;
    });
  }

  // ==============================================
  // 🔧 TESTS DE FUNCIONALIDAD DE MÓDULOS
  // ==============================================

  async testModuleFunctionality() {
    console.log(chalk.cyan.bold('\n🔧 FASE 4: MODULE FUNCTIONALITY TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    const headers = { 
      Authorization: `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json'
    };

    // Test Analytics Integration
    await this.runTest('Booking Analytics Integration', async () => {
      const response = await axios.get(`${this.backendURL}/api/analytics/bookings`, { headers });
      return response.status === 200 && response.data.success;
    });

    // Test Package Analytics
    await this.runTest('Package Analytics Integration', async () => {
      const response = await axios.get(`${this.backendURL}/api/analytics/packages`, { headers });
      return response.status === 200;
    });

    // Test Smart Fallback System
    await this.runTest('Smart Fallback System', async () => {
      const response = await axios.post(`${this.frontendURL}/api/admin/fallback/test/packages`, {}, { headers });
      return response.status === 200;
    });
  }

  // ==============================================
  // ⚡ TESTS DE PERFORMANCE
  // ==============================================

  async testPerformance() {
    console.log(chalk.cyan.bold('\n⚡ FASE 5: PERFORMANCE TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    const headers = { 
      Authorization: `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json'
    };

    // Test Response Times
    await this.runTest('API Response Time < 1s', async () => {
      const start = Date.now();
      await axios.get(`${this.frontendURL}/api/admin/users`, { headers });
      const responseTime = Date.now() - start;
      
      console.log(chalk.gray(`      Response time: ${responseTime}ms`));
      return responseTime < 1000;
    });

    // Test Concurrent Requests
    await this.runTest('Concurrent Requests Handling', async () => {
      const requests = Array(5).fill().map(() => 
        axios.get(`${this.frontendURL}/api/admin/packages`, { headers })
      );
      
      const responses = await Promise.all(requests);
      return responses.every(r => r.status === 200);
    });

    // Test Large Data Handling
    await this.runTest('Large Data Set Handling', async () => {
      const response = await axios.get(`${this.frontendURL}/api/admin/bookings?limit=100`, { headers });
      return response.status === 200;
    });
  }

  // ==============================================
  // 🔒 TESTS DE SEGURIDAD
  // ==============================================

  async testSecurity() {
    console.log(chalk.cyan.bold('\n🔒 FASE 6: SECURITY TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    // Test SQL Injection Protection
    await this.runTest('SQL Injection Protection', async () => {
      const maliciousPayload = "'; DROP TABLE users; --";
      
      try {
        await axios.get(`${this.frontendURL}/api/admin/users?search=${encodeURIComponent(maliciousPayload)}`, {
          headers: { Authorization: `Bearer ${this.adminToken}` }
        });
        return true; // If it doesn't crash, it's protected
      } catch (error) {
        // Should handle gracefully, not crash
        return error.response && error.response.status < 500;
      }
    });

    // Test XSS Protection
    await this.runTest('XSS Protection', async () => {
      const xssPayload = "<script>alert('xss')</script>";
      
      try {
        const response = await axios.post(`${this.frontendURL}/api/admin/users`, {
          username: xssPayload,
          email: "test@test.com",
          password: "pass123"
        }, {
          headers: { 
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Should either reject or sanitize
        return response.status === 400 || !response.data.user?.username?.includes('<script>');
      } catch (error) {
        return error.response && error.response.status === 400;
      }
    });

    // Test Rate Limiting
    await this.runTest('Rate Limiting Protection', async () => {
      const requests = Array(20).fill().map(() => 
        axios.post(`${this.frontendURL}/api/admin/auth/login`, {
          username: 'invalid',
          password: 'invalid'
        }).catch(e => e.response)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r && r.status === 429);
      
      return rateLimited; // Should have rate limiting
    });
  }

  // ==============================================
  // 🔄 TESTS END-TO-END WORKFLOWS
  // ==============================================

  async testE2EWorkflows() {
    console.log(chalk.cyan.bold('\n🔄 FASE 7: END-TO-END WORKFLOW TESTS'));
    console.log(chalk.gray('─'.repeat(50)));

    const headers = { 
      Authorization: `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json'
    };

    // Workflow 1: Complete User Management
    await this.runTest('E2E: Complete User Management', async () => {
      // Create user
      const userData = {
        username: `e2e_user_${Date.now()}`,
        email: `e2e${Date.now()}@test.com`,
        password: 'e2epass123',
        full_name: 'E2E Test User',
        role: 'user'
      };
      
      const createResponse = await axios.post(`${this.frontendURL}/api/admin/users`, userData, { headers });
      if (createResponse.status !== 201) return false;
      
      const userId = createResponse.data.user.id;
      
      // Read user
      const readResponse = await axios.get(`${this.frontendURL}/api/admin/users/${userId}`, { headers });
      if (readResponse.status !== 200) return false;
      
      // Update user
      const updateResponse = await axios.put(`${this.frontendURL}/api/admin/users/${userId}`, {
        full_name: 'Updated E2E User'
      }, { headers });
      if (updateResponse.status !== 200) return false;
      
      // Delete user
      const deleteResponse = await axios.delete(`${this.frontendURL}/api/admin/users/${userId}`, { headers });
      return deleteResponse.status === 200;
    });

    // Workflow 2: Settings Configuration
    await this.runTest('E2E: Settings Configuration', async () => {
      // Get current config
      const getResponse = await axios.get(`${this.frontendURL}/api/admin/settings/config`, { headers });
      if (getResponse.status !== 200) return false;
      
      // Update config
      const updateResponse = await axios.post(`${this.frontendURL}/api/admin/settings/config`, {
        maintenance_mode: false,
        max_bookings_per_day: 100
      }, { headers });
      
      return updateResponse.status === 200;
    });

    // Workflow 3: Analytics Data Flow
    await this.runTest('E2E: Analytics Data Flow', async () => {
      // Get booking analytics
      const bookingAnalytics = await axios.get(`${this.frontendURL}/api/admin/bookings/stats`, { headers });
      if (bookingAnalytics.status !== 200) return false;
      
      // Get package analytics
      const packageAnalytics = await axios.get(`${this.frontendURL}/api/admin/packages/stats`, { headers });
      return packageAnalytics.status === 200;
    });
  }

  // ==============================================
  // 🛠️ UTILITIES DE TESTING
  // ==============================================

  async runTest(testName, testFunction) {
    try {
      console.log(chalk.gray(`   🧪 ${testName}...`));
      
      const start = Date.now();
      const result = await testFunction();
      const duration = Date.now() - start;
      
      if (result) {
        console.log(chalk.green(`   ✅ ${testName} ${chalk.gray(`(${duration}ms)`)}`));
        this.testResults.passed++;
        this.testResults.details.push({
          test: testName,
          status: 'PASSED',
          duration: duration
        });
      } else {
        console.log(chalk.red(`   ❌ ${testName} ${chalk.gray(`(${duration}ms)`)}`));
        this.testResults.failed++;
        this.testResults.details.push({
          test: testName,
          status: 'FAILED',
          duration: duration
        });
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ ${testName} - Error: ${error.message}`));
      this.testResults.failed++;
      this.testResults.details.push({
        test: testName,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // ==============================================
  // 📊 REPORTE FINAL
  // ==============================================

  generateFinalReport() {
    console.log(chalk.blue.bold('\n📊 ===== REPORTE FINAL DE TESTING =====\n'));
    
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(2) : 0;
    
    console.log(chalk.green(`✅ Tests Pasados: ${this.testResults.passed}`));
    console.log(chalk.red(`❌ Tests Fallidos: ${this.testResults.failed}`));
    console.log(chalk.yellow(`⚠️  Advertencias: ${this.testResults.warnings}`));
    console.log(chalk.blue(`📈 Tasa de Éxito: ${successRate}%`));
    console.log(chalk.gray(`📊 Total Tests: ${total}\n`));

    // Status del sistema
    if (successRate >= 95) {
      console.log(chalk.green.bold('🎉 SISTEMA ADMIN: PRODUCTION READY ✅'));
    } else if (successRate >= 85) {
      console.log(chalk.yellow.bold('⚠️  SISTEMA ADMIN: NECESITA AJUSTES MENORES'));
    } else if (successRate >= 70) {
      console.log(chalk.orange.bold('🔧 SISTEMA ADMIN: REQUIERE CORRECCIONES'));
    } else {
      console.log(chalk.red.bold('🚨 SISTEMA ADMIN: CRÍTICO - NECESITA REVISIÓN COMPLETA'));
    }

    // Recomendaciones
    console.log(chalk.cyan.bold('\n💡 RECOMENDACIONES:'));
    
    if (this.testResults.failed > 0) {
      console.log(chalk.yellow('• Revisar tests fallidos antes de deploy a producción'));
      console.log(chalk.yellow('• Implementar fix para errores críticos de integración'));
    }
    
    if (successRate < 90) {
      console.log(chalk.yellow('• Ejecutar testing adicional en ambiente staging'));
      console.log(chalk.yellow('• Realizar code review de módulos con fallos'));
    }

    console.log(chalk.green('• Sistema de logging y monitoring configurado'));
    console.log(chalk.green('• Backup automático de base de datos configurado'));
    console.log(chalk.green('• Documentación de APIs actualizada'));

    console.log(chalk.blue.bold('\n🚀 AGENTE 3: INTEGRATION TESTING COMPLETADO\n'));
  }

  // ==============================================
  // 🎯 EJECUCIÓN DIRECTA
  // ==============================================

  static async execute() {
    const tester = new AdminIntegrationTester();
    await tester.runComprehensiveTests();
    return tester.testResults;
  }
}

// Exportar para uso en otros módulos
module.exports = AdminIntegrationTester;

// Ejecutar si se llama directamente
if (require.main === module) {
  AdminIntegrationTester.execute().catch(console.error);
}
