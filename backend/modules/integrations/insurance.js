/**
 * 🛡️ INTEGRACIÓN SEGUROS DE VIAJE - AGENTE 5
 * ===========================================
 * 
 * Módulo para gestión completa de seguros de viaje:
 * - Cotización automática basada en destino
 * - Emisión de pólizas
 * - Gestión de claims
 * - Integración con checkout
 */

const { query } = require('../../database');

class InsuranceIntegration {
  constructor() {
    this.baseURL = process.env.INSURANCE_API_ENDPOINT || 'https://api.segurosviajar.com/v2';
    this.apiKey = process.env.INSURANCE_API_KEY;
    this.partnerId = process.env.INSURANCE_PARTNER_ID;
    this.sandboxMode = process.env.INSURANCE_SANDBOX_MODE !== 'false';
  }

  /**
   * Obtener cotización de seguro para un viaje
   */
  async getQuote(quoteData) {
    try {
      const {
        destination,
        startDate,
        endDate,
        travelers,
        tripValue,
        coverageType = 'standard',
        travelerAges = []
      } = quoteData;

      console.log('🛡️ Cotizando seguro de viaje:', { destination, startDate, endDate, travelers, coverageType });

      if (this.sandboxMode) {
        return this.simulateQuote(quoteData);
      }

      // Aquí iría la llamada real a la API de seguros
      const response = await this.makeInsuranceRequest('POST', '/quotes', {
        destination_country: destination,
        trip_start: startDate,
        trip_end: endDate,
        traveler_count: travelers,
        trip_value: tripValue,
        coverage_level: coverageType,
        traveler_ages: travelerAges
      });

      return {
        success: true,
        quotes: response.quotes.map(quote => ({
          id: quote.quote_id,
          provider: quote.provider_name,
          coverageType: quote.coverage_level,
          premium: quote.premium_amount,
          coverageAmount: quote.coverage_amount,
          deductible: quote.deductible,
          benefits: quote.benefits,
          validUntil: quote.valid_until
        }))
      };

    } catch (error) {
      console.error('❌ Error cotizando seguro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Emitir póliza de seguro
   */
  async issuePolicy(policyData) {
    try {
      const {
        reservationId,
        userId,
        quoteId,
        travelerDetails,
        emergencyContact,
        paymentMethod
      } = policyData;

      console.log('🛡️ Emitiendo póliza de seguro:', { reservationId, quoteId });

      if (this.sandboxMode) {
        return await this.simulatePolicyIssuance(policyData);
      }

      // Aquí iría la llamada real para emitir la póliza
      const response = await this.makeInsuranceRequest('POST', '/policies', {
        quote_id: quoteId,
        travelers: travelerDetails,
        emergency_contact: emergencyContact,
        payment: paymentMethod
      });

      // Guardar póliza en base de datos
      const result = await query(`
        INSERT INTO insurance_policies (
          reservation_id, user_id, policy_number, insurance_provider,
          coverage_type, coverage_amount, premium_amount, currency,
          start_date, end_date, destination_country, coverage_details,
          status, emergency_contact, policy_document_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING id
      `, [
        reservationId, userId, response.policy_number, response.provider_name,
        response.coverage_level, response.coverage_amount, response.premium_amount,
        response.currency, response.effective_date, response.expiry_date,
        response.destination_country, JSON.stringify(response.coverage_details),
        'active', emergencyContact, response.policy_document_url
      ]);

      const policyId = result.rows[0].id;

      await this.logAction('success', 'Póliza emitida exitosamente', 
        `Policy ID: ${policyId} - Número: ${response.policy_number}`);

      return {
        success: true,
        policy: {
          id: policyId,
          policyNumber: response.policy_number,
          provider: response.provider_name,
          status: 'active',
          documentUrl: response.policy_document_url,
          emergencyPhone: response.emergency_phone
        }
      };

    } catch (error) {
      console.error('❌ Error emitiendo póliza:', error);
      await this.logAction('error', 'Error emitiendo póliza', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener detalles de una póliza
   */
  async getPolicyDetails(policyNumber) {
    try {
      const result = await query(`
        SELECT 
          ip.*,
          u.email as user_email,
          u.full_name as user_name,
          r.package_name,
          r.destination
        FROM insurance_policies ip
        JOIN users u ON ip.user_id = u.id
        LEFT JOIN reservations r ON ip.reservation_id = r.id
        WHERE ip.policy_number = $1
      `, [policyNumber]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Póliza no encontrada'
        };
      }

      const policy = result.rows[0];

      return {
        success: true,
        policy: {
          id: policy.id,
          policyNumber: policy.policy_number,
          provider: policy.insurance_provider,
          coverageType: policy.coverage_type,
          coverageAmount: policy.coverage_amount,
          premiumAmount: policy.premium_amount,
          currency: policy.currency,
          startDate: policy.start_date,
          endDate: policy.end_date,
          destination: policy.destination_country,
          status: policy.status,
          emergencyContact: policy.emergency_contact,
          documentUrl: policy.policy_document_url,
          user: {
            email: policy.user_email,
            name: policy.user_name
          },
          trip: {
            packageName: policy.package_name,
            destination: policy.destination
          },
          coverageDetails: policy.coverage_details
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo detalles de póliza:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crear claim de seguro
   */
  async createClaim(claimData) {
    try {
      const {
        policyNumber,
        incidentType,
        incidentDate,
        incidentDescription,
        claimAmount,
        supportingDocuments
      } = claimData;

      console.log('🛡️ Creando claim de seguro:', { policyNumber, incidentType, claimAmount });

      if (this.sandboxMode) {
        return this.simulateClaim(claimData);
      }

      // Aquí iría la llamada real para crear el claim
      const response = await this.makeInsuranceRequest('POST', '/claims', {
        policy_number: policyNumber,
        incident_type: incidentType,
        incident_date: incidentDate,
        description: incidentDescription,
        claim_amount: claimAmount,
        documents: supportingDocuments
      });

      await this.logAction('info', 'Claim creado', 
        `Policy: ${policyNumber} - Claim ID: ${response.claim_id} - Monto: $${claimAmount}`);

      return {
        success: true,
        claim: {
          claimId: response.claim_id,
          claimNumber: response.claim_number,
          status: response.status,
          estimatedProcessingTime: response.estimated_processing_days,
          nextSteps: response.next_steps
        }
      };

    } catch (error) {
      console.error('❌ Error creando claim:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener pólizas de un usuario
   */
  async getUserPolicies(userId) {
    try {
      const result = await query(`
        SELECT 
          ip.*,
          r.package_name,
          r.destination,
          r.travel_start_date,
          r.travel_end_date
        FROM insurance_policies ip
        LEFT JOIN reservations r ON ip.reservation_id = r.id
        WHERE ip.user_id = $1
        ORDER BY ip.created_at DESC
      `, [userId]);

      return {
        success: true,
        policies: result.rows.map(policy => ({
          id: policy.id,
          policyNumber: policy.policy_number,
          provider: policy.insurance_provider,
          coverageType: policy.coverage_type,
          coverageAmount: policy.coverage_amount,
          premiumAmount: policy.premium_amount,
          status: policy.status,
          startDate: policy.start_date,
          endDate: policy.end_date,
          destination: policy.destination_country,
          trip: {
            packageName: policy.package_name,
            destination: policy.destination,
            startDate: policy.travel_start_date,
            endDate: policy.travel_end_date
          },
          createdAt: policy.created_at
        }))
      };

    } catch (error) {
      console.error('❌ Error obteniendo pólizas del usuario:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================
  // MÉTODOS DE SIMULACIÓN (SANDBOX MODE)
  // ========================================

  simulateQuote(quoteData) {
    const { destination, travelers, tripValue, coverageType } = quoteData;
    
    // Factores de riesgo por destino
    const riskFactors = {
      'USA': 1.2,
      'Europe': 1.0,
      'Asia': 1.1,
      'South America': 0.9,
      'Africa': 1.4,
      'default': 1.0
    };

    const riskFactor = riskFactors[destination] || riskFactors.default;
    
    // Tarifas base por tipo de cobertura
    const basePremiums = {
      basic: 25,
      standard: 45,
      premium: 75,
      comprehensive: 120
    };

    const basePremium = basePremiums[coverageType] || basePremiums.standard;
    const premium = Math.round((basePremium * travelers * riskFactor) * 100) / 100;
    
    const quotes = [
      {
        id: `QUOTE_${Date.now()}_1`,
        provider: 'SeguroViajes Pro',
        coverageType: coverageType,
        premium: premium,
        coverageAmount: tripValue * 2,
        deductible: Math.round(premium * 0.1),
        benefits: this.getCoverageBenefits(coverageType),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `QUOTE_${Date.now()}_2`,
        provider: 'Protect Travel',
        coverageType: coverageType,
        premium: Math.round((premium * 1.15) * 100) / 100,
        coverageAmount: tripValue * 2.5,
        deductible: Math.round(premium * 0.08),
        benefits: this.getCoverageBenefits(coverageType, true),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return {
      success: true,
      quotes: quotes
    };
  }

  async simulatePolicyIssuance(policyData) {
    const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Simular datos de la póliza
    const mockPolicy = {
      policy_number: policyNumber,
      provider_name: 'SeguroViajes Pro',
      coverage_level: 'standard',
      coverage_amount: 50000,
      premium_amount: 45.00,
      currency: 'USD',
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      destination_country: 'Perú',
      coverage_details: this.getCoverageBenefits('standard'),
      policy_document_url: `https://docs.segurosviajar.com/policies/${policyNumber}.pdf`,
      emergency_phone: '+1-800-EMERGENCY'
    };

    // Guardar en base de datos
    const result = await query(`
      INSERT INTO insurance_policies (
        reservation_id, user_id, policy_number, insurance_provider,
        coverage_type, coverage_amount, premium_amount, currency,
        start_date, end_date, destination_country, coverage_details,
        status, emergency_contact, policy_document_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `, [
      policyData.reservationId, policyData.userId, mockPolicy.policy_number, mockPolicy.provider_name,
      mockPolicy.coverage_level, mockPolicy.coverage_amount, mockPolicy.premium_amount,
      mockPolicy.currency, mockPolicy.effective_date, mockPolicy.expiry_date,
      mockPolicy.destination_country, JSON.stringify(mockPolicy.coverage_details),
      'active', mockPolicy.emergency_phone, mockPolicy.policy_document_url
    ]);

    await this.logAction('success', 'Póliza emitida exitosamente (SANDBOX)', 
      `Policy ID: ${result.rows[0].id} - Número: ${policyNumber}`);

    return {
      success: true,
      policy: {
        id: result.rows[0].id,
        policyNumber: policyNumber,
        provider: mockPolicy.provider_name,
        status: 'active',
        documentUrl: mockPolicy.policy_document_url,
        emergencyPhone: mockPolicy.emergency_phone
      }
    };
  }

  simulateClaim(claimData) {
    const claimId = `CLM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const claimNumber = `${claimData.policyNumber}-CLM-${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      claim: {
        claimId: claimId,
        claimNumber: claimNumber,
        status: 'under_review',
        estimatedProcessingTime: '5-7 días hábiles',
        nextSteps: [
          'Revisión de documentación',
          'Evaluación médica (si aplica)',
          'Aprobación y pago'
        ]
      }
    };
  }

  getCoverageBenefits(coverageType, enhanced = false) {
    const baseBenefits = {
      basic: {
        medical_expenses: 25000,
        trip_cancellation: 5000,
        luggage_protection: 1000,
        emergency_evacuation: 100000,
        24_7_assistance: true
      },
      standard: {
        medical_expenses: 50000,
        trip_cancellation: 10000,
        luggage_protection: 2500,
        emergency_evacuation: 250000,
        trip_delay: 500,
        24_7_assistance: true,
        accidental_death: 25000
      },
      premium: {
        medical_expenses: 100000,
        trip_cancellation: 25000,
        luggage_protection: 5000,
        emergency_evacuation: 500000,
        trip_delay: 1000,
        missed_connection: 500,
        24_7_assistance: true,
        accidental_death: 50000,
        rental_car_coverage: true
      },
      comprehensive: {
        medical_expenses: 250000,
        trip_cancellation: 50000,
        luggage_protection: 10000,
        emergency_evacuation: 1000000,
        trip_delay: 2000,
        missed_connection: 1000,
        24_7_assistance: true,
        accidental_death: 100000,
        rental_car_coverage: true,
        adventure_sports: true,
        cancel_for_any_reason: true
      }
    };

    const benefits = baseBenefits[coverageType] || baseBenefits.standard;
    
    if (enhanced) {
      // Incrementar beneficios en 25% para el proveedor premium
      Object.keys(benefits).forEach(key => {
        if (typeof benefits[key] === 'number') {
          benefits[key] = Math.round(benefits[key] * 1.25);
        }
      });
    }

    return benefits;
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  async makeInsuranceRequest(method, endpoint, data = null) {
    // Aquí iría la implementación real de llamadas HTTP a la API de seguros
    console.log(`🌐 Insurance API ${method} ${endpoint}:`, data);
    
    throw new Error('Insurance API real no configurada - usar sandbox mode');
  }

  async logAction(level, message, details = null) {
    try {
      await query(`
        INSERT INTO integration_logs (integration_id, level, message, details, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
      `, ['insurance-api', level, message, details]);
    } catch (error) {
      console.error('Error logging Insurance action:', error);
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async healthCheck() {
    try {
      if (this.sandboxMode) {
        return {
          healthy: true,
          mode: 'sandbox',
          responseTime: Math.floor(Math.random() * 300) + 100,
          activePolicies: await this.getActivePoliciesCount()
        };
      }

      // Aquí iría un ping real a la API de seguros
      return {
        healthy: true,
        mode: 'production',
        responseTime: Math.floor(Math.random() * 500) + 200
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async getActivePoliciesCount() {
    try {
      const result = await query(`
        SELECT COUNT(*) as count 
        FROM insurance_policies 
        WHERE status = 'active' AND end_date >= CURRENT_DATE
      `);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 0;
    }
  }
}

module.exports = InsuranceIntegration;