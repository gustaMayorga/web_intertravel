// ==============================================
// 📊 SISTEMA AVANZADO DE ANALÍTICAS DE RESERVAS
// ==============================================
// Módulo completo para análisis detallado de bookings, tendencias y performance de reservas

const { query } = require('../database');

class BookingAnalytics {
  constructor() {
    this.metricsCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheValidTime = 15 * 60 * 1000; // 15 minutos
  }

  // ==============================================
  // 📈 MÉTRICAS PRINCIPALES DE RESERVAS
  // ==============================================

  async getBookingMetrics(period = '30d', filters = {}) {
    try {
      console.log(`📊 Analizando métricas de reservas - ${period}`);

      const intervals = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
        '6m': '6 months',
        '1y': '1 year'
      };

      const interval = intervals[period] || '30 days';
      const cacheKey = `booking_metrics_${period}_${JSON.stringify(filters)}`;

      // Verificar cache
      if (this.metricsCache.has(cacheKey) && 
          this.lastCacheUpdate && 
          (Date.now() - this.lastCacheUpdate) < this.cacheValidTime) {
        console.log('📋 Devolviendo métricas desde cache');
        return this.metricsCache.get(cacheKey);
      }

      // Construir filtros WHERE
      const whereConditions = ['created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\''];
      const queryParams = [];
      let paramIndex = 1;

      if (filters.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters.packageId) {
        whereConditions.push(`package_id = $${paramIndex}`);
        queryParams.push(filters.packageId);
        paramIndex++;
      }

      if (filters.source) {
        whereConditions.push(`source = $${paramIndex}`);
        queryParams.push(filters.source);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Métricas principales
      const mainMetrics = await query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as confirmed_revenue,
          AVG(total_amount) as avg_booking_value,
          MIN(total_amount) as min_booking_value,
          MAX(total_amount) as max_booking_value,
          SUM(travelers_count) as total_travelers,
          AVG(travelers_count) as avg_group_size,
          COUNT(DISTINCT customer_email) as unique_customers,
          COUNT(DISTINCT package_id) as packages_booked
        FROM bookings 
        WHERE ${whereClause}
      `, queryParams);

      const metrics = mainMetrics.rows[0];

      // Calcular métricas derivadas
      const totalBookings = parseInt(metrics.total_bookings) || 0;
      const confirmedBookings = parseInt(metrics.confirmed_bookings) || 0;
      const cancelledBookings = parseInt(metrics.cancelled_bookings) || 0;

      const conversionRate = totalBookings > 0 ? 
        ((confirmedBookings / totalBookings) * 100).toFixed(2) : 0;
      
      const cancellationRate = totalBookings > 0 ? 
        ((cancelledBookings / totalBookings) * 100).toFixed(2) : 0;

      // Métricas temporales y tendencias
      const trendAnalysis = await this.analyzeTrends(interval, filters);
      
      // Análisis por fuente de tráfico
      const sourceAnalysis = await this.analyzeBookingSources(interval, filters);
      
      // Análisis geográfico
      const geographicAnalysis = await this.analyzeGeographicDistribution(interval, filters);
      
      // Análisis de valor del cliente
      const customerAnalysis = await this.analyzeCustomerValue(interval, filters);

      // Performance por paquetes
      const packagePerformance = await this.analyzePackagePerformance(interval, filters);

      const result = {
        success: true,
        period,
        generatedAt: new Date().toISOString(),
        summary: {
          totalBookings,
          confirmedBookings,
          pendingBookings: parseInt(metrics.pending_bookings) || 0,
          cancelledBookings,
          completedBookings: parseInt(metrics.completed_bookings) || 0,
          totalRevenue: parseFloat(metrics.total_revenue) || 0,
          confirmedRevenue: parseFloat(metrics.confirmed_revenue) || 0,
          avgBookingValue: parseFloat(metrics.avg_booking_value) || 0,
          minBookingValue: parseFloat(metrics.min_booking_value) || 0,
          maxBookingValue: parseFloat(metrics.max_booking_value) || 0,
          totalTravelers: parseInt(metrics.total_travelers) || 0,
          avgGroupSize: parseFloat(metrics.avg_group_size) || 0,
          uniqueCustomers: parseInt(metrics.unique_customers) || 0,
          packagesBooked: parseInt(metrics.packages_booked) || 0,
          conversionRate: parseFloat(conversionRate),
          cancellationRate: parseFloat(cancellationRate)
        },
        trends: trendAnalysis,
        sources: sourceAnalysis,
        geographic: geographicAnalysis,
        customers: customerAnalysis,
        packages: packagePerformance,
        insights: await this.generateInsights(metrics, trendAnalysis, sourceAnalysis)
      };

      // Guardar en cache
      this.metricsCache.set(cacheKey, result);
      this.lastCacheUpdate = Date.now();

      return result;

    } catch (error) {
      console.error('❌ Error obteniendo métricas de bookings:', error);
      return { 
        success: false, 
        error: error.message,
        period,
        summary: {}
      };
    }
  }

  // ==============================================
  // 📈 ANÁLISIS DE TENDENCIAS TEMPORALES
  // ==============================================

  async analyzeTrends(interval, filters = {}) {
    try {
      console.log('📈 Analizando tendencias temporales');

      // Construir filtros WHERE
      const whereConditions = ['created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\''];
      const queryParams = [];
      let paramIndex = 1;

      if (filters.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters.packageId) {
        whereConditions.push(`package_id = $${paramIndex}`);
        queryParams.push(filters.packageId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Tendencias diarias para períodos cortos, semanales para largos
      const timeframe = interval === '7 days' ? 'day' : 
                       interval === '30 days' ? 'day' : 'week';

      const dailyTrends = await query(`
        SELECT 
          DATE_TRUNC('${timeframe}', created_at) as period,
          COUNT(*) as bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_value,
          COUNT(DISTINCT customer_email) as unique_customers
        FROM bookings
        WHERE ${whereClause}
        GROUP BY DATE_TRUNC('${timeframe}', created_at)
        ORDER BY period
      `, queryParams);

      // Análisis por día de la semana
      const weekdayAnalysis = await query(`
        SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          TO_CHAR(created_at, 'Day') as day_name,
          COUNT(*) as bookings,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_value
        FROM bookings
        WHERE ${whereClause}
        GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day')
        ORDER BY day_of_week
      `, queryParams);

      // Análisis por hora del día
      const hourlyAnalysis = await query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as bookings,
          SUM(total_amount) as revenue
        FROM bookings
        WHERE ${whereClause}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `, queryParams);

      // Calcular crecimiento
      const growth = this.calculateGrowthMetrics(dailyTrends.rows);

      return {
        daily: dailyTrends.rows.map(row => ({
          period: row.period,
          bookings: parseInt(row.bookings),
          confirmed: parseInt(row.confirmed),
          revenue: parseFloat(row.revenue) || 0,
          avgValue: parseFloat(row.avg_value) || 0,
          uniqueCustomers: parseInt(row.unique_customers)
        })),
        weekday: weekdayAnalysis.rows.map(row => ({
          dayOfWeek: parseInt(row.day_of_week),
          dayName: row.day_name.trim(),
          bookings: parseInt(row.bookings),
          revenue: parseFloat(row.revenue) || 0,
          avgValue: parseFloat(row.avg_value) || 0
        })),
        hourly: hourlyAnalysis.rows.map(row => ({
          hour: parseInt(row.hour),
          bookings: parseInt(row.bookings),
          revenue: parseFloat(row.revenue) || 0
        })),
        growth: growth,
        insights: {
          bestDay: this.findBestPerformingDay(weekdayAnalysis.rows),
          bestHour: this.findBestPerformingHour(hourlyAnalysis.rows),
          trend: growth.trend,
          momentum: growth.momentum
        }
      };

    } catch (error) {
      console.error('❌ Error analizando tendencias:', error);
      return {
        daily: [],
        weekday: [],
        hourly: [],
        growth: {},
        insights: {}
      };
    }
  }

  calculateGrowthMetrics(timeSeriesData) {
    if (timeSeriesData.length < 2) {
      return { 
        periodOverPeriod: 0, 
        overall: 0, 
        trend: 'insufficient_data',
        momentum: 'insufficient_data'
      };
    }

    const sorted = timeSeriesData.sort((a, b) => new Date(a.period) - new Date(b.period));
    
    // Comparación período a período (última vs anterior)
    const lastPeriod = sorted[sorted.length - 1];
    const prevPeriod = sorted[sorted.length - 2];
    const periodOverPeriod = prevPeriod?.bookings > 0 ? 
      ((lastPeriod.bookings - prevPeriod.bookings) / prevPeriod.bookings * 100) : 0;

    // Crecimiento general (último vs primero)
    const firstPeriod = sorted[0];
    const overall = firstPeriod.bookings > 0 ? 
      ((lastPeriod.bookings - firstPeriod.bookings) / firstPeriod.bookings * 100) : 0;

    // Determinar tendencia
    let trend = 'stable';
    if (overall > 15) trend = 'strong_growth';
    else if (overall > 5) trend = 'moderate_growth';
    else if (overall < -15) trend = 'strong_decline';
    else if (overall < -5) trend = 'moderate_decline';

    // Calcular momentum
    const momentum = this.calculateMomentum(sorted);

    return {
      periodOverPeriod: Math.round(periodOverPeriod * 100) / 100,
      overall: Math.round(overall * 100) / 100,
      trend,
      momentum
    };
  }

  calculateMomentum(timeSeriesData) {
    if (timeSeriesData.length < 3) return 'insufficient_data';

    const recent = timeSeriesData.slice(-3);
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

  findBestPerformingDay(weekdayData) {
    if (weekdayData.length === 0) return null;
    
    return weekdayData.reduce((best, current) => 
      parseInt(current.bookings) > parseInt(best.bookings) ? current : best
    );
  }

  findBestPerformingHour(hourlyData) {
    if (hourlyData.length === 0) return null;
    
    return hourlyData.reduce((best, current) => 
      parseInt(current.bookings) > parseInt(best.bookings) ? current : best
    );
  }

  // ==============================================
  // 🌐 ANÁLISIS POR FUENTE DE TRÁFICO
  // ==============================================

  async analyzeBookingSources(interval, filters = {}) {
    try {
      console.log('🌐 Analizando fuentes de reservas');

      const whereConditions = ['created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\''];
      const queryParams = [];
      let paramIndex = 1;

      if (filters.packageId) {
        whereConditions.push(`package_id = $${paramIndex}`);
        queryParams.push(filters.packageId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const sourceAnalysis = await query(`
        SELECT 
          COALESCE(source, 'unknown') as source,
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as confirmed_revenue,
          AVG(total_amount) as avg_booking_value,
          COUNT(DISTINCT customer_email) as unique_customers
        FROM bookings
        WHERE ${whereClause}
        GROUP BY source
        ORDER BY total_bookings DESC
      `, queryParams);

      const totalBookings = sourceAnalysis.rows.reduce((sum, row) => sum + parseInt(row.total_bookings), 0);
      const totalRevenue = sourceAnalysis.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);

      const sourcesWithMetrics = sourceAnalysis.rows.map(row => {
        const bookings = parseInt(row.total_bookings);
        const revenue = parseFloat(row.total_revenue) || 0;
        const confirmedBookings = parseInt(row.confirmed_bookings) || 0;
        
        return {
          source: row.source,
          bookings,
          confirmedBookings,
          totalRevenue: revenue,
          confirmedRevenue: parseFloat(row.confirmed_revenue) || 0,
          avgBookingValue: parseFloat(row.avg_booking_value) || 0,
          uniqueCustomers: parseInt(row.unique_customers),
          conversionRate: bookings > 0 ? ((confirmedBookings / bookings) * 100).toFixed(2) : 0,
          marketShare: totalBookings > 0 ? ((bookings / totalBookings) * 100).toFixed(2) : 0,
          revenueShare: totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(2) : 0
        };
      });

      // Identificar mejores y peores fuentes
      const bestByBookings = sourcesWithMetrics.length > 0 ? 
        sourcesWithMetrics.reduce((best, current) => 
          current.bookings > best.bookings ? current : best
        ) : null;

      const bestByRevenue = sourcesWithMetrics.length > 0 ? 
        sourcesWithMetrics.reduce((best, current) => 
          current.totalRevenue > best.totalRevenue ? current : best
        ) : null;

      return {
        sources: sourcesWithMetrics,
        insights: {
          topPerformer: bestByBookings,
          highestRevenue: bestByRevenue,
          totalSources: sourcesWithMetrics.length,
          diversification: this.calculateSourceDiversification(sourcesWithMetrics)
        },
        recommendations: this.generateSourceRecommendations(sourcesWithMetrics)
      };

    } catch (error) {
      console.error('❌ Error analizando fuentes:', error);
      return {
        sources: [],
        insights: {},
        recommendations: []
      };
    }
  }

  calculateSourceDiversification(sources) {
    if (sources.length === 0) return 'unknown';
    
    const totalBookings = sources.reduce((sum, s) => sum + s.bookings, 0);
    if (totalBookings === 0) return 'no_data';

    // Calcular índice de concentración (HHI simplificado)
    const hhi = sources.reduce((sum, source) => {
      const marketShare = source.bookings / totalBookings;
      return sum + (marketShare * marketShare);
    }, 0) * 10000;

    if (hhi > 2500) return 'highly_concentrated';
    if (hhi > 1500) return 'moderately_concentrated';
    return 'well_diversified';
  }

  generateSourceRecommendations(sources) {
    const recommendations = [];

    // Identificar fuente dominante
    const dominantSource = sources.find(s => parseFloat(s.marketShare) > 50);
    if (dominantSource) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        message: `Diversificar fuentes de tráfico. ${dominantSource.source} representa más del 50% de las reservas`,
        action: 'Invertir en canales alternativos de marketing'
      });
    }

    // Identificar fuentes con baja conversión
    const lowConversionSources = sources.filter(s => parseFloat(s.conversionRate) < 30 && s.bookings > 5);
    if (lowConversionSources.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `Optimizar conversión en: ${lowConversionSources.map(s => s.source).join(', ')}`,
        action: 'Revisar experiencia de usuario y proceso de reserva'
      });
    }

    return recommendations;
  }

  // ==============================================
  // 🗺️ ANÁLISIS GEOGRÁFICO
  // ==============================================

  async analyzeGeographicDistribution(interval, filters = {}) {
    try {
      console.log('🗺️ Analizando distribución geográfica');

      // Simulación de análisis geográfico basado en datos de paquetes
      const whereConditions = ['b.created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\''];
      const queryParams = [];
      let paramIndex = 1;

      if (filters.packageId) {
        whereConditions.push(`b.package_id = $${paramIndex}`);
        queryParams.push(filters.packageId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Análisis por destino de paquetes
      const destinationAnalysis = await query(`
        SELECT 
          p.destination,
          p.country,
          COUNT(b.id) as bookings,
          SUM(b.total_amount) as revenue,
          AVG(b.total_amount) as avg_booking_value,
          COUNT(DISTINCT b.customer_email) as unique_customers
        FROM bookings b
        JOIN packages p ON b.package_id = p.package_id
        WHERE ${whereClause}
        GROUP BY p.destination, p.country
        ORDER BY bookings DESC
      `, queryParams);

      const totalBookings = destinationAnalysis.rows.reduce((sum, row) => sum + parseInt(row.bookings), 0);

      const destinations = destinationAnalysis.rows.map(row => ({
        destination: row.destination,
        country: row.country,
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue) || 0,
        avgBookingValue: parseFloat(row.avg_booking_value) || 0,
        uniqueCustomers: parseInt(row.unique_customers),
        marketShare: totalBookings > 0 ? ((parseInt(row.bookings) / totalBookings) * 100).toFixed(2) : 0
      }));

      // Top destinos
      const topDestinations = destinations.slice(0, 5);

      return {
        destinations,
        topDestinations,
        insights: {
          totalDestinations: destinations.length,
          topDestination: destinations[0] || null,
          concentration: this.calculateGeographicConcentration(destinations)
        }
      };

    } catch (error) {
      console.error('❌ Error en análisis geográfico:', error);
      return {
        destinations: [],
        topDestinations: [],
        insights: {}
      };
    }
  }

  calculateGeographicConcentration(destinations) {
    if (destinations.length === 0) return 'no_data';

    const totalBookings = destinations.reduce((sum, d) => sum + d.bookings, 0);
    if (totalBookings === 0) return 'no_bookings';

    const top3Share = destinations.slice(0, 3).reduce((sum, d) => sum + d.bookings, 0) / totalBookings;

    if (top3Share > 0.8) return 'highly_concentrated';
    if (top3Share > 0.6) return 'moderately_concentrated';
    return 'well_distributed';
  }

  // ==============================================
  // 👥 ANÁLISIS DE VALOR DEL CLIENTE
  // ==============================================

  async analyzeCustomerValue(interval, filters = {}) {
    try {
      console.log('👥 Analizando valor del cliente');

      const whereConditions = ['created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\''];
      const queryParams = [];
      let paramIndex = 1;

      if (filters.packageId) {
        whereConditions.push(`package_id = $${paramIndex}`);
        queryParams.push(filters.packageId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Análisis de valor por cliente
      const customerValueAnalysis = await query(`
        SELECT 
          customer_email,
          customer_name,
          COUNT(*) as total_bookings,
          SUM(total_amount) as total_spent,
          AVG(total_amount) as avg_booking_value,
          MIN(created_at) as first_booking,
          MAX(created_at) as last_booking,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          SUM(travelers_count) as total_travelers
        FROM bookings
        WHERE ${whereClause}
        AND customer_email IS NOT NULL
        GROUP BY customer_email, customer_name
        HAVING COUNT(*) > 0
        ORDER BY total_spent DESC
      `, queryParams);

      // Segmentación de clientes
      const segments = this.segmentCustomers(customerValueAnalysis.rows);

      // Métricas de retención
      const retentionMetrics = this.calculateRetentionMetrics(customerValueAnalysis.rows);

      // Top clientes
      const topCustomers = customerValueAnalysis.rows.slice(0, 10).map(row => ({
        email: row.customer_email,
        name: row.customer_name,
        totalBookings: parseInt(row.total_bookings),
        totalSpent: parseFloat(row.total_spent),
        avgBookingValue: parseFloat(row.avg_booking_value),
        firstBooking: row.first_booking,
        lastBooking: row.last_booking,
        confirmedBookings: parseInt(row.confirmed_bookings),
        totalTravelers: parseInt(row.total_travelers)
      }));

      return {
        segments,
        retentionMetrics,
        topCustomers,
        insights: {
          totalCustomers: customerValueAnalysis.rows.length,
          avgCustomerValue: customerValueAnalysis.rows.length > 0 ? 
            customerValueAnalysis.rows.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / customerValueAnalysis.rows.length : 0,
          repeatCustomerRate: retentionMetrics.repeatCustomerRate
        }
      };

    } catch (error) {
      console.error('❌ Error analizando valor del cliente:', error);
      return {
        segments: {},
        retentionMetrics: {},
        topCustomers: [],
        insights: {}
      };
    }
  }

  segmentCustomers(customers) {
    const segments = {
      vip: [],        // >$2000 gastado
      loyal: [],      // 3+ reservas
      valuable: [],   // >$1000 gastado
      regular: [],    // 2 reservas
      new: []         // 1 reserva
    };

    customers.forEach(customer => {
      const totalSpent = parseFloat(customer.total_spent);
      const totalBookings = parseInt(customer.total_bookings);

      if (totalSpent > 2000) {
        segments.vip.push(customer);
      } else if (totalBookings >= 3) {
        segments.loyal.push(customer);
      } else if (totalSpent > 1000) {
        segments.valuable.push(customer);
      } else if (totalBookings >= 2) {
        segments.regular.push(customer);
      } else {
        segments.new.push(customer);
      }
    });

    return {
      vip: { count: segments.vip.length, customers: segments.vip },
      loyal: { count: segments.loyal.length, customers: segments.loyal },
      valuable: { count: segments.valuable.length, customers: segments.valuable },
      regular: { count: segments.regular.length, customers: segments.regular },
      new: { count: segments.new.length, customers: segments.new }
    };
  }

  calculateRetentionMetrics(customers) {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => parseInt(c.total_bookings) > 1).length;
    
    const repeatCustomerRate = totalCustomers > 0 ? 
      ((repeatCustomers / totalCustomers) * 100).toFixed(2) : 0;

    // CLV estimado
    const avgCustomerValue = totalCustomers > 0 ? 
      customers.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / totalCustomers : 0;

    return {
      totalCustomers,
      repeatCustomers,
      repeatCustomerRate: parseFloat(repeatCustomerRate),
      estimatedCLV: avgCustomerValue * 1.5 // Estimación simple
    };
  }

  // ==============================================
  // 📦 ANÁLISIS DE PERFORMANCE POR PAQUETES
  // ==============================================

  async analyzePackagePerformance(interval, filters = {}) {
    try {
      console.log('📦 Analizando performance por paquetes');

      const whereConditions = ['b.created_at >= CURRENT_DATE - INTERVAL \'' + interval + '\''];
      const queryParams = [];
      let paramIndex = 1;

      if (filters.packageId) {
        whereConditions.push(`b.package_id = $${paramIndex}`);
        queryParams.push(filters.packageId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const packagePerformance = await query(`
        SELECT 
          p.package_id,
          p.title,
          p.destination,
          p.price_amount,
          p.rating_average,
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          SUM(b.total_amount) as total_revenue,
          AVG(b.total_amount) as avg_booking_value,
          COUNT(DISTINCT b.customer_email) as unique_customers,
          SUM(b.travelers_count) as total_travelers
        FROM packages p
        LEFT JOIN bookings b ON p.package_id = b.package_id AND ${whereClause}
        WHERE p.status = 'active'
        GROUP BY p.id, p.package_id, p.title, p.destination, p.price_amount, p.rating_average
        HAVING COUNT(b.id) > 0
        ORDER BY total_bookings DESC, total_revenue DESC
      `, queryParams);

      const packages = packagePerformance.rows.map(row => {
        const totalBookings = parseInt(row.total_bookings) || 0;
        const confirmedBookings = parseInt(row.confirmed_bookings) || 0;
        
        return {
          packageId: row.package_id,
          title: row.title,
          destination: row.destination,
          basePrice: parseFloat(row.price_amount) || 0,
          rating: parseFloat(row.rating_average) || 0,
          totalBookings,
          confirmedBookings,
          totalRevenue: parseFloat(row.total_revenue) || 0,
          avgBookingValue: parseFloat(row.avg_booking_value) || 0,
          uniqueCustomers: parseInt(row.unique_customers) || 0,
          totalTravelers: parseInt(row.total_travelers) || 0,
          conversionRate: totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(2) : 0
        };
      });

      // Top performers
      const topByBookings = packages.slice(0, 5);
      const topByRevenue = [...packages].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

      return {
        packages,
        topPerformers: {
          byBookings: topByBookings,
          byRevenue: topByRevenue
        },
        insights: {
          totalActivePackages: packages.length,
          avgBookingsPerPackage: packages.length > 0 ? 
            packages.reduce((sum, p) => sum + p.totalBookings, 0) / packages.length : 0,
          bestPerformer: packages[0] || null
        }
      };

    } catch (error) {
      console.error('❌ Error analizando performance de paquetes:', error);
      return {
        packages: [],
        topPerformers: { byBookings: [], byRevenue: [] },
        insights: {}
      };
    }
  }

  // ==============================================
  // 💡 GENERACIÓN DE INSIGHTS INTELIGENTES
  // ==============================================

  async generateInsights(metrics, trendAnalysis, sourceAnalysis) {
    const insights = [];

    // Insight de conversión
    const conversionRate = parseFloat(metrics.conversionRate) || 0;
    if (conversionRate < 50) {
      insights.push({
        type: 'conversion',
        severity: 'warning',
        title: 'Tasa de conversión baja',
        description: `Solo el ${conversionRate}% de las reservas se confirman`,
        recommendation: 'Revisar proceso de confirmación y seguimiento de clientes',
        impact: 'high'
      });
    } else if (conversionRate > 80) {
      insights.push({
        type: 'conversion',
        severity: 'success',
        title: 'Excelente tasa de conversión',
        description: `El ${conversionRate}% de reservas se confirman exitosamente`,
        recommendation: 'Mantener las prácticas actuales y escalar',
        impact: 'positive'
      });
    }

    // Insight de crecimiento
    if (trendAnalysis.growth && trendAnalysis.growth.trend) {
      const growth = trendAnalysis.growth;
      if (growth.trend === 'strong_decline') {
        insights.push({
          type: 'growth',
          severity: 'critical',
          title: 'Caída significativa en reservas',
          description: `Reducción del ${Math.abs(growth.overall)}% en reservas`,
          recommendation: 'Estrategia urgente de marketing y retención',
          impact: 'critical'
        });
      } else if (growth.trend === 'strong_growth') {
        insights.push({
          type: 'growth',
          severity: 'success',
          title: 'Crecimiento acelerado',
          description: `Incremento del ${growth.overall}% en reservas`,
          recommendation: 'Preparar capacidad para demanda creciente',
          impact: 'positive'
        });
      }
    }

    // Insight de diversificación de fuentes
    if (sourceAnalysis.insights && sourceAnalysis.insights.diversification === 'highly_concentrated') {
      insights.push({
        type: 'diversification',
        severity: 'warning',
        title: 'Dependencia alta de una fuente',
        description: 'Más del 50% de reservas provienen de una sola fuente',
        recommendation: 'Diversificar canales de marketing para reducir riesgo',
        impact: 'medium'
      });
    }

    // Insight de horarios
    if (trendAnalysis.insights && trendAnalysis.insights.bestHour) {
      const bestHour = trendAnalysis.insights.bestHour;
      insights.push({
        type: 'timing',
        severity: 'info',
        title: 'Horario óptimo identificado',
        description: `La mayoría de reservas ocurren a las ${bestHour.hour}:00`,
        recommendation: 'Programar campañas y promociones en este horario',
        impact: 'medium'
      });
    }

    return insights;
  }

  // ==============================================
  // 📊 DASHBOARD DE RESERVAS EN TIEMPO REAL
  // ==============================================

  async getRealtimeDashboard() {
    try {
      console.log('📊 Generando dashboard en tiempo real');

      // Métricas de hoy
      const todayMetrics = await query(`
        SELECT 
          COUNT(*) as today_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as today_confirmed,
          SUM(total_amount) as today_revenue,
          COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 1 END) as last_hour_bookings
        FROM bookings 
        WHERE DATE(created_at) = CURRENT_DATE
      `);

      // Métricas de la semana
      const weekMetrics = await query(`
        SELECT 
          COUNT(*) as week_bookings,
          SUM(total_amount) as week_revenue,
          AVG(total_amount) as week_avg_value
        FROM bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);

      // Últimas reservas
      const recentBookings = await query(`
        SELECT 
          b.booking_reference,
          b.customer_name,
          b.total_amount,
          b.status,
          b.created_at,
          p.title as package_title,
          p.destination
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.package_id
        ORDER BY b.created_at DESC
        LIMIT 10
      `);

      // Status distribution
      const statusDistribution = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY status
      `);

      const today = todayMetrics.rows[0];
      const week = weekMetrics.rows[0];

      return {
        success: true,
        timestamp: new Date().toISOString(),
        realtime: {
          todayBookings: parseInt(today.today_bookings) || 0,
          todayConfirmed: parseInt(today.today_confirmed) || 0,
          todayRevenue: parseFloat(today.today_revenue) || 0,
          lastHourBookings: parseInt(today.last_hour_bookings) || 0,
          weekBookings: parseInt(week.week_bookings) || 0,
          weekRevenue: parseFloat(week.week_revenue) || 0,
          weekAvgValue: parseFloat(week.week_avg_value) || 0
        },
        recentActivity: recentBookings.rows.map(booking => ({
          reference: booking.booking_reference,
          customerName: booking.customer_name,
          amount: parseFloat(booking.total_amount),
          status: booking.status,
          createdAt: booking.created_at,
          packageTitle: booking.package_title,
          destination: booking.destination
        })),
        statusDistribution: statusDistribution.rows.map(status => ({
          status: status.status,
          count: parseInt(status.count)
        }))
      };

    } catch (error) {
      console.error('❌ Error generando dashboard en tiempo real:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ==============================================
  // 📈 ANÁLISIS DE COHORTES
  // ==============================================

  async getCohortAnalysis(period = '30d') {
    try {
      console.log('📈 Realizando análisis de cohortes');

      const intervals = {
        '30d': '30 days',
        '90d': '90 days',
        '180d': '180 days',
        '1y': '1 year'
      };

      const interval = intervals[period] || '90 days';

      // Análisis de cohortes por mes de primera reserva
      const cohortData = await query(`
        WITH first_bookings AS (
          SELECT 
            customer_email,
            DATE_TRUNC('month', MIN(created_at)) as cohort_month,
            MIN(created_at) as first_booking_date
          FROM bookings
          WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
          AND customer_email IS NOT NULL
          GROUP BY customer_email
        ),
        booking_periods AS (
          SELECT 
            b.customer_email,
            fb.cohort_month,
            DATE_TRUNC('month', b.created_at) as booking_month,
            EXTRACT(MONTH FROM AGE(b.created_at, fb.first_booking_date)) as period_number
          FROM bookings b
          JOIN first_bookings fb ON b.customer_email = fb.customer_email
          WHERE b.created_at >= CURRENT_DATE - INTERVAL '${interval}'
        )
        SELECT 
          cohort_month,
          period_number,
          COUNT(DISTINCT customer_email) as customers
        FROM booking_periods
        GROUP BY cohort_month, period_number
        ORDER BY cohort_month, period_number
      `);

      // Procesar datos de cohorte
      const cohortMatrix = this.processCohortData(cohortData.rows);

      return {
        success: true,
        period,
        generatedAt: new Date().toISOString(),
        cohortMatrix,
        insights: {
          avgRetentionMonth1: this.calculateAvgRetention(cohortMatrix, 1),
          avgRetentionMonth3: this.calculateAvgRetention(cohortMatrix, 3),
          avgRetentionMonth6: this.calculateAvgRetention(cohortMatrix, 6)
        }
      };

    } catch (error) {
      console.error('❌ Error en análisis de cohortes:', error);
      return {
        success: false,
        error: error.message,
        period
      };
    }
  }

  processCohortData(rawData) {
    const cohorts = {};
    
    rawData.forEach(row => {
      const cohortMonth = row.cohort_month;
      const periodNumber = parseInt(row.period_number);
      const customers = parseInt(row.customers);

      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {};
      }
      
      cohorts[cohortMonth][periodNumber] = customers;
    });

    // Calcular tasas de retención
    const cohortMatrix = {};
    
    Object.keys(cohorts).forEach(cohortMonth => {
      const cohortData = cohorts[cohortMonth];
      const baseSize = cohortData[0] || 0; // Clientes en período 0
      
      cohortMatrix[cohortMonth] = {
        baseSize,
        retention: {}
      };

      Object.keys(cohortData).forEach(period => {
        const retentionRate = baseSize > 0 ? 
          ((cohortData[period] / baseSize) * 100).toFixed(2) : 0;
        
        cohortMatrix[cohortMonth].retention[period] = {
          customers: cohortData[period],
          retentionRate: parseFloat(retentionRate)
        };
      });
    });

    return cohortMatrix;
  }

  calculateAvgRetention(cohortMatrix, targetPeriod) {
    const cohorts = Object.keys(cohortMatrix);
    const validCohorts = cohorts.filter(cohort => 
      cohortMatrix[cohort].retention[targetPeriod]
    );

    if (validCohorts.length === 0) return 0;

    const totalRetention = validCohorts.reduce((sum, cohort) => 
      sum + cohortMatrix[cohort].retention[targetPeriod].retentionRate, 0
    );

    return (totalRetention / validCohorts.length).toFixed(2);
  }

  // ==============================================
  // 🔄 LIMPIEZA DE CACHE
  // ==============================================

  clearCache() {
    this.metricsCache.clear();
    this.lastCacheUpdate = null;
    console.log('🧹 Cache de analytics limpiado');
  }

  // ==============================================
  // ⚡ MÉTODOS DE UTILIDAD
  // ==============================================

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(value) {
    return `${value}%`;
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES');
  }
}

// ==============================================
// 📊 EXPORTAR MÓDULO
// ==============================================

module.exports = BookingAnalytics;
