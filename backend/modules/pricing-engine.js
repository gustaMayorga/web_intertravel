// ==============================================
// 💰 MOTOR DE PRECIOS INTELIGENTE
// ==============================================
// Sistema avanzado de cálculo y gestión de precios dinámicos

const { query } = require('../database');

class PricingEngine {
  constructor() {
    this.rules = new Map();
    this.modifiers = new Map();
    this.seasonalRates = new Map();
    this.currencyRates = new Map();
    this.lastCurrencyUpdate = null;
  }

  // ==============================================
  // 🎯 CÁLCULO PRINCIPAL DE PRECIOS
  // ==============================================

  async calculatePrice(packageData, options = {}) {
    try {
      const {
        packageId,
        basePrice,
        currency = 'USD',
        travelers = 1,
        travelDate,
        bookingDate = new Date(),
        customerType = 'regular', // 'regular', 'premium', 'agency'
        promoCode = null,
        targetCurrency = null
      } = { ...packageData, ...options };

      console.log(`💰 Calculando precio para paquete ${packageId}, ${travelers} viajeros`);

      // Precio base
      let finalPrice = parseFloat(basePrice);
      let breakdown = {
        basePrice: finalPrice,
        modifiers: [],
        discounts: [],
        taxes: [],
        totalBeforeTax: 0,
        taxes: 0,
        finalPrice: 0,
        currency
      };

      // 1. Aplicar modificadores por número de viajeros
      const groupModifier = await this.calculateGroupModifier(travelers);
      if (groupModifier.adjustment !== 1) {
        finalPrice *= groupModifier.adjustment;
        breakdown.modifiers.push({
          type: 'group_size',
          description: groupModifier.description,
          multiplier: groupModifier.adjustment,
          amount: finalPrice - breakdown.basePrice
        });
      }

      // 2. Aplicar precios estacionales
      if (travelDate) {
        const seasonalModifier = await this.calculateSeasonalModifier(packageId, travelDate);
        if (seasonalModifier.adjustment !== 1) {
          const previousPrice = finalPrice;
          finalPrice *= seasonalModifier.adjustment;
          breakdown.modifiers.push({
            type: 'seasonal',
            description: seasonalModifier.description,
            multiplier: seasonalModifier.adjustment,
            amount: finalPrice - previousPrice
          });
        }
      }

      // 3. Aplicar descuentos por reserva anticipada
      if (travelDate && bookingDate) {
        const earlyBirdDiscount = await this.calculateEarlyBirdDiscount(bookingDate, travelDate);
        if (earlyBirdDiscount.amount > 0) {
          finalPrice -= earlyBirdDiscount.amount;
          breakdown.discounts.push({
            type: 'early_bird',
            description: earlyBirdDiscount.description,
            amount: -earlyBirdDiscount.amount
          });
        }
      }

      // 4. Aplicar descuentos por tipo de cliente
      const customerDiscount = await this.calculateCustomerTypeDiscount(customerType, finalPrice);
      if (customerDiscount.amount > 0) {
        finalPrice -= customerDiscount.amount;
        breakdown.discounts.push({
          type: 'customer_type',
          description: customerDiscount.description,
          amount: -customerDiscount.amount
        });
      }

      // 5. Aplicar código promocional
      if (promoCode) {
        const promoDiscount = await this.applyPromoCode(promoCode, finalPrice, packageId);
        if (promoDiscount.success && promoDiscount.amount > 0) {
          finalPrice -= promoDiscount.amount;
          breakdown.discounts.push({
            type: 'promo_code',
            description: promoDiscount.description,
            amount: -promoDiscount.amount,
            code: promoCode
          });
        }
      }

      breakdown.totalBeforeTax = finalPrice;

      // 6. Calcular impuestos
      const taxCalculation = await this.calculateTaxes(finalPrice, packageId);
      breakdown.taxes = taxCalculation.amount;
      finalPrice += taxCalculation.amount;

      breakdown.finalPrice = finalPrice;

      // 7. Convertir moneda si es necesario
      if (targetCurrency && targetCurrency !== currency) {
        const convertedPrice = await this.convertCurrency(finalPrice, currency, targetCurrency);
        if (convertedPrice.success) {
          breakdown.originalCurrency = currency;
          breakdown.currency = targetCurrency;
          breakdown.finalPrice = convertedPrice.amount;
          breakdown.exchangeRate = convertedPrice.rate;
        }
      }

      // Redondear a 2 decimales
      breakdown.finalPrice = Math.round(breakdown.finalPrice * 100) / 100;
      breakdown.totalBeforeTax = Math.round(breakdown.totalBeforeTax * 100) / 100;

      return {
        success: true,
        price: breakdown.finalPrice,
        currency: breakdown.currency,
        breakdown,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error calculando precio:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 👥 MODIFICADORES POR GRUPO
  // ==============================================

  async calculateGroupModifier(travelers) {
    try {
      // Reglas de descuento por grupo
      const groupRules = [
        { minSize: 1, maxSize: 1, multiplier: 1, description: 'Precio individual' },
        { minSize: 2, maxSize: 3, multiplier: 0.95, description: 'Descuento pareja (5%)' },
        { minSize: 4, maxSize: 6, multiplier: 0.90, description: 'Descuento familia (10%)' },
        { minSize: 7, maxSize: 12, multiplier: 0.85, description: 'Descuento grupo pequeño (15%)' },
        { minSize: 13, maxSize: 25, multiplier: 0.80, description: 'Descuento grupo mediano (20%)' },
        { minSize: 26, maxSize: 999, multiplier: 0.75, description: 'Descuento grupo grande (25%)' }
      ];

      const applicableRule = groupRules.find(rule => 
        travelers >= rule.minSize && travelers <= rule.maxSize
      );

      return {
        adjustment: applicableRule?.multiplier || 1,
        description: applicableRule?.description || 'Sin descuento de grupo',
        rule: applicableRule
      };

    } catch (error) {
      console.error('❌ Error calculando modificador de grupo:', error);
      return { adjustment: 1, description: 'Error en cálculo de grupo' };
    }
  }

  // ==============================================
  // 🌍 PRECIOS ESTACIONALES
  // ==============================================

  async calculateSeasonalModifier(packageId, travelDate) {
    try {
      const date = new Date(travelDate);
      const month = date.getMonth() + 1; // 1-12

      // Obtener reglas estacionales específicas del paquete
      const packageSeasonalRules = await query(`
        SELECT * FROM seasonal_pricing 
        WHERE package_id = $1 
        AND is_active = true
        AND start_date <= $2 
        AND end_date >= $2
        ORDER BY priority DESC
        LIMIT 1
      `, [packageId, date]);

      if (packageSeasonalRules.rows.length > 0) {
        const rule = packageSeasonalRules.rows[0];
        return {
          adjustment: rule.price_multiplier,
          description: rule.description,
          season: rule.season_name
        };
      }

      // Reglas estacionales generales por mes
      const generalSeasonalRules = {
        // Verano (alta temporada en Argentina - Dec, Jan, Feb)
        12: { multiplier: 1.3, description: 'Alta temporada - Diciembre' },
        1: { multiplier: 1.4, description: 'Alta temporada - Enero' },
        2: { multiplier: 1.3, description: 'Alta temporada - Febrero' },
        
        // Otoño (media temporada - Mar, Apr, May)
        3: { multiplier: 1.1, description: 'Media temporada - Marzo' },
        4: { multiplier: 1.0, description: 'Temporada normal - Abril' },
        5: { multiplier: 1.0, description: 'Temporada normal - Mayo' },
        
        // Invierno (baja temporada - Jun, Jul, Aug)
        6: { multiplier: 0.85, description: 'Baja temporada - Junio' },
        7: { multiplier: 0.80, description: 'Baja temporada - Julio' },
        8: { multiplier: 0.85, description: 'Baja temporada - Agosto' },
        
        // Primavera (media-alta temporada - Sep, Oct, Nov)
        9: { multiplier: 1.05, description: 'Media temporada - Septiembre' },
        10: { multiplier: 1.15, description: 'Alta temporada - Octubre' },
        11: { multiplier: 1.2, description: 'Alta temporada - Noviembre' }
      };

      const seasonalRule = generalSeasonalRules[month];
      
      return {
        adjustment: seasonalRule?.multiplier || 1,
        description: seasonalRule?.description || 'Temporada normal',
        season: 'general'
      };

    } catch (error) {
      console.error('❌ Error calculando modificador estacional:', error);
      return { adjustment: 1, description: 'Error en cálculo estacional' };
    }
  }

  // ==============================================
  // ⏰ DESCUENTOS POR RESERVA ANTICIPADA
  // ==============================================

  async calculateEarlyBirdDiscount(bookingDate, travelDate) {
    try {
      const booking = new Date(bookingDate);
      const travel = new Date(travelDate);
      const daysInAdvance = Math.floor((travel - booking) / (1000 * 60 * 60 * 24));

      // Reglas de descuento por reserva anticipada
      const earlyBirdRules = [
        { minDays: 180, discount: 0.15, description: 'Reserva súper anticipada (15% desc.)' },
        { minDays: 120, discount: 0.12, description: 'Reserva muy anticipada (12% desc.)' },
        { minDays: 90, discount: 0.10, description: 'Reserva anticipada (10% desc.)' },
        { minDays: 60, discount: 0.08, description: 'Reserva temprana (8% desc.)' },
        { minDays: 30, discount: 0.05, description: 'Reserva con tiempo (5% desc.)' }
      ];

      const applicableRule = earlyBirdRules.find(rule => daysInAdvance >= rule.minDays);

      if (applicableRule) {
        return {
          amount: 0, // Se calcula como porcentaje en el precio final
          percentage: applicableRule.discount,
          description: applicableRule.description,
          daysInAdvance
        };
      }

      return {
        amount: 0,
        percentage: 0,
        description: 'Sin descuento por reserva anticipada',
        daysInAdvance
      };

    } catch (error) {
      console.error('❌ Error calculando descuento early bird:', error);
      return { amount: 0, percentage: 0, description: 'Error en cálculo early bird' };
    }
  }

  // ==============================================
  // 👤 DESCUENTOS POR TIPO DE CLIENTE
  // ==============================================

  async calculateCustomerTypeDiscount(customerType, currentPrice) {
    try {
      const discountRules = {
        regular: { percentage: 0, description: 'Cliente regular' },
        premium: { percentage: 0.05, description: 'Cliente premium (5% desc.)' },
        agency: { percentage: 0.15, description: 'Agencia de viajes (15% desc.)' },
        corporate: { percentage: 0.10, description: 'Cliente corporativo (10% desc.)' },
        returning: { percentage: 0.08, description: 'Cliente recurrente (8% desc.)' }
      };

      const rule = discountRules[customerType] || discountRules.regular;
      const discountAmount = currentPrice * rule.percentage;

      return {
        amount: discountAmount,
        percentage: rule.percentage,
        description: rule.description
      };

    } catch (error) {
      console.error('❌ Error calculando descuento por tipo de cliente:', error);
      return { amount: 0, percentage: 0, description: 'Error en descuento de cliente' };
    }
  }

  // ==============================================
  // 🎫 CÓDIGOS PROMOCIONALES
  // ==============================================

  async applyPromoCode(promoCode, currentPrice, packageId = null) {
    try {
      // Buscar código promocional en base de datos
      const result = await query(`
        SELECT * FROM promo_codes 
        WHERE code = $1 
        AND is_active = true 
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (usage_limit IS NULL OR usage_count < usage_limit)
      `, [promoCode.toUpperCase()]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Código promocional no válido o expirado'
        };
      }

      const promo = result.rows[0];

      // Verificar si aplica al paquete específico
      if (promo.applicable_packages && packageId) {
        const applicablePackages = JSON.parse(promo.applicable_packages);
        if (!applicablePackages.includes(packageId)) {
          return {
            success: false,
            error: 'Código promocional no válido para este paquete'
          };
        }
      }

      // Verificar monto mínimo
      if (promo.minimum_amount && currentPrice < promo.minimum_amount) {
        return {
          success: false,
          error: `Monto mínimo requerido: ${promo.minimum_amount} ${promo.currency || 'USD'}`
        };
      }

      // Calcular descuento
      let discountAmount = 0;
      if (promo.discount_type === 'percentage') {
        discountAmount = currentPrice * (promo.discount_value / 100);
        // Aplicar máximo descuento si está definido
        if (promo.max_discount_amount) {
          discountAmount = Math.min(discountAmount, promo.max_discount_amount);
        }
      } else if (promo.discount_type === 'fixed') {
        discountAmount = promo.discount_value;
      }

      // No permitir descuento mayor al precio
      discountAmount = Math.min(discountAmount, currentPrice);

      // Incrementar contador de uso
      await query(`
        UPDATE promo_codes 
        SET usage_count = usage_count + 1,
            last_used_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [promo.id]);

      return {
        success: true,
        amount: discountAmount,
        description: promo.description || `Descuento con código ${promoCode}`,
        promoDetails: {
          type: promo.discount_type,
          value: promo.discount_value,
          maxDiscount: promo.max_discount_amount
        }
      };

    } catch (error) {
      console.error('❌ Error aplicando código promocional:', error);
      return {
        success: false,
        error: 'Error procesando código promocional'
      };
    }
  }

  // ==============================================
  // 🧮 CÁLCULO DE IMPUESTOS
  // ==============================================

  async calculateTaxes(price, packageId = null) {
    try {
      // Obtener configuración de impuestos
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const paymentConfig = await settingsManager.getPaymentConfig();
      
      let taxPercentage = 21; // IVA por defecto en Argentina
      if (paymentConfig.success) {
        taxPercentage = paymentConfig.config.general.taxPercentage || 21;
      }

      // Verificar si hay impuestos específicos para el paquete
      if (packageId) {
        const packageTaxResult = await query(`
          SELECT tax_percentage FROM packages 
          WHERE package_id = $1 OR id = $1
        `, [packageId]);

        if (packageTaxResult.rows.length > 0 && packageTaxResult.rows[0].tax_percentage) {
          taxPercentage = packageTaxResult.rows[0].tax_percentage;
        }
      }

      const taxAmount = price * (taxPercentage / 100);

      return {
        amount: Math.round(taxAmount * 100) / 100,
        percentage: taxPercentage,
        description: `IVA (${taxPercentage}%)`
      };

    } catch (error) {
      console.error('❌ Error calculando impuestos:', error);
      return {
        amount: 0,
        percentage: 0,
        description: 'Error en cálculo de impuestos'
      };
    }
  }

  // ==============================================
  // 💱 CONVERSIÓN DE MONEDA
  // ==============================================

  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return {
          success: true,
          amount,
          rate: 1,
          from: fromCurrency,
          to: toCurrency
        };
      }

      // Obtener tasa de cambio actual
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      if (!exchangeRate.success) {
        return {
          success: false,
          error: 'No se pudo obtener tasa de cambio'
        };
      }

      const convertedAmount = amount * exchangeRate.rate;

      return {
        success: true,
        amount: Math.round(convertedAmount * 100) / 100,
        rate: exchangeRate.rate,
        from: fromCurrency,
        to: toCurrency,
        updatedAt: exchangeRate.updatedAt
      };

    } catch (error) {
      console.error('❌ Error convirtiendo moneda:', error);
      return {
        success: false,
        error: 'Error en conversión de moneda'
      };
    }
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      // Verificar cache de tasas
      const cacheKey = `${fromCurrency}_${toCurrency}`;
      const cachedRate = this.currencyRates.get(cacheKey);
      
      const now = Date.now();
      const cacheValidTime = 60 * 60 * 1000; // 1 hora

      if (cachedRate && (now - cachedRate.timestamp) < cacheValidTime) {
        return {
          success: true,
          rate: cachedRate.rate,
          updatedAt: new Date(cachedRate.timestamp).toISOString()
        };
      }

      // Buscar en base de datos
      const dbResult = await query(`
        SELECT rate, updated_at FROM exchange_rates 
        WHERE from_currency = $1 AND to_currency = $2
        AND updated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        ORDER BY updated_at DESC
        LIMIT 1
      `, [fromCurrency, toCurrency]);

      if (dbResult.rows.length > 0) {
        const rate = parseFloat(dbResult.rows[0].rate);
        
        // Actualizar cache
        this.currencyRates.set(cacheKey, {
          rate,
          timestamp: now
        });

        return {
          success: true,
          rate,
          updatedAt: dbResult.rows[0].updated_at
        };
      }

      // Si no hay datos recientes, usar tasa por defecto
      const defaultRates = {
        'USD_ARS': 850,
        'ARS_USD': 1/850,
        'EUR_USD': 1.1,
        'USD_EUR': 1/1.1
      };

      const defaultRate = defaultRates[cacheKey] || defaultRates[`${toCurrency}_${fromCurrency}`] ? 
        1/defaultRates[`${toCurrency}_${fromCurrency}`] : 1;

      // Guardar tasa por defecto en cache y BD
      this.currencyRates.set(cacheKey, {
        rate: defaultRate,
        timestamp: now
      });

      await query(`
        INSERT INTO exchange_rates (from_currency, to_currency, rate, source)
        VALUES ($1, $2, $3, 'default')
        ON CONFLICT (from_currency, to_currency) DO UPDATE SET
          rate = EXCLUDED.rate,
          updated_at = CURRENT_TIMESTAMP
      `, [fromCurrency, toCurrency, defaultRate]);

      return {
        success: true,
        rate: defaultRate,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error obteniendo tasa de cambio:', error);
      return {
        success: false,
        error: 'Error obteniendo tasa de cambio'
      };
    }
  }

  // ==============================================
  // 📊 ANÁLISIS DE PRECIOS Y COMPETENCIA
  // ==============================================

  async analyzePriceCompetitiveness(packageId, calculatedPrice, currency = 'USD') {
    try {
      // Obtener precios de paquetes similares
      const similarPackages = await query(`
        SELECT 
          package_id,
          title,
          price_amount,
          price_currency,
          destination,
          duration_days
        FROM packages 
        WHERE id != $1
        AND destination = (SELECT destination FROM packages WHERE package_id = $1 OR id = $1)
        AND status = 'active'
        ORDER BY ABS(price_amount - $2)
        LIMIT 10
      `, [packageId, calculatedPrice]);

      if (similarPackages.rows.length === 0) {
        return {
          success: true,
          competitiveness: 'unknown',
          message: 'No se encontraron paquetes similares para comparar'
        };
      }

      const prices = similarPackages.rows.map(p => p.price_amount);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      let competitiveness = 'competitive';
      let message = 'Precio competitivo';

      if (calculatedPrice < minPrice) {
        competitiveness = 'very_competitive';
        message = 'Precio muy competitivo (menor que la competencia)';
      } else if (calculatedPrice > maxPrice) {
        competitiveness = 'expensive';
        message = 'Precio alto comparado con la competencia';
      } else if (calculatedPrice > avgPrice * 1.2) {
        competitiveness = 'above_average';
        message = 'Precio por encima del promedio';
      } else if (calculatedPrice < avgPrice * 0.8) {
        competitiveness = 'below_average';
        message = 'Precio por debajo del promedio';
      }

      return {
        success: true,
        competitiveness,
        message,
        analysis: {
          calculatedPrice,
          avgMarketPrice: Math.round(avgPrice * 100) / 100,
          minMarketPrice: minPrice,
          maxMarketPrice: maxPrice,
          percentageVsAverage: Math.round(((calculatedPrice / avgPrice) - 1) * 100 * 100) / 100,
          similarPackagesCount: similarPackages.rows.length
        }
      };

    } catch (error) {
      console.error('❌ Error analizando competitividad de precios:', error);
      return {
        success: false,
        error: 'Error en análisis de competitividad'
      };
    }
  }
}

module.exports = PricingEngine;
