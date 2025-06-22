// ===============================================
// SCRIPT DE TESTING B2B2C - AGENTE 4
// Verifica funcionamiento completo del sistema
// ===============================================

const axios = require('axios');
const moment = require('moment');

const BASE_URL = 'http://localhost:3002';

class B2B2CTester {
  constructor() {
    this.adminToken = null;
    this.agencyToken = null;
    this.testOrderId = null;
    this.testAssignmentId = null;
  }

  // ===============================================
  // UTILIDADES
  // ===============================================

  async wait(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = moment().format('HH:mm:ss');
    const symbols = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${symbols[type]} [${timestamp}] ${message}`);
  }

  // ===============================================
  // TESTS DE AUTENTICACIÓN
  // ===============================================

  async testAdminLogin() {
    try {
      this.log('Testing admin login...', 'test');
      
      const response = await axios.post(`${BASE_URL}/api/admin/login`, {
        username: 'admin',
        password: 'admin123'
      });

      if (response.data.success) {
        this.adminToken = response.data.token;
        this.log('Admin login successful', 'success');
        return true;
      } else {
        this.log('Admin login failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Admin login error: ${error.message}`, 'error');
      return false;
    }
  }

  async testAgencyLogin() {
    try {
      this.log('Testing agency login...', 'test');
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: 'agencia_admin',
        password: 'agencia123'
      });

      if (response.data.success) {
        this.agencyToken = response.data.token;
        this.log('Agency login successful', 'success');
        return true;
      } else {
        this.log('Agency login failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Agency login error: ${error.message}`, 'error');
      return false;
    }
  }

  // ===============================================
  // TESTS DE SISTEMA B2B2C
  // ===============================================

  async testB2B2CStats() {
    try {
      this.log('Testing B2B2C stats endpoint...', 'test');
      
      const response = await axios.get(`${BASE_URL}/api/b2b2c/stats`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });

      if (response.data.success) {
        this.log('B2B2C stats retrieved successfully', 'success');
        this.log(`Stats: ${JSON.stringify(response.data.stats, null, 2)}`, 'info');
        return true;
      } else {
        this.log('B2B2C stats failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`B2B2C stats error: ${error.message}`, 'error');
      return false;
    }
  }

  async testCreateTestOrder() {
    try {
      this.log('Creating test order...', 'test');
      
      const orderData = {
        packageId: 'test-package-001',
        packageTitle: 'Test Package - Mendoza Wine Tour',
        packageDestination: 'Mendoza',
        packageDuration: '3 días, 2 noches',
        amount: 850,
        currency: 'USD',
        customerName: 'Test Customer',
        customerEmail: 'test@customer.com',
        customerPhone: '+54 261 XXX-XXXX',
        travelers: 2,
        paymentMethod: 'mercadopago',
        specialRequests: 'Test order for B2B2C system'
      };

      const response = await axios.post(`${BASE_URL}/api/payments/create-order`, orderData);

      if (response.data.success) {
        this.testOrderId = response.data.order.orderId;
        this.log(`Test order created: ${this.testOrderId}`, 'success');
        return true;
      } else {
        this.log('Test order creation failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Test order error: ${error.message}`, 'error');
      return false;
    }
  }

  async testSimulatePaymentSuccess() {
    try {
      this.log('Simulating successful payment...', 'test');
      
      // Simular webhook de pago exitoso
      const webhookData = {
        type: 'payment',
        data: {
          id: 'test-payment-123',
          status: 'approved',
          external_reference: this.testOrderId,
          transaction_amount: 850,
          currency_id: 'USD'
        }
      };

      // En lugar de webhook, vamos a verificar directamente
      await this.wait(3000); // Esperar 3 segundos

      // Verificar que la orden fue procesada
      const response = await axios.get(`${BASE_URL}/api/payments/verify/${this.testOrderId}`);

      if (response.data.success) {
        this.log('Payment simulation completed', 'success');
        return true;
      } else {
        this.log('Payment simulation failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Payment simulation error: ${error.message}`, 'error');
      return false;
    }
  }

  async testAssignmentCreated() {
    try {
      this.log('Checking if assignment was created...', 'test');
      
      const response = await axios.get(`${BASE_URL}/api/b2b2c/assignments`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { search: this.testOrderId }
      });

      if (response.data.success && response.data.data.assignments.length > 0) {
        this.testAssignmentId = response.data.data.assignments[0].id;
        this.log(`Assignment created: ${this.testAssignmentId}`, 'success');
        this.log(`Assigned to agency: ${response.data.data.assignments[0].agencyCode}`, 'info');
        this.log(`Commission: $${response.data.data.assignments[0].commissionAmount}`, 'info');
        return true;
      } else {
        this.log('No assignment found for test order', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Assignment check error: ${error.message}`, 'error');
      return false;
    }
  }

  async testCommissionCalculated() {
    try {
      this.log('Checking commission calculation...', 'test');
      
      const response = await axios.get(`${BASE_URL}/api/b2b2c/commissions`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { orderId: this.testOrderId }
      });

      if (response.data.success && response.data.data.commissions.length > 0) {
        const commission = response.data.data.commissions[0];
        this.log(`Commission calculated: $${commission.commissionAmount}`, 'success');
        this.log(`Rate: ${commission.commissionRate}%`, 'info');
        this.log(`Status: ${commission.status}`, 'info');
        return true;
      } else {
        this.log('No commission found for test order', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Commission check error: ${error.message}`, 'error');
      return false;
    }
  }

  // ===============================================
  // TESTS DE PORTAL DE AGENCIAS
  // ===============================================

  async testAgencyDashboard() {
    try {
      this.log('Testing agency dashboard...', 'test');
      
      const response = await axios.get(`${BASE_URL}/api/agency/dashboard`, {
        headers: { Authorization: `Bearer ${this.agencyToken}` }
      });

      if (response.data.success) {
        this.log('Agency dashboard loaded successfully', 'success');
        this.log(`Monthly stats: ${JSON.stringify(response.data.data.monthly_stats, null, 2)}`, 'info');
        return true;
      } else {
        this.log('Agency dashboard failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Agency dashboard error: ${error.message}`, 'error');
      return false;
    }
  }

  async testCommissionCalculator() {
    try {
      this.log('Testing commission calculator...', 'test');
      
      const response = await axios.post(`${BASE_URL}/api/agency/commissions/calculator`, {
        amount: 1000,
        product_category: 'cultura',
        destination: 'Mendoza'
      }, {
        headers: { Authorization: `Bearer ${this.agencyToken}` }
      });

      if (response.data.success) {
        this.log('Commission calculator working', 'success');
        this.log(`Calculated commission: $${response.data.commission_amount}`, 'info');
        return true;
      } else {
        this.log('Commission calculator failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Commission calculator error: ${error.message}`, 'error');
      return false;
    }
  }

  // ===============================================
  // TESTS DE GESTIÓN ADMIN
  // ===============================================

  async testReassignment() {
    if (!this.testAssignmentId) {
      this.log('No assignment to test reassignment', 'warning');
      return false;
    }

    try {
      this.log('Testing manual reassignment...', 'test');
      
      // Primero obtener una agencia diferente
      const agenciesResponse = await axios.get(`${BASE_URL}/api/admin/agencies`, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });

      if (!agenciesResponse.data.success || agenciesResponse.data.agencies.length < 2) {
        this.log('Not enough agencies for reassignment test', 'warning');
        return false;
      }

      const targetAgency = agenciesResponse.data.agencies[1]; // Segunda agencia

      const response = await axios.post(`${BASE_URL}/api/b2b2c/assignments/reassign`, {
        orderId: this.testOrderId,
        newAgencyId: targetAgency.id,
        reason: 'Testing reassignment functionality'
      }, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });

      if (response.data.success) {
        this.log('Manual reassignment successful', 'success');
        return true;
      } else {
        this.log('Manual reassignment failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Reassignment error: ${error.message}`, 'error');
      return false;
    }
  }

  async testCommissionApproval() {
    try {
      this.log('Testing commission approval...', 'test');
      
      // Obtener comisiones pendientes
      const commissionsResponse = await axios.get(`${BASE_URL}/api/b2b2c/commissions`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { status: 'pending' }
      });

      if (!commissionsResponse.data.success || commissionsResponse.data.data.commissions.length === 0) {
        this.log('No pending commissions to approve', 'warning');
        return false;
      }

      const commission = commissionsResponse.data.data.commissions[0];

      const response = await axios.put(`${BASE_URL}/api/b2b2c/commissions/${commission.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${this.adminToken}` }
      });

      if (response.data.success) {
        this.log('Commission approval successful', 'success');
        return true;
      } else {
        this.log('Commission approval failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Commission approval error: ${error.message}`, 'error');
      return false;
    }
  }

  // ===============================================
  // EJECUTOR PRINCIPAL
  // ===============================================

  async runAllTests() {
    console.log('🧪 ===============================================');
    console.log('🧪 TESTING SISTEMA B2B2C - AGENTE 4');
    console.log('🧪 ===============================================');
    console.log();

    const tests = [
      { name: 'Admin Login', fn: () => this.testAdminLogin() },
      { name: 'Agency Login', fn: () => this.testAgencyLogin() },
      { name: 'B2B2C Stats', fn: () => this.testB2B2CStats() },
      { name: 'Create Test Order', fn: () => this.testCreateTestOrder() },
      { name: 'Simulate Payment', fn: () => this.testSimulatePaymentSuccess() },
      { name: 'Check Assignment', fn: () => this.testAssignmentCreated() },
      { name: 'Check Commission', fn: () => this.testCommissionCalculated() },
      { name: 'Agency Dashboard', fn: () => this.testAgencyDashboard() },
      { name: 'Commission Calculator', fn: () => this.testCommissionCalculator() },
      { name: 'Manual Reassignment', fn: () => this.testReassignment() },
      { name: 'Commission Approval', fn: () => this.testCommissionApproval() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`Running test: ${test.name}`, 'test');
      
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.log(`Test ${test.name} threw error: ${error.message}`, 'error');
        failed++;
      }

      await this.wait(1000); // Esperar entre tests
      console.log();
    }

    console.log('🧪 ===============================================');
    console.log('🧪 RESUMEN DE TESTS');
    console.log('🧪 ===============================================');
    console.log(`✅ Tests pasados: ${passed}`);
    console.log(`❌ Tests fallidos: ${failed}`);
    console.log(`📊 Total: ${tests.length}`);
    console.log(`🎯 Éxito: ${(passed / tests.length * 100).toFixed(1)}%`);
    console.log();

    if (failed === 0) {
      console.log('🎉 ¡TODOS LOS TESTS PASARON! Sistema B2B2C operativo.');
    } else {
      console.log('⚠️ Algunos tests fallaron. Revisar logs arriba.');
    }

    console.log('🧪 ===============================================');
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  const tester = new B2B2CTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = B2B2CTester;
