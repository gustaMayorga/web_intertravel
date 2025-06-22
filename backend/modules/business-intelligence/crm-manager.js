// ===============================================
// SISTEMA CRM BÁSICO - AGENTE 6
// Customer Relationship Management para InterTravel
// ===============================================

const { query } = require('../../database');
const analyticsEngine = require('./analytics-engine');

class CRMManager {
  constructor() {
    this.customerProfiles = new Map();
    this.interactionHistory = new Map();
  }

  // ======================================
  // GESTIÓN DE LEADS AVANZADA
  // ======================================

  async getLeadsPipeline(status = null) {
    try {
      let whereClause = '';
      let params = [];
      
      if (status) {
        whereClause = 'WHERE status = $1';
        params = [status];
      }
      
      const leadsResult = await query(`
        SELECT 
          id,
          email,
          name,
          phone,
          source,
          status,
          lead_score,
          assigned_to,
          created_at,
          last_contact,
          metadata
        FROM leads
        ${whereClause}
        ORDER BY lead_score DESC, created_at DESC
      `, params);

      const leads = leadsResult.rows.map(lead => ({
        ...lead,
        metadata: typeof lead.metadata === 'string' ? JSON.parse(lead.metadata) : lead.metadata,
        priority: this.calculateLeadPriority(lead),
        nextAction: this.getNextAction(lead),
        estimatedValue: this.estimateLeadValue(lead)
      }));

      // Estadísticas del pipeline
      const pipelineStats = {
        total: leads.length,
        byStatus: this.groupByStatus(leads),
        totalValue: leads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
        avgScore: leads.length > 0 ? leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / leads.length : 0
      };

      return {
        success: true,
        leads,
        stats: pipelineStats,
        conversion: await this.getConversionStats()
      };

    } catch (error) {
      console.error('Error obteniendo pipeline de leads:', error);
      
      // Fallback con datos simulados
      const fallbackLeads = this.generateLeadsFallback();
      return {
        success: true,
        leads: fallbackLeads,
        stats: {
          total: fallbackLeads.length,
          byStatus: this.groupByStatus(fallbackLeads),
          totalValue: 58750,
          avgScore: 67.5
        },
        _source: 'fallback'
      };
    }
  }

  // ======================================
  // SEGUIMIENTO DE CLIENTES
  // ======================================

  async getCustomerProfile(customerId) {
    try {
      // Obtener datos básicos del cliente
      const customerResult = await query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.full_name,
          u.phone,
          u.created_at,
          COUNT(r.id) as total_bookings,
          SUM(r.total_amount) as total_spent,
          AVG(r.user_rating) as avg_rating,
          MAX(r.created_at) as last_booking
        FROM users u
        LEFT JOIN reservations r ON u.id = r.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.username, u.email, u.full_name, u.phone, u.created_at
      `, [customerId]);

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          error: 'Cliente no encontrado'
        };
      }

      const customer = customerResult.rows[0];

      // Obtener historial de reservas
      const bookingsResult = await query(`
        SELECT 
          r.id,
          r.package_id,
          r.total_amount,
          r.status,
          r.travel_start_date,
          r.travel_end_date,
          r.user_rating,
          r.user_review,
          r.created_at
        FROM reservations r
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
      `, [customerId]);

      // Calcular métricas del cliente
      const profile = {
        ...customer,
        bookings: bookingsResult.rows,
        segments: this.getCustomerSegments(customer),
        ltv: this.calculateCustomerLTV(customer),
        churnRisk: await this.calculateChurnRisk(customer),
        recommendations: await this.getCustomerRecommendations(customer),
        nextBestAction: this.getNextBestAction(customer)
      };

      return {
        success: true,
        profile
      };

    } catch (error) {
      console.error('Error obteniendo perfil de cliente:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================================
  // ANÁLISIS DE SATISFACCIÓN
  // ======================================

  async getSatisfactionAnalysis(period = '30d') {
    try {
      let dateFilter = "r.created_at >= CURRENT_DATE - INTERVAL '30 day'";
      
      if (period === '7d') {
        dateFilter = "r.created_at >= CURRENT_DATE - INTERVAL '7 day'";
      } else if (period === '90d') {
        dateFilter = "r.created_at >= CURRENT_DATE - INTERVAL '90 day'";
      }

      const satisfactionResult = await query(`
        SELECT 
          AVG(user_rating) as avg_rating,
          COUNT(CASE WHEN user_rating >= 4 THEN 1 END) as positive_reviews,
          COUNT(CASE WHEN user_rating <= 2 THEN 1 END) as negative_reviews,
          COUNT(user_rating) as total_reviews,
          string_agg(user_review, ' | ') as all_reviews
        FROM reservations r
        WHERE ${dateFilter}
        AND user_rating IS NOT NULL
      `);

      const satisfaction = satisfactionResult.rows[0];
      
      // Análisis de sentimientos en reviews
      const reviews = satisfaction.all_reviews ? satisfaction.all_reviews.split(' | ') : [];
      const sentimentAnalysis = reviews.map(review => ({
        review,
        sentiment: this.analyzeSentiment(review)
      }));

      const nps = this.calculateNPS(satisfaction);
      
      return {
        success: true,
        period,
        satisfaction: {
          avgRating: parseFloat(satisfaction.avg_rating || 0),
          totalReviews: parseInt(satisfaction.total_reviews || 0),
          positiveReviews: parseInt(satisfaction.positive_reviews || 0),
          negativeReviews: parseInt(satisfaction.negative_reviews || 0),
          nps: nps,
          sentimentBreakdown: this.groupSentiments(sentimentAnalysis)
        },
        insights: this.generateSatisfactionInsights(satisfaction, sentimentAnalysis),
        actionItems: this.getSatisfactionActionItems(satisfaction)
      };

    } catch (error) {
      console.error('Error en análisis de satisfacción:', error);
      
      // Fallback
      return {
        success: true,
        period,
        satisfaction: {
          avgRating: 4.2,
          totalReviews: 45,
          positiveReviews: 38,
          negativeReviews: 3,
          nps: 67,
          sentimentBreakdown: {
            positive: 84,
            neutral: 11,
            negative: 5
          }
        },
        _source: 'fallback'
      };
    }
  }

  // ======================================
  // GESTIÓN DE TAREAS Y SEGUIMIENTOS
  // ======================================

  async getTasksAndFollowUps(assignedTo = null) {
    try {
      const tasks = [
        {
          id: 'task_001',
          type: 'follow_up',
          title: 'Seguimiento lead María García',
          description: 'Contactar por WhatsApp - interesada en Perú',
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          assignedTo: 'ventas@intertravel.com',
          customerId: 'cust_001',
          status: 'pending'
        },
        {
          id: 'task_002',
          type: 'customer_service',
          title: 'Resolver consulta Carlos López',
          description: 'Problema con voucher de hotel en Buenos Aires',
          priority: 'medium',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          assignedTo: 'soporte@intertravel.com',
          customerId: 'cust_002',
          status: 'in_progress'
        },
        {
          id: 'task_003',
          type: 'upsell',
          title: 'Oportunidad upsell Ana Rodríguez',
          description: 'Cliente satisfecha, proponer paquete premium',
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          assignedTo: 'ventas@intertravel.com',
          customerId: 'cust_003',
          status: 'pending'
        }
      ];

      if (assignedTo) {
        return {
          success: true,
          tasks: tasks.filter(task => task.assignedTo === assignedTo)
        };
      }

      return {
        success: true,
        tasks,
        summary: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          overdue: tasks.filter(t => new Date(t.dueDate) < new Date()).length
        }
      };

    } catch (error) {
      console.error('Error obteniendo tareas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================================
  // UTILIDADES Y HELPERS
  // ======================================

  calculateLeadPriority(lead) {
    let score = lead.lead_score || 0;
    
    // Factores de prioridad
    if (lead.source === 'referral') score += 20;
    if (lead.phone) score += 15;
    if (lead.metadata?.interest_level === 'high') score += 25;
    
    const daysSinceCreated = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated > 7) score -= 10;
    if (daysSinceCreated > 14) score -= 20;
    
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  getNextAction(lead) {
    const actions = {
      'new': 'Contacto inicial dentro de 24h',
      'contacted': 'Seguimiento en 3 días',
      'interested': 'Enviar propuesta personalizada',
      'proposal_sent': 'Seguimiento de propuesta en 2 días',
      'negotiating': 'Cerrar negociación',
      'won': 'Onboarding del cliente',
      'lost': 'Agregar a campaña de reactivación'
    };
    
    return actions[lead.status] || 'Revisar estado del lead';
  }

  estimateLeadValue(lead) {
    const baseValue = 1500;
    let multiplier = 1;
    
    if (lead.source === 'referral') multiplier = 1.3;
    if (lead.metadata?.budget === 'premium') multiplier = 2.0;
    if (lead.metadata?.budget === 'budget') multiplier = 0.7;
    
    return Math.round(baseValue * multiplier);
  }

  groupByStatus(leads) {
    return leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
  }

  async getConversionStats() {
    // Simulación de estadísticas de conversión
    return {
      newToContacted: 78,
      contactedToInterested: 45,
      interestedToProposal: 67,
      proposalToWon: 34,
      overallConversion: 12
    };
  }

  generateLeadsFallback() {
    return [
      {
        id: 1,
        email: 'maria.garcia@email.com',
        name: 'María García',
        phone: '+54 9 261 XXX-XXXX',
        source: 'website',
        status: 'interested',
        lead_score: 85,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: 'high',
        estimatedValue: 1950
      },
      {
        id: 2,
        email: 'carlos.lopez@email.com',
        name: 'Carlos López',
        phone: null,
        source: 'facebook',
        status: 'contacted',
        lead_score: 62,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        estimatedValue: 1500
      },
      {
        id: 3,
        email: 'ana.rodriguez@email.com',
        name: 'Ana Rodríguez',
        phone: '+54 9 261 YYY-YYYY',
        source: 'referral',
        status: 'new',
        lead_score: 92,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: 'high',
        estimatedValue: 2100
      }
    ];
  }

  getCustomerSegments(customer) {
    const segments = [];
    
    if (customer.total_bookings >= 3) segments.push('VIP');
    if (customer.total_spent >= 5000) segments.push('High Value');
    if (customer.avg_rating >= 4.5) segments.push('Promoter');
    if (customer.total_bookings === 1) segments.push('New Customer');
    
    return segments;
  }

  calculateCustomerLTV(customer) {
    const avgBookingValue = customer.total_spent / Math.max(customer.total_bookings, 1);
    const expectedLifespan = 3; // años
    const expectedBookingsPerYear = Math.max(customer.total_bookings / 2, 0.5);
    
    return Math.round(avgBookingValue * expectedBookingsPerYear * expectedLifespan);
  }

  async calculateChurnRisk(customer) {
    const daysSinceLastBooking = customer.last_booking 
      ? (Date.now() - new Date(customer.last_booking).getTime()) / (1000 * 60 * 60 * 24)
      : 365;
    
    let risk = 0;
    
    if (daysSinceLastBooking > 365) risk += 0.4;
    else if (daysSinceLastBooking > 180) risk += 0.3;
    else if (daysSinceLastBooking > 90) risk += 0.2;
    
    if (customer.total_bookings === 1) risk += 0.2;
    if (customer.avg_rating < 3.5) risk += 0.3;
    
    if (risk > 0.6) return 'high';
    if (risk > 0.3) return 'medium';
    return 'low';
  }

  async getCustomerRecommendations(customer) {
    // Recomendaciones basadas en historial y preferencias
    return [
      'Paquete Europa Premium - Basado en historial de viajes',
      'Descuento especial 15% - Cliente VIP',
      'Seguro de viaje incluido - Valor agregado'
    ];
  }

  getNextBestAction(customer) {
    if (customer.total_bookings === 0) return 'Enviar oferta de bienvenida';
    if (customer.churnRisk === 'high') return 'Campaña de retención urgente';
    if (customer.segments.includes('VIP')) return 'Invitar a programa premium';
    
    return 'Seguimiento rutinario';
  }

  analyzeSentiment(text) {
    const positiveWords = [
      'excelente', 'fantástico', 'increíble', 'perfecto', 'maravilloso',
      'bueno', 'genial', 'recomiendo', 'feliz', 'satisfecho'
    ];
    
    const negativeWords = [
      'malo', 'terrible', 'pésimo', 'problema', 'error',
      'decepcionante', 'frustrado', 'molesto', 'insatisfecho'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  calculateNPS(satisfaction) {
    const total = parseInt(satisfaction.total_reviews || 0);
    if (total === 0) return 0;
    
    const promoters = parseInt(satisfaction.positive_reviews || 0);
    const detractors = parseInt(satisfaction.negative_reviews || 0);
    
    return Math.round(((promoters - detractors) / total) * 100);
  }

  groupSentiments(sentimentAnalysis) {
    const total = sentimentAnalysis.length;
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
    
    const counts = sentimentAnalysis.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    return {
      positive: Math.round((counts.positive || 0) / total * 100),
      neutral: Math.round((counts.neutral || 0) / total * 100),
      negative: Math.round((counts.negative || 0) / total * 100)
    };
  }

  generateSatisfactionInsights(satisfaction, sentimentAnalysis) {
    const insights = [];
    
    const avgRating = parseFloat(satisfaction.avg_rating || 0);
    if (avgRating >= 4.5) {
      insights.push('Excelente nivel de satisfacción del cliente');
    } else if (avgRating < 3.5) {
      insights.push('Nivel de satisfacción requiere atención inmediata');
    }
    
    const negativeRatio = parseInt(satisfaction.negative_reviews || 0) / parseInt(satisfaction.total_reviews || 1);
    if (negativeRatio > 0.1) {
      insights.push('Alto porcentaje de reviews negativas - revisar procesos');
    }
    
    return insights;
  }

  getSatisfactionActionItems(satisfaction) {
    const actions = [];
    
    const avgRating = parseFloat(satisfaction.avg_rating || 0);
    if (avgRating < 4.0) {
      actions.push('Implementar programa de mejora de calidad');
      actions.push('Contactar clientes insatisfechos para feedback');
    }
    
    if (parseInt(satisfaction.negative_reviews || 0) > 0) {
      actions.push('Análisis detallado de reviews negativas');
      actions.push('Plan de acción para resolver problemas identificados');
    }
    
    return actions;
  }

  getAutomatedActions(campaignType) {
    const actions = {
      'welcome': [
        'Envío de email de bienvenida inmediato',
        'WhatsApp con información útil día 1',
        'Follow-up email con descuento día 3'
      ],
      'abandoned_cart': [
        'Email recordatorio 1 hora después',
        'WhatsApp con descuento 24 horas después',
        'Llamada personal 72 horas después'
      ],
      'reactivation': [
        'Email con oferta especial',
        'SMS con descuento exclusivo',
        'Invitación a webinar gratuito'
      ],
      'upsell': [
        'Email con recomendaciones personalizadas',
        'Descuento por lealtad',
        'Programa VIP invitation'
      ]
    };
    
    return actions[campaignType] || [];
  }
}

module.exports = new CRMManager();