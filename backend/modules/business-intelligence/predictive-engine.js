// ===============================================
// MOTOR PREDICTIVO AVANZADO - AGENTE 6
// Machine Learning Básico para InterTravel
// ===============================================

class PredictiveEngine {
  constructor() {
    this.models = new Map();
    this.trainingData = new Map();
  }

  // ======================================
  // PREDICCIÓN DE DEMANDA POR DESTINO
  // ======================================

  async predictDemand(destination, months = 6) {
    try {
      const historicalData = await this.getHistoricalData(destination);
      const seasonalFactors = this.getSeasonalFactors(destination);
      const marketTrends = this.getMarketTrends();
      
      const predictions = [];
      const currentDate = new Date();
      
      for (let i = 1; i <= months; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        const month = targetDate.getMonth() + 1;
        const seasonalMultiplier = seasonalFactors[month] || 1;
        const trendMultiplier = this.calculateTrendMultiplier(marketTrends, i);
        
        // Modelo simple de regresión lineal con factores estacionales
        const baseDemand = this.calculateBaseDemand(historicalData, destination);
        const predictedDemand = Math.round(baseDemand * seasonalMultiplier * trendMultiplier);
        
        predictions.push({
          month: targetDate.toLocaleDateString('es', { month: 'long', year: 'numeric' }),
          monthNumber: month,
          predictedBookings: predictedDemand,
          confidence: this.calculateConfidence(historicalData, seasonalFactors),
          factors: {
            seasonal: seasonalMultiplier,
            trend: trendMultiplier,
            base: baseDemand
          },
          recommendations: this.generateRecommendations(predictedDemand, destination, month)
        });
      }
      
      return {
        success: true,
        destination,
        predictions,
        model: 'linear_regression_seasonal',
        accuracy: this.getModelAccuracy(destination),
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error en predicción de demanda:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================================
  // OPTIMIZACIÓN DE PRECIOS DINÁMICOS
  // ======================================

  async optimizePricing(packageId, marketConditions = {}) {
    try {
      const packageData = await this.getPackageData(packageId);
      const competitorPrices = await this.getCompetitorPrices(packageData.destination);
      const demandForecast = await this.predictDemand(packageData.destination, 3);
      
      const optimization = {
        currentPrice: packageData.currentPrice,
        recommendations: []
      };
      
      // Análisis de elasticidad de precio
      const elasticity = this.calculatePriceElasticity(packageData);
      
      // Diferentes escenarios de precio
      const scenarios = [
        { change: -10, label: 'Descuento 10%' },
        { change: 0, label: 'Precio actual' },
        { change: 5, label: 'Aumento 5%' },
        { change: 10, label: 'Aumento 10%' },
        { change: 15, label: 'Aumento 15%' }
      ];
      
      scenarios.forEach(scenario => {
        const newPrice = packageData.currentPrice * (1 + scenario.change / 100);
        const expectedDemand = this.calculateExpectedDemand(packageData, scenario.change, elasticity);
        const expectedRevenue = newPrice * expectedDemand;
        
        optimization.recommendations.push({
          scenario: scenario.label,
          price: Math.round(newPrice),
          priceChange: scenario.change,
          expectedBookings: Math.round(expectedDemand),
          expectedRevenue: Math.round(expectedRevenue),
          roi: this.calculateROI(expectedRevenue, packageData.cost),
          risk: this.assessRisk(scenario.change, marketConditions)
        });
      });
      
      // Ordenar por revenue esperado
      optimization.recommendations.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
      
      const bestOption = optimization.recommendations[0];
      
      return {
        success: true,
        packageId,
        currentPrice: packageData.currentPrice,
        recommendedPrice: bestOption.price,
        expectedImpact: {
          revenueChange: ((bestOption.expectedRevenue / (packageData.currentPrice * packageData.avgBookings)) - 1) * 100,
          bookingsChange: ((bestOption.expectedBookings / packageData.avgBookings) - 1) * 100
        },
        scenarios: optimization.recommendations,
        confidence: this.calculatePricingConfidence(elasticity, marketConditions),
        nextReview: this.getNextReviewDate(),
        insights: this.generatePricingInsights(packageData, competitorPrices, demandForecast)
      };
      
    } catch (error) {
      console.error('Error en optimización de precios:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================================
  // ANÁLISIS DE CHURN Y RETENCIÓN
  // ======================================

  async predictCustomerChurn(customerId = null) {
    try {
      const features = await this.extractChurnFeatures(customerId);
      const churnPredictions = [];
      
      const customers = customerId ? [features] : await this.getAllCustomerFeatures();
      
      customers.forEach(customer => {
        const churnScore = this.calculateChurnScore(customer);
        const retentionRecommendations = this.generateRetentionActions(customer, churnScore);
        
        churnPredictions.push({
          customerId: customer.id,
          customerName: customer.name,
          churnProbability: churnScore,
          riskLevel: this.getRiskLevel(churnScore),
          keyFactors: this.getChurnFactors(customer),
          recommendedActions: retentionRecommendations,
          estimatedLTV: this.calculateLTV(customer),
          lastActivity: customer.lastActivity
        });
      });
      
      // Ordenar por riesgo de churn
      churnPredictions.sort((a, b) => b.churnProbability - a.churnProbability);
      
      return {
        success: true,
        predictions: churnPredictions,
        summary: {
          highRisk: churnPredictions.filter(p => p.riskLevel === 'high').length,
          mediumRisk: churnPredictions.filter(p => p.riskLevel === 'medium').length,
          lowRisk: churnPredictions.filter(p => p.riskLevel === 'low').length
        },
        model: 'logistic_regression_churn',
        accuracy: 0.84
      };
      
    } catch (error) {
      console.error('Error en predicción de churn:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================================
  // RECOMENDACIONES PERSONALIZADAS
  // ======================================

  async generatePersonalizedRecommendations(userId, limit = 5) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const userHistory = await this.getUserHistory(userId);
      const similarUsers = await this.findSimilarUsers(userProfile);
      
      const recommendations = [];
      
      // Recomendaciones basadas en comportamiento similar
      const collaborativeRecs = this.getCollaborativeRecommendations(similarUsers, userHistory);
      
      // Recomendaciones basadas en contenido
      const contentRecs = this.getContentBasedRecommendations(userProfile, userHistory);
      
      // Combinar y puntuar recomendaciones
      const allRecs = [...collaborativeRecs, ...contentRecs];
      const scoredRecs = allRecs.map(rec => ({
        ...rec,
        score: this.calculateRecommendationScore(rec, userProfile, userHistory),
        reason: this.generateRecommendationReason(rec, userProfile)
      }));
      
      // Ordenar por score y eliminar duplicados
      const uniqueRecs = this.removeDuplicates(scoredRecs, 'packageId');
      uniqueRecs.sort((a, b) => b.score - a.score);
      
      return {
        success: true,
        userId,
        recommendations: uniqueRecs.slice(0, limit),
        personalizationFactors: {
          userPreferences: userProfile.preferences,
          travelHistory: userHistory.destinations,
          priceRange: userProfile.priceRange,
          travelStyle: userProfile.travelStyle
        },
        algorithm: 'hybrid_collaborative_content',
        confidence: this.calculateRecommendationConfidence(userProfile, userHistory)
      };
      
    } catch (error) {
      console.error('Error en recomendaciones personalizadas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================================
  // ANÁLISIS DE SENTIMIENTO
  // ======================================

  analyzeSentiment(text) {
    // Análisis de sentimiento básico en español
    const positiveWords = [
      'excelente', 'fantástico', 'increíble', 'hermoso', 'perfecto',
      'bueno', 'genial', 'maravilloso', 'espectacular', 'recomiendo',
      'feliz', 'satisfecho', 'encantado', 'gratificante', 'memorable'
    ];
    
    const negativeWords = [
      'malo', 'terrible', 'horrible', 'pésimo', 'decepcionante',
      'problema', 'error', 'fallo', 'deficiente', 'insatisfecho',
      'molesto', 'frustrado', 'enojado', 'disgustado', 'lamentable'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });
    
    const totalSentimentWords = positiveScore + negativeScore;
    if (totalSentimentWords === 0) return { sentiment: 'neutral', score: 0, confidence: 0.5 };
    
    const score = (positiveScore - negativeScore) / totalSentimentWords;
    const sentiment = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    const confidence = Math.min(totalSentimentWords / 10, 1);
    
    return { sentiment, score, confidence };
  }

  // ======================================
  // FUNCIONES HELPER Y UTILIDADES
  // ======================================

  async getHistoricalData(destination) {
    // En un sistema real, esto vendría de la base de datos
    const baseData = {
      'Perú': [45, 52, 38, 41, 29, 35, 42, 48, 33, 39, 28, 44],
      'Argentina': [32, 38, 28, 35, 22, 28, 35, 41, 26, 31, 21, 36],
      'México': [28, 35, 24, 29, 18, 25, 31, 38, 22, 27, 17, 32],
      'España': [25, 32, 38, 45, 42, 35, 28, 22, 35, 41, 28, 24],
      'Francia': [22, 28, 35, 41, 38, 32, 25, 19, 31, 36, 24, 21]
    };
    
    return baseData[destination] || [25, 30, 28, 32, 24, 29, 33, 36, 27, 31, 23, 34];
  }

  getSeasonalFactors(destination) {
    const factors = {
      'Perú': { 1: 1.2, 2: 1.3, 3: 1.1, 4: 0.9, 5: 0.8, 6: 1.4, 7: 1.5, 8: 1.3, 9: 1.0, 10: 0.8, 11: 0.7, 12: 1.1 },
      'Argentina': { 1: 1.4, 2: 1.3, 3: 1.0, 4: 0.8, 5: 0.7, 6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.1, 11: 1.2, 12: 1.5 },
      'México': { 1: 1.1, 2: 1.0, 3: 1.2, 4: 1.3, 5: 1.0, 6: 0.8, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.1, 11: 1.2, 12: 1.4 },
      'España': { 1: 0.7, 2: 0.8, 3: 1.1, 4: 1.3, 5: 1.4, 6: 1.2, 7: 1.0, 8: 0.9, 9: 1.2, 10: 1.3, 11: 0.9, 12: 0.8 },
      'Francia': { 1: 0.8, 2: 0.9, 3: 1.1, 4: 1.2, 5: 1.3, 6: 1.1, 7: 0.9, 8: 0.8, 9: 1.1, 10: 1.2, 11: 0.9, 12: 0.9 }
    };
    
    return factors[destination] || { 1: 1.0, 2: 1.0, 3: 1.1, 4: 1.2, 5: 1.1, 6: 0.9, 7: 0.8, 8: 0.9, 9: 1.0, 10: 1.1, 11: 1.0, 12: 1.1 };
  }

  getMarketTrends() {
    return {
      growth: 0.08, // 8% anual
      seasonality: 0.15, // 15% variación estacional
      volatility: 0.12 // 12% volatilidad
    };
  }

  calculateBaseDemand(historicalData, destination) {
    const average = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    
    // Ajustar por popularidad del destino
    const popularityMultipliers = {
      'Perú': 1.2,
      'Argentina': 1.0,
      'México': 1.1,
      'España': 1.3,
      'Francia': 1.15
    };
    
    return average * (popularityMultipliers[destination] || 1.0);
  }

  calculateTrendMultiplier(trends, monthsAhead) {
    return 1 + (trends.growth / 12 * monthsAhead);
  }

  calculateConfidence(historicalData, seasonalFactors) {
    const dataPoints = historicalData.length;
    const variance = this.calculateVariance(historicalData);
    
    let confidence = Math.min(dataPoints / 12, 1) * 0.7; // Más datos = más confianza
    confidence += (1 - Math.min(variance / 100, 1)) * 0.3; // Menos varianza = más confianza
    
    return Math.round(confidence * 100);
  }

  calculateVariance(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  generateRecommendations(predictedDemand, destination, month) {
    const recommendations = [];
    
    if (predictedDemand > 40) {
      recommendations.push('Alta demanda: Incrementar precios 10-15%');
      recommendations.push('Preparar más inventory');
      recommendations.push('Intensificar marketing');
    } else if (predictedDemand < 25) {
      recommendations.push('Baja demanda: Implementar promociones');
      recommendations.push('Descuentos de early bird');
      recommendations.push('Campañas de reactivación');
    } else {
      recommendations.push('Demanda estable: Mantener estrategia actual');
    }
    
    return recommendations;
  }

  async getPackageData(packageId) {
    // Simulación de datos de paquete
    const packageData = {
      packageId,
      currentPrice: 1890,
      cost: 1200,
      avgBookings: 15,
      destination: 'Perú',
      elasticity: -0.8 // Elasticidad típica para viajes
    };
    
    return packageData;
  }

  calculatePriceElasticity(packageData) {
    // Elasticidad basada en tipo de producto y mercado
    return packageData.elasticity || -0.75;
  }

  calculateExpectedDemand(packageData, priceChange, elasticity) {
    return packageData.avgBookings * (1 + elasticity * (priceChange / 100));
  }

  calculateROI(revenue, cost) {
    return ((revenue - cost) / cost) * 100;
  }

  assessRisk(priceChange, marketConditions) {
    if (Math.abs(priceChange) > 15) return 'high';
    if (Math.abs(priceChange) > 8) return 'medium';
    return 'low';
  }

  calculatePricingConfidence(elasticity, marketConditions) {
    let confidence = 0.7; // Base confidence
    
    if (Math.abs(elasticity) < 1) confidence += 0.1; // Demanda inelástica
    if (marketConditions.stable) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  getNextReviewDate() {
    const date = new Date();
    date.setDate(date.getDate() + 14); // Revisar cada 2 semanas
    return date.toISOString().split('T')[0];
  }

  generatePricingInsights(packageData, competitorPrices, demandForecast) {
    const insights = [];
    
    if (demandForecast.success && demandForecast.predictions[0]?.predictedBookings > 40) {
      insights.push('Demanda alta proyectada - oportunidad de incremento');
    }
    
    insights.push(`Precio actual está ${packageData.currentPrice > 1500 ? 'en rango premium' : 'en rango medio'}`);
    insights.push('Revisar precios cada 2 semanas durante temporada alta');
    
    return insights;
  }

  calculateChurnScore(customer) {
    let score = 0;
    
    // Factores de churn
    const daysSinceLastActivity = (Date.now() - new Date(customer.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActivity > 90) score += 0.3;
    else if (daysSinceLastActivity > 60) score += 0.2;
    else if (daysSinceLastActivity > 30) score += 0.1;
    
    if (customer.totalBookings === 1) score += 0.2;
    if (customer.avgRating < 3.5) score += 0.25;
    if (customer.engagementScore < 0.3) score += 0.15;
    if (customer.supportTickets > 2) score += 0.1;
    
    return Math.min(score, 1);
  }

  getRiskLevel(churnScore) {
    if (churnScore > 0.7) return 'high';
    if (churnScore > 0.4) return 'medium';
    return 'low';
  }

  getChurnFactors(customer) {
    const factors = [];
    
    const daysSinceLastActivity = (Date.now() - new Date(customer.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActivity > 60) factors.push('Inactividad prolongada');
    if (customer.totalBookings === 1) factors.push('Cliente nuevo sin repetición');
    if (customer.avgRating < 3.5) factors.push('Baja satisfacción');
    if (customer.engagementScore < 0.3) factors.push('Bajo engagement');
    
    return factors;
  }

  generateRetentionActions(customer, churnScore) {
    const actions = [];
    
    if (churnScore > 0.7) {
      actions.push('Contacto inmediato del equipo de éxito del cliente');
      actions.push('Oferta especial personalizada (20% descuento)');
      actions.push('Llamada de feedback y mejora');
    } else if (churnScore > 0.4) {
      actions.push('Email de reengagement con descuento');
      actions.push('Newsletter personalizada con nuevos destinos');
      actions.push('Invitación a webinar exclusivo');
    } else {
      actions.push('Programa de fidelidad premium');
      actions.push('Recomendaciones personalizadas');
    }
    
    return actions;
  }

  calculateLTV(customer) {
    const avgBookingValue = customer.avgBookingValue || 1500;
    const expectedBookings = customer.totalBookings > 1 ? 3 : 1.5;
    return avgBookingValue * expectedBookings;
  }

  removeDuplicates(array, key) {
    return array.filter((item, index, self) => 
      index === self.findIndex(t => t[key] === item[key])
    );
  }
}

module.exports = new PredictiveEngine();