// ==============================================
// 📊 ANALYTICS AVANZADO DE PAQUETES
// ==============================================
// Sistema completo de análisis de rendimiento y métricas de paquetes turísticos

const { query } = require('../database');

class PackageAnalytics {
  constructor() {
    this.metricsCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheValidTime = 30 * 60 * 1000; // 30 minutos
  }

  // ==============================================
  // 📈 ANÁLISIS PRINCIPAL DE RENDIMIENTO
  // ==============================================

  async getPackagePerformance(packageId, period = '30d') {
    try {
      console.log(`📊 Analizando rendimiento del paquete ${packageId} - ${period}`);

      const intervals = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
        '1y': '1 year'
      };

      const interval = intervals[period] || '30 days';

      // Métricas básicas de rendimiento
      const basicMetrics = await query(`
        SELECT 
          p.package_id,
          p.title,
          p.destination,
          p.price_amount,
          p.created_at as package_created,
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '${interval}' THEN 1 END) as recent_bookings,
          SUM(b.total_amount) as total_revenue,
          SUM(CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '${interval}' THEN b.total_amount ELSE 0 END) as recent_revenue,
          AVG(b.total_amount) as avg_booking_value,
          SUM(b.travelers_count) as total_travelers,
          AVG(b.travelers_count) as avg_group_size
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id
        WHERE p.package_id = $1 OR p.id = $1
        GROUP BY p.id, p.package_id, p.title, p.destination, p.price_amount, p.created_at
      `, [packageId]);

      if (basicMetrics.rows.length === 0) {
        return { success: false, error: 'Paquete no encontrado' };
      }

      const metrics = basicMetrics.rows[0];

      // Análisis de conversión
      const conversionAnalysis = await this.calculateConversionMetrics(packageId, interval);
      
      // Análisis de tendencias
      const trendAnalysis = await this.analyzeTrends(packageId, interval);
      
      // Análisis de competencia
      const competitiveAnalysis = await this.analyzeCompetitivePosition(packageId, metrics.destination);
      
      // Análisis de reviews y satisfacción
      const satisfactionAnalysis = await this.analyzeSatisfaction(packageId);
      
      // Análisis de estacionalidad
      const seasonalityAnalysis = await this.analyzeSeasonality(packageId);

      // Cálculo de ROI y rentabilidad
      const profitabilityAnalysis = await this.analyzeProfitability(packageId, metrics);

      // Métricas de performance consolidadas
      const performanceScore = this.calculatePerformanceScore(metrics, conversionAnalysis, satisfactionAnalysis);

      return {
        success: true,
        packageId: metrics.package_id,
        period,
        generatedAt: new Date().toISOString(),
        overview: {
          title: metrics.title,
          destination: metrics.destination,
          basePrice: parseFloat(metrics.price_amount),
          totalBookings: parseInt(metrics.total_bookings),
          recentBookings: parseInt(metrics.recent_bookings),
          totalRevenue: parseFloat(metrics.total_revenue) || 0,
          recentRevenue: parseFloat(metrics.recent_revenue) || 0,
          avgBookingValue: parseFloat(metrics.avg_booking_value) || 0,
          totalTravelers: parseInt(metrics.total_travelers) || 0,
          avgGroupSize: parseFloat(metrics.avg_group_size) || 0,
          performanceScore: performanceScore
        },
        conversion: conversionAnalysis,
        trends: trendAnalysis,
        competitive: competitiveAnalysis,
        satisfaction: satisfactionAnalysis,
        seasonality: seasonalityAnalysis,
        profitability: profitabilityAnalysis,
        recommendations: await this.generateRecommendations(metrics, conversionAnalysis, competitiveAnalysis)
      };

    } catch (error) {
      console.error('❌ Error analizando rendimiento del paquete:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🔄 ANÁLISIS DE CONVERSIÓN
  // ==============================================

  async calculateConversionMetrics(packageId, interval) {
    try {
      // Métricas de embudo de conversión (simuladas para demo)
      const viewsEstimate = Math.floor(Math.random() * 1000) + 100;
      const inquiriesEstimate = Math.floor(viewsEstimate * 0.15);
      
      const bookingMetrics = await query(`
        SELECT 
          COUNT(*) as bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed
        FROM bookings 
        WHERE package_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '${interval}'
      `, [packageId]);

      const bookings = parseInt(bookingMetrics.rows[0]?.bookings) || 0;
      const confirmed = parseInt(bookingMetrics.rows[0]?.confirmed) || 0;

      // Calcular tasas de conversión
      const conversionRates = {
        viewToInquiry: viewsEstimate > 0 ? (inquiriesEstimate / viewsEstimate * 100).toFixed(2) : 0,
        inquiryToBooking: inquiriesEstimate > 0 ? (bookings / inquiriesEstimate * 100).toFixed(2) : 0,
        bookingToConfirmed: bookings > 0 ? (confirmed / bookings * 100).toFixed(2) : 0,
        overallConversion: viewsEstimate > 0 ? (confirmed / viewsEstimate * 100).toFixed(2) : 0
      };

      return {
        funnel: {
          views: viewsEstimate,
          inquiries: inquiriesEstimate,
          bookings,
          confirmed
        },
        conversionRates,
        performance: this.evaluateConversionPerformance(conversionRates)
      };

    } catch (error) {
      console.error('❌ Error calculando métricas de conversión:', error);
      return {
        funnel: {},
        conversionRates: {},
        performance: 'unknown'
      };
    }
  }

  evaluateConversionPerformance(rates) {
    const overallRate = parseFloat(rates.overallConversion);
    
    if (overallRate >= 5) return 'excellent';
    if (overallRate >= 3) return 'good';
    if (overallRate >= 1.5) return 'average';
    if (overallRate >= 0.5) return 'below_average';
    return 'poor';
  }

  // ==============================================
  // 📈 ANÁLISIS DE TENDENCIAS
  // ==============================================

  async analyzeTrends(packageId, interval) {
    try {
      // Tendencias de bookings por período
      const bookingTrends = await query(`
        SELECT 
          DATE_TRUNC('week', created_at) as period,
          COUNT(*) as bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          SUM(total_amount) as revenue
        FROM bookings
        WHERE package_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY period
      `, [packageId]);

      // Calcular crecimiento
      const growth = this.calculateGrowthMetrics(bookingTrends.rows);

      // Análisis de momentum
      const momentum = this.calculateMomentum(bookingTrends.rows);

      return {
        bookings: bookingTrends.rows,
        growth,
        momentum,
        trend: this.determineTrendDirection(growth)
      };

    } catch (error) {
      console.error('❌ Error analizando tendencias:', error);
      return {
        bookings: [],
        growth: {},
        momentum: 'stable',
        trend: 'unknown'
      };
    }
  }

  calculateGrowthMetrics(timeSeriesData) {
    if (timeSeriesData.length < 2) {
      return { weekOverWeek: 0, overall: 0, trend: 'insufficient_data' };
    }

    const sorted = timeSeriesData.sort((a, b) => new Date(a.period) - new Date(b.period));
    
    const lastWeek = sorted[sorted.length - 1];
    const prevWeek = sorted[sorted.length - 2];
    const weekOverWeek = prevWeek?.bookings > 0 ? ((lastWeek.bookings - prevWeek.bookings) / prevWeek.bookings * 100) : 0;

    const firstWeek = sorted[0];
    const overall = firstWeek.bookings > 0 ? ((lastWeek.bookings - firstWeek.bookings) / firstWeek.bookings * 100) : 0;

    return {
      weekOverWeek: Math.round(weekOverWeek * 100) / 100,
      overall: Math.round(overall * 100) / 100,
      trend: overall > 0 ? 'growing' : overall < 0 ? 'declining' : 'stable'
    };
  }

  calculateMomentum(timeSeriesData) {
    if (timeSeriesData.length < 3) return 'insufficient_data';

    const sorted = timeSeriesData.sort((a, b) => new Date(a.period) - new Date(b.period));
    const recent = sorted.slice(-3);

    let accelerating = 0;
    for (let i = 1; i < recent.length; i++) {
      const growth = recent[i].bookings - recent[i-1].bookings;
      const prevGrowth = i > 1 ? recent[i-1].bookings - recent[i-2].bookings : growth;
      
      if (growth > prevGrowth) accelerating++;
      else if (growth < prevGrowth) accelerating--;
    }

    if (accelerating > 0) return 'accelerating';
    if (accelerating < 0) return 'decelerating';
    return 'stable';
  }

  determineTrendDirection(growth) {
    if (growth.overall > 20) return 'strong_growth';
    if (growth.overall > 5) return 'moderate_growth';
    if (growth.overall > -5) return 'stable';
    if (growth.overall > -20) return 'moderate_decline';
    return 'strong_decline';
  }

  // ==============================================
  // 🏆 ANÁLISIS COMPETITIVO
  // ==============================================

  async analyzeCompetitivePosition(packageId, destination) {
    try {
      // Obtener paquetes competidores
      const competitors = await query(`
        SELECT 
          p.package_id,
          p.title,
          p.price_amount,
          p.duration_days,
          p.rating_average,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'
        WHERE p.destination ILIKE $1
        AND p.status = 'active'
        AND (p.package_id != $2 AND p.id != $2)
        GROUP BY p.id, p.package_id, p.title, p.price_amount, p.duration_days, p.rating_average
        ORDER BY total_bookings DESC, p.rating_average DESC
        LIMIT 10
      `, [`%${destination}%`, packageId]);

      // Obtener datos del paquete actual
      const currentPackage = await query(`
        SELECT 
          p.package_id,
          p.title,
          p.price_amount,
          p.duration_days,
          p.rating_average,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'
        WHERE p.package_id = $1 OR p.id = $1
        GROUP BY p.id, p.package_id, p.title, p.price_amount, p.duration_days, p.rating_average
      `, [packageId]);

      if (currentPackage.rows.length === 0) {
        return { success: false, error: 'Paquete actual no encontrado' };
      }

      const current = currentPackage.rows[0];
      const competitorsList = competitors.rows;

      // Calcular posición en el mercado
      const marketPosition = this.calculateMarketPosition(current, competitorsList);

      // Análisis de precios
      const priceAnalysis = this.analyzePriceCompetition(current, competitorsList);

      return {
        marketPosition,
        priceAnalysis,
        competitors: competitorsList.slice(0, 5),
        totalCompetitors: competitorsList.length,
        strengths: this.identifyStrengths(current, competitorsList),
        weaknesses: this.identifyWeaknesses(current, competitorsList)
      };

    } catch (error) {
      console.error('❌ Error en análisis competitivo:', error);
      return {
        error: 'Error en análisis competitivo',
        competitors: []
      };
    }
  }

  calculateMarketPosition(current, competitors) {
    const allPackages = [current, ...competitors];
    
    const bookingRank = allPackages
      .sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0))
      .findIndex(p => p.package_id === current.package_id) + 1;

    const revenueRank = allPackages
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .findIndex(p => p.package_id === current.package_id) + 1;

    const ratingRank = allPackages
      .sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0))
      .findIndex(p => p.package_id === current.package_id) + 1;

    const totalPackages = allPackages.length;
    const overallRank = Math.round((bookingRank + revenueRank + ratingRank) / 3);

    return {
      overall: overallRank,
      bookings: bookingRank,
      revenue: revenueRank,
      rating: ratingRank,
      totalPackages,
      percentile: Math.round((1 - (overallRank / totalPackages)) * 100),
      category: this.categorizeMarketPosition(overallRank, totalPackages)
    };
  }

  categorizeMarketPosition(rank, total) {
    const percentile = (1 - (rank / total)) * 100;
    
    if (percentile >= 80) return 'market_leader';
    if (percentile >= 60) return 'strong_performer';
    if (percentile >= 40) return 'average_performer';
    if (percentile >= 20) return 'below_average';
    return 'underperformer';
  }

  analyzePriceCompetition(current, competitors) {
    const prices = competitors.map(c => c.price_amount).filter(p => p > 0);
    if (prices.length === 0) {
      return { position: 'unknown', analysis: 'Datos de precios insuficientes' };
    }

    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const currentPrice = current.price_amount;

    let position = 'average';
    let analysis = '';

    if (currentPrice < avgPrice * 0.8) {
      position = 'budget_friendly';
      analysis = 'Precio significativamente por debajo del promedio del mercado';
    } else if (currentPrice < avgPrice) {
      position = 'competitive';
      analysis = 'Precio competitivo, por debajo del promedio del mercado';
    } else if (currentPrice > avgPrice * 1.2) {
      position = 'premium';
      analysis = 'Posicionamiento premium con precio por encima del mercado';
    } else {
      analysis = 'Precio promedio del mercado';
    }

    return {
      position,
      analysis,
      currentPrice,
      marketAvg: Math.round(avgPrice * 100) / 100,
      percentageVsAvg: Math.round(((currentPrice / avgPrice) - 1) * 100 * 100) / 100
    };
  }

  identifyStrengths(current, competitors) {
    const strengths = [];

    if (current.rating_average > 4.2) {
      strengths.push('Alta calificación de clientes');
    }
    if (current.total_bookings > 10) {
      strengths.push('Volumen alto de reservas');
    }
    if (current.price_amount < 500) {
      strengths.push('Precio accesible');
    }

    return strengths.length > 0 ? strengths : ['Posición competitiva estable'];
  }

  identifyWeaknesses(current, competitors) {
    const weaknesses = [];

    if (current.rating_average < 3.5) {
      weaknesses.push('Calificación por debajo del promedio');
    }
    if (current.total_bookings < 3) {
      weaknesses.push('Bajo volumen de reservas');
    }
    if (!current.rating_average) {
      weaknesses.push('Necesita obtener más reviews');
    }

    return weaknesses;
  }

  // ==============================================
  // 😊 ANÁLISIS DE SATISFACCIÓN
  // ==============================================

  async analyzeSatisfaction(packageId) {
    try {
      // Obtener rating promedio del paquete
      const packageRating = await query(`
        SELECT rating_average, rating_count
        FROM packages 
        WHERE package_id = $1 OR id = $1
      `, [packageId]);

      const rating = packageRating.rows[0] || { rating_average: 0, rating_count: 0 };
      const avgRating = parseFloat(rating.rating_average) || 0;
      const totalReviews = parseInt(rating.rating_count) || 0;

      const nps = this.calculateNPS(avgRating);
      const satisfactionScore = this.calculateSatisfactionScore(avgRating);

      return {
        overall: {
          avgRating,
          totalReviews,
          nps,
          satisfactionScore,
          category: this.categorizeSatisfaction(satisfactionScore)
        },
        distribution: this.estimateRatingDistribution(avgRating, totalReviews)
      };

    } catch (error) {
      console.error('❌ Error analizando satisfacción:', error);
      return {
        overall: { avgRating: 0, totalReviews: 0, nps: 0, satisfactionScore: 0 },
        distribution: {}
      };
    }
  }

  calculateNPS(avgRating) {
    // Estimación de NPS basada en rating promedio
    if (avgRating >= 4.5) return Math.floor(Math.random() * 30) + 50;
    if (avgRating >= 4.0) return Math.floor(Math.random() * 40) + 20;
    if (avgRating >= 3.5) return Math.floor(Math.random() * 40) - 10;
    return Math.floor(Math.random() * 30) - 30;
  }

  calculateSatisfactionScore(avgRating) {
    return Math.round((avgRating / 5) * 100);
  }

  categorizeSatisfaction(score) {
    if (score >= 90) return 'exceptional';
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'average';
    return 'needs_improvement';
  }

  estimateRatingDistribution(avgRating, totalReviews) {
    if (totalReviews === 0) return { excellent: 0, good: 0, average: 0, poor: 0 };

    const excellent = Math.round(totalReviews * (avgRating >= 4.5 ? 0.6 : avgRating >= 4 ? 0.4 : 0.2));
    const good = Math.round(totalReviews * (avgRating >= 4 ? 0.3 : 0.4));
    const average = Math.round(totalReviews * (avgRating >= 3.5 ? 0.2 : 0.3));
    const poor = totalReviews - excellent - good - average;

    return { excellent, good, average, poor };
  }

  // ==============================================
  // 🌍 ANÁLISIS DE ESTACIONALIDAD
  // ==============================================

  async analyzeSeasonality(packageId) {
    try {
      const monthlyPattern = await query(`
        SELECT 
          EXTRACT(MONTH FROM travel_date) as month,
          COUNT(*) as bookings,
          AVG(total_amount) as avg_amount,
          SUM(total_amount) as total_revenue
        FROM bookings 
        WHERE package_id = $1 
        AND travel_date IS NOT NULL
        AND created_at >= CURRENT_DATE - INTERVAL '24 months'
        GROUP BY EXTRACT(MONTH FROM travel_date)
        ORDER BY month
      `, [packageId]);

      const seasonality = this.identifySeasons(monthlyPattern.rows);
      
      return {
        monthly: monthlyPattern.rows.map(row => ({
          month: parseInt(row.month),
          bookings: parseInt(row.bookings),
          avgAmount: parseFloat(row.avg_amount) || 0,
          totalRevenue: parseFloat(row.total_revenue) || 0
        })),
        seasons: seasonality,
        recommendations: this.generateSeasonalRecommendations(seasonality)
      };

    } catch (error) {
      console.error('❌ Error analizando estacionalidad:', error);
      return {
        monthly: [],
        seasons: {},
        recommendations: []
      };
    }
  }

  identifySeasons(monthlyData) {
    if (monthlyData.length === 0) {
      return { highSeason: [], lowSeason: [], shoulderSeason: [] };
    }

    const avgBookings = monthlyData.reduce((sum, m) => sum + parseInt(m.bookings), 0) / monthlyData.length;
    
    const highSeason = monthlyData.filter(m => parseInt(m.bookings) > avgBookings * 1.3).map(m => parseInt(m.month));
    const lowSeason = monthlyData.filter(m => parseInt(m.bookings) < avgBookings * 0.7).map(m => parseInt(m.month));
    const shoulderSeason = monthlyData.filter(m => {
      const bookings = parseInt(m.bookings);
      return bookings >= avgBookings * 0.7 && bookings <= avgBookings * 1.3;
    }).map(m => parseInt(m.month));

    return {
      highSeason,
      lowSeason,
      shoulderSeason,
      peakMonth: monthlyData.length > 0 ? monthlyData.reduce((max, current) => 
        parseInt(current.bookings) > parseInt(max.bookings) ? current : max
      ) : null
    };
  }

  generateSeasonalRecommendations(seasonality) {
    const recommendations = [];

    if (seasonality.lowSeason && seasonality.lowSeason.length > 0) {
      recommendations.push({
        type: 'pricing',
        message: `Considera descuentos especiales durante los meses de baja temporada: ${this.monthNames(seasonality.lowSeason)}`,
        priority: 'high'
      });
    }

    if (seasonality.highSeason && seasonality.highSeason.length > 0) {
      recommendations.push({
        type: 'inventory',
        message: `Asegura disponibilidad durante temporada alta: ${this.monthNames(seasonality.highSeason)}`,
        priority: 'high'
      });
    }

    return recommendations;
  }

  monthNames(monthNumbers) {
    const names = {
      1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
      5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
      9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    };
    
    return monthNumbers.map(num => names[num]).join(', ');
  }

  // ==============================================
  // 💰 ANÁLISIS DE RENTABILIDAD
  // ==============================================

  async analyzeProfitability(packageId, metrics) {
    try {
      const totalRevenue = parseFloat(metrics.total_revenue) || 0;
      const totalBookings = parseInt(metrics.total_bookings) || 0;
      
      // Estimación simplificada de costos (70% del revenue)
      const estimatedCosts = totalRevenue * 0.7;
      const grossProfit = totalRevenue - estimatedCosts;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const roi = estimatedCosts > 0 ? (grossProfit / estimatedCosts) * 100 : 0;

      return {
        revenue: {
          total: totalRevenue,
          average: parseFloat(metrics.avg_booking_value) || 0,
          currency: 'USD'
        },
        costs: {
          total: estimatedCosts,
          breakdown: {
            operational: Math.round(estimatedCosts * 0.6 * 100) / 100,
            marketing: Math.round(estimatedCosts * 0.2 * 100) / 100,
            commission: Math.round(estimatedCosts * 0.2 * 100) / 100
          }
        },
        profit: {
          gross: Math.round(grossProfit * 100) / 100,
          margin: Math.round(profitMargin * 100) / 100,
          avgPerBooking: totalBookings > 0 ? Math.round((grossProfit / totalBookings) * 100) / 100 : 0
        },
        metrics: {
          roi: Math.round(roi * 100) / 100,
          breakEvenPoint: `${Math.ceil(estimatedCosts / (parseFloat(metrics.avg_booking_value) * 0.3 || 1))} reservas`
        },
        performance: this.evaluateProfitabilityPerformance(profitMargin, roi)
      };

    } catch (error) {
      console.error('❌ Error analizando rentabilidad:', error);
      return {
        revenue: { total: 0 },
        costs: { total: 0 },
        profit: { gross: 0, margin: 0 },
        metrics: { roi: 0 },
        performance: 'unknown'
      };
    }
  }

  evaluateProfitabilityPerformance(margin, roi) {
    if (margin >= 25 && roi >= 50) return 'excellent';
    if (margin >= 15 && roi >= 30) return 'good';
    if (margin >= 10 && roi >= 20) return 'average';
    if (margin >= 5 && roi >= 10) return 'below_average';
    return 'poor';
  }

  // ==============================================
  // 💡 GENERACIÓN DE RECOMENDACIONES
  // ==============================================

  async generateRecommendations(metrics, conversionAnalysis, competitiveAnalysis) {
    const recommendations = [];

    // Recomendaciones basadas en conversión
    if (parseFloat(conversionAnalysis.conversionRates.overallConversion) < 2) {
      recommendations.push({
        category: 'conversion',
        priority: 'high',
        title: 'Mejorar tasa de conversión',
        description: 'La tasa de conversión está por debajo del promedio.',
        actions: [
          'Actualizar fotos del destino',
          'Mejorar descripción del paquete',
          'Agregar testimonios de clientes',
          'Optimizar precio competitivo'
        ]
      });
    }

    // Recomendaciones basadas en volumen
    if (parseInt(metrics.recent_bookings) < 5) {
      recommendations.push({
        category: 'marketing',
        priority: 'high',
        title: 'Incrementar visibilidad',
        description: 'Pocas reservas recientes. Es necesario aumentar la visibilidad del paquete.',
        actions: [
          'Campañas de marketing digital',
          'Promociones especiales',
          'Colaboraciones con influencers',
          'Optimización SEO'
        ]
      });
    }

    return recommendations;
  }

  // ==============================================
  // 🎯 MÉTRICAS DE PERFORMANCE GENERAL
  // ==============================================

  calculatePerformanceScore(metrics, conversionAnalysis, satisfactionAnalysis) {
    let score = 0;
    let factors = 0;

    // Factor: Volumen de reservas (25%)
    const bookings = parseInt(metrics.recent_bookings) || 0;
    if (bookings > 0) {
      score += Math.min(bookings / 10 * 25, 25);
      factors++;
    }

    // Factor: Tasa de conversión (25%)
    const conversionRate = parseFloat(conversionAnalysis.conversionRates?.overallConversion) || 0;
    if (conversionRate > 0) {
      score += Math.min(conversionRate * 5, 25);
      factors++;
    }

    // Factor: Satisfacción del cliente (25%)
    const satisfactionScore = satisfactionAnalysis.overall?.satisfactionScore || 0;
    if (satisfactionScore > 0) {
      score += satisfactionScore * 0.25;
      factors++;
    }

    // Factor: Revenue (25%)
    const revenue = parseFloat(metrics.recent_revenue) || 0;
    if (revenue > 0) {
      score += Math.min(revenue / 1000 * 25, 25);
      factors++;
    }

    const finalScore = factors > 0 ? Math.round(score / factors * 4) : 0;
    return Math.min(finalScore, 100);
  }

  // ==============================================
  // 📊 DASHBOARD EJECUTIVO
  // ==============================================

  async getExecutiveDashboard(packageIds, period = '30d') {
    try {
      const dashboardData = {
        summary: await this.getPortfolioSummary(packageIds, period),
        topPerformers: await this.getTopPerformingPackages(packageIds, period),
        underperformers: await this.getUnderperformingPackages(packageIds, period)
      };

      return {
        success: true,
        period,
        generatedAt: new Date().toISOString(),
        data: dashboardData
      };

    } catch (error) {
      console.error('❌ Error generando dashboard ejecutivo:', error);
      return { success: false, error: error.message };
    }
  }

  async getPortfolioSummary(packageIds, period) {
    try {
      const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';
      
      const summary = await query(`
        SELECT 
          COUNT(DISTINCT p.package_id) as total_packages,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue,
          AVG(b.total_amount) as avg_booking_value,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          AVG(p.rating_average) as avg_package_rating
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id 
          AND b.created_at >= CURRENT_DATE - INTERVAL '${interval}'
        WHERE p.package_id = ANY($1) OR p.id = ANY($1)
      `, [packageIds]);

      const data = summary.rows[0];
      const conversionRate = data.total_bookings > 0 ? 
        (data.confirmed_bookings / data.total_bookings * 100).toFixed(2) : 0;

      return {
        totalPackages: parseInt(data.total_packages),
        totalBookings: parseInt(data.total_bookings) || 0,
        totalRevenue: parseFloat(data.total_revenue) || 0,
        avgBookingValue: parseFloat(data.avg_booking_value) || 0,
        conversionRate: parseFloat(conversionRate),
        avgRating: parseFloat(data.avg_package_rating) || 0
      };

    } catch (error) {
      console.error('❌ Error obteniendo resumen de portfolio:', error);
      return {};
    }
  }

  async getTopPerformingPackages(packageIds, period, limit = 5) {
    try {
      const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';
      
      const topPerformers = await query(`
        SELECT 
          p.package_id,
          p.title,
          p.destination,
          COUNT(b.id) as bookings,
          SUM(b.total_amount) as revenue,
          p.rating_average as rating
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id 
          AND b.created_at >= CURRENT_DATE - INTERVAL '${interval}'
        WHERE (p.package_id = ANY($1) OR p.id = ANY($1))
        GROUP BY p.package_id, p.title, p.destination, p.rating_average
        ORDER BY bookings DESC, revenue DESC
        LIMIT $2
      `, [packageIds, limit]);

      return topPerformers.rows.map(row => ({
        packageId: row.package_id,
        title: row.title,
        destination: row.destination,
        bookings: parseInt(row.bookings) || 0,
        revenue: parseFloat(row.revenue) || 0,
        rating: parseFloat(row.rating) || 0
      }));

    } catch (error) {
      console.error('❌ Error obteniendo top performers:', error);
      return [];
    }
  }

  async getUnderperformingPackages(packageIds, period, limit = 5) {
    try {
      const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';
      
      const underperformers = await query(`
        SELECT 
          p.package_id,
          p.title,
          p.destination,
          COUNT(b.id) as bookings,
          SUM(b.total_amount) as revenue,
          p.rating_average as rating
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id 
          AND b.created_at >= CURRENT_DATE - INTERVAL '${interval}'
        WHERE (p.package_id = ANY($1) OR p.id = ANY($1))
        AND p.status = 'active'
        GROUP BY p.package_id, p.title, p.destination, p.rating_average
        HAVING COUNT(b.id) < 3 OR SUM(b.total_amount) < 1000
        ORDER BY bookings ASC, revenue ASC
        LIMIT $2
      `, [packageIds, limit]);

      return underperformers.rows.map(row => ({
        packageId: row.package_id,
        title: row.title,
        destination: row.destination,
        bookings: parseInt(row.bookings) || 0,
        revenue: parseFloat(row.revenue) || 0,
        rating: parseFloat(row.rating) || 0,
        issue: parseInt(row.bookings) === 0 ? 'no_bookings' : 'low_revenue'
      }));

    } catch (error) {
      console.error('❌ Error obteniendo underperformers:', error);
      return [];
    }
  }
}

module.exports = PackageAnalytics;
