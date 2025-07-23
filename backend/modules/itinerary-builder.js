// ==============================================
// 🗺️ CONSTRUCTOR DE ITINERARIOS INTELIGENTE
// ==============================================
// Sistema avanzado para crear y gestionar itinerarios de viaje personalizados

const { query } = require('../database');

class ItineraryBuilder {
  constructor() {
    this.templates = new Map();
    this.destinations = new Map();
    this.activities = new Map();
    this.constraints = new Map();
  }

  // ==============================================
  // 🎯 CONSTRUCCIÓN PRINCIPAL DE ITINERARIOS
  // ==============================================

  async buildItinerary(packageData, preferences = {}) {
    try {
      const {
        packageId,
        destination,
        duration,
        travelers,
        budget,
        travelStyle = 'balanced', // 'luxury', 'budget', 'adventure', 'cultural', 'relaxed'
        interests = [],
        mobility = 'normal', // 'normal', 'limited', 'high'
        accommodationType = 'hotel',
        startDate,
        customRequests = []
      } = { ...packageData, ...preferences };

      console.log(`🗺️ Construyendo itinerario para ${destination}, ${duration} días`);

      // 1. Obtener información base del destino
      const destinationInfo = await this.getDestinationInfo(destination);
      if (!destinationInfo.success) {
        return { success: false, error: 'Información de destino no disponible' };
      }

      // 2. Cargar template base según duración y estilo
      const baseTemplate = await this.getItineraryTemplate(duration, travelStyle, destination);
      
      // 3. Seleccionar actividades según intereses
      const activities = await this.selectActivities(destination, interests, duration, travelStyle);
      
      // 4. Optimizar secuencia geográfica
      const optimizedSequence = await this.optimizeGeographicalSequence(activities.activities, destinationInfo.info);
      
      // 5. Asignar actividades por día
      const dailyItinerary = await this.distributeDailyActivities(optimizedSequence, duration, travelStyle);
      
      // 6. Agregar recomendaciones de alojamiento
      const accommodations = await this.recommendAccommodations(destination, accommodationType, duration);
      
      // 7. Calcular tiempos de traslado
      const withTransfers = await this.calculateTransferTimes(dailyItinerary, accommodations.recommendations);
      
      // 8. Agregar recomendaciones gastronómicas
      const withDining = await this.addDiningRecommendations(withTransfers, destination, travelStyle);
      
      // 9. Incluir tips y recomendaciones locales
      const finalItinerary = await this.addLocalTipsAndRecommendations(withDining, destinationInfo.info);

      // 10. Generar resumen ejecutivo
      const summary = await this.generateItinerarySummary(finalItinerary, packageData);

      return {
        success: true,
        itinerary: {
          id: `ITN-${Date.now()}`,
          packageId,
          destination,
          duration,
          travelStyle,
          generatedAt: new Date().toISOString(),
          summary,
          dailyPlan: finalItinerary,
          accommodations: accommodations.recommendations,
          totalActivities: activities.activities.length,
          estimatedBudget: await this.estimateItineraryBudget(finalItinerary, accommodations.recommendations),
          tips: destinationInfo.info.localTips || [],
          emergencyContacts: destinationInfo.info.emergencyContacts || [],
          weatherInfo: await this.getWeatherInfo(destination, startDate, duration)
        }
      };

    } catch (error) {
      console.error('❌ Error construyendo itinerario:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🏛️ INFORMACIÓN DE DESTINOS
  // ==============================================

  async getDestinationInfo(destination) {
    try {
      const result = await query(`
        SELECT 
          d.*,
          COUNT(a.id) as activities_count,
          AVG(a.rating) as avg_activity_rating
        FROM destinations d
        LEFT JOIN activities a ON d.id = a.destination_id AND a.is_active = true
        WHERE d.name ILIKE $1 OR d.country ILIKE $1
        AND d.is_active = true
        GROUP BY d.id
        ORDER BY activities_count DESC
        LIMIT 1
      `, [`%${destination}%`]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Destino no encontrado' };
      }

      const destinationData = result.rows[0];

      // Obtener información adicional
      const attractions = await query(`
        SELECT name, type, rating, description, coordinates, opening_hours, price_range
        FROM attractions 
        WHERE destination_id = $1 AND is_active = true
        ORDER BY rating DESC, popularity DESC
        LIMIT 20
      `, [destinationData.id]);

      const restaurants = await query(`
        SELECT name, cuisine_type, rating, price_range, description, coordinates
        FROM restaurants 
        WHERE destination_id = $1 AND is_active = true
        ORDER BY rating DESC
        LIMIT 15
      `, [destinationData.id]);

      return {
        success: true,
        info: {
          ...destinationData,
          topAttractions: attractions.rows,
          recommendedRestaurants: restaurants.rows,
          localTips: JSON.parse(destinationData.local_tips || '[]'),
          emergencyContacts: JSON.parse(destinationData.emergency_contacts || '[]'),
          transportation: JSON.parse(destinationData.transportation_info || '{}'),
          climate: JSON.parse(destinationData.climate_info || '{}')
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo información de destino:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📋 TEMPLATES DE ITINERARIOS
  // ==============================================

  async getItineraryTemplate(duration, travelStyle, destination) {
    try {
      // Buscar template específico
      const specificTemplate = await query(`
        SELECT * FROM itinerary_templates 
        WHERE destination ILIKE $1 
        AND duration_days = $2 
        AND travel_style = $3
        AND is_active = true
        ORDER BY rating DESC, usage_count DESC
        LIMIT 1
      `, [`%${destination}%`, duration, travelStyle]);

      if (specificTemplate.rows.length > 0) {
        return {
          template: JSON.parse(specificTemplate.rows[0].template_data),
          source: 'specific',
          templateId: specificTemplate.rows[0].id
        };
      }

      // Template genérico por estilo y duración
      const genericTemplate = await query(`
        SELECT * FROM itinerary_templates 
        WHERE destination IS NULL 
        AND duration_days = $1 
        AND travel_style = $2
        AND is_active = true
        ORDER BY rating DESC
        LIMIT 1
      `, [duration, travelStyle]);

      if (genericTemplate.rows.length > 0) {
        return {
          template: JSON.parse(genericTemplate.rows[0].template_data),
          source: 'generic',
          templateId: genericTemplate.rows[0].id
        };
      }

      // Template por defecto
      return {
        template: this.getDefaultTemplate(duration, travelStyle),
        source: 'default',
        templateId: null
      };

    } catch (error) {
      console.error('❌ Error obteniendo template de itinerario:', error);
      return {
        template: this.getDefaultTemplate(duration, travelStyle),
        source: 'error',
        templateId: null
      };
    }
  }

  getDefaultTemplate(duration, travelStyle) {
    const styleConfigs = {
      luxury: {
        activitiesPerDay: { min: 2, max: 3 },
        pace: 'relaxed',
        freeTime: 0.3,
        categories: ['cultural', 'gastronomy', 'luxury', 'relaxation']
      },
      budget: {
        activitiesPerDay: { min: 3, max: 5 },
        pace: 'active',
        freeTime: 0.2,
        categories: ['cultural', 'nature', 'walking', 'local']
      },
      adventure: {
        activitiesPerDay: { min: 2, max: 4 },
        pace: 'active',
        freeTime: 0.15,
        categories: ['adventure', 'nature', 'sports', 'outdoor']
      },
      cultural: {
        activitiesPerDay: { min: 3, max: 4 },
        pace: 'moderate',
        freeTime: 0.25,
        categories: ['cultural', 'historical', 'museums', 'local']
      },
      relaxed: {
        activitiesPerDay: { min: 1, max: 3 },
        pace: 'slow',
        freeTime: 0.4,
        categories: ['relaxation', 'nature', 'gastronomy', 'wellness']
      },
      balanced: {
        activitiesPerDay: { min: 2, max: 4 },
        pace: 'moderate',
        freeTime: 0.25,
        categories: ['cultural', 'nature', 'gastronomy', 'local']
      }
    };

    const config = styleConfigs[travelStyle] || styleConfigs.balanced;

    return {
      duration,
      travelStyle,
      config,
      dailyStructure: {
        morning: { start: '09:00', activities: 1 },
        afternoon: { start: '14:00', activities: 1 },
        evening: { start: '19:00', activities: 1 }
      }
    };
  }

  // ==============================================
  // 🎭 SELECCIÓN DE ACTIVIDADES
  // ==============================================

  async selectActivities(destination, interests, duration, travelStyle) {
    try {
      const template = await this.getItineraryTemplate(duration, travelStyle, destination);
      const config = template.template.config || this.getDefaultTemplate(duration, travelStyle).config;
      
      const totalActivitiesNeeded = duration * ((config.activitiesPerDay.min + config.activitiesPerDay.max) / 2);

      // Construir filtros de búsqueda
      let categories = config.categories;
      if (interests.length > 0) {
        categories = [...new Set([...categories, ...interests])];
      }

      const activitiesQuery = `
        SELECT 
          a.*,
          CASE 
            WHEN a.category = ANY($2) THEN 2
            WHEN a.subcategory = ANY($2) THEN 1.5
            ELSE 1
          END as relevance_score,
          CASE 
            WHEN a.duration_hours <= 2 THEN 'short'
            WHEN a.duration_hours <= 4 THEN 'medium'
            ELSE 'long'
          END as duration_category
        FROM activities a
        JOIN destinations d ON a.destination_id = d.id
        WHERE d.name ILIKE $1
        AND a.is_active = true
        AND (a.category = ANY($2) OR a.subcategory = ANY($2) OR $3 = true)
        ORDER BY relevance_score DESC, a.rating DESC, a.popularity DESC
        LIMIT $4
      `;

      const activities = await query(activitiesQuery, [
        `%${destination}%`,
        categories,
        interests.length === 0, // Si no hay intereses específicos, incluir todo
        Math.ceil(totalActivitiesNeeded * 1.5) // Obtener más para tener opciones
      ]);

      // Categorizar actividades por tipo y duración
      const categorizedActivities = {
        mustSee: activities.rows.filter(a => a.is_must_see || a.rating >= 4.5).slice(0, Math.ceil(duration * 0.5)),
        cultural: activities.rows.filter(a => a.category === 'cultural' || a.category === 'historical'),
        nature: activities.rows.filter(a => a.category === 'nature' || a.category === 'outdoor'),
        gastronomy: activities.rows.filter(a => a.category === 'gastronomy' || a.category === 'food'),
        entertainment: activities.rows.filter(a => a.category === 'entertainment' || a.category === 'nightlife'),
        short: activities.rows.filter(a => a.duration_hours <= 2),
        medium: activities.rows.filter(a => a.duration_hours > 2 && a.duration_hours <= 4),
        long: activities.rows.filter(a => a.duration_hours > 4)
      };

      return {
        success: true,
        activities: activities.rows,
        categorized: categorizedActivities,
        totalFound: activities.rows.length,
        totalNeeded: Math.ceil(totalActivitiesNeeded)
      };

    } catch (error) {
      console.error('❌ Error seleccionando actividades:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🧭 OPTIMIZACIÓN GEOGRÁFICA
  // ==============================================

  async optimizeGeographicalSequence(activities, destinationInfo) {
    try {
      if (!activities || activities.length === 0) {
        return [];
      }

      // Agrupar actividades por zona geográfica
      const zones = new Map();
      
      activities.forEach(activity => {
        const coords = activity.coordinates;
        if (coords && coords.lat && coords.lng) {
          // Crear zonas basadas en proximidad
          const zoneKey = `${Math.round(coords.lat * 100)}-${Math.round(coords.lng * 100)}`;
          
          if (!zones.has(zoneKey)) {
            zones.set(zoneKey, {
              id: zoneKey,
              centerLat: coords.lat,
              centerLng: coords.lng,
              activities: []
            });
          }
          
          zones.get(zoneKey).activities.push(activity);
        }
      });

      // Ordenar zonas para minimizar desplazamientos
      const sortedZones = Array.from(zones.values()).sort((a, b) => {
        // Ordenar por importancia (cantidad de actividades must-see) y luego geográficamente
        const aMustSee = a.activities.filter(act => act.is_must_see).length;
        const bMustSee = b.activities.filter(act => act.is_must_see).length;
        
        if (aMustSee !== bMustSee) {
          return bMustSee - aMustSee;
        }
        
        // Si tienen igual cantidad de must-see, ordenar geográficamente (norte a sur)
        return b.centerLat - a.centerLat;
      });

      // Reorganizar actividades manteniendo la lógica de zonas
      const optimizedSequence = [];
      sortedZones.forEach(zone => {
        // Dentro de cada zona, ordenar por rating y popularidad
        const sortedActivities = zone.activities.sort((a, b) => {
          if (a.is_must_see !== b.is_must_see) {
            return b.is_must_see - a.is_must_see;
          }
          return (b.rating * b.popularity) - (a.rating * a.popularity);
        });
        
        optimizedSequence.push(...sortedActivities);
      });

      return optimizedSequence;

    } catch (error) {
      console.error('❌ Error optimizando secuencia geográfica:', error);
      return activities; // Devolver sin optimizar si hay error
    }
  }

  // ==============================================
  // 📅 DISTRIBUCIÓN DIARIA
  // ==============================================

  async distributeDailyActivities(activities, duration, travelStyle) {
    try {
      const template = this.getDefaultTemplate(duration, travelStyle);
      const config = template.config;
      
      const dailyItinerary = [];
      let activityIndex = 0;

      for (let day = 1; day <= duration; day++) {
        const dayPlan = {
          day,
          date: null, // Se calculará cuando se tenga fecha de inicio
          activities: {
            morning: [],
            afternoon: [],
            evening: []
          },
          meals: {
            breakfast: null,
            lunch: null,
            dinner: null
          },
          accommodation: null,
          freeTime: config.freeTime,
          notes: [],
          estimatedBudget: 0
        };

        // Determinar cantidad de actividades para este día
        const minActivities = config.activitiesPerDay.min;
        const maxActivities = config.activitiesPerDay.max;
        const activitiesForDay = Math.min(
          minActivities + Math.floor(Math.random() * (maxActivities - minActivities + 1)),
          activities.length - activityIndex
        );

        // Distribuir actividades en franjas horarias
        for (let i = 0; i < activitiesForDay && activityIndex < activities.length; i++) {
          const activity = activities[activityIndex];
          const timeSlot = this.determineTimeSlot(activity, i, activitiesForDay);
          
          dayPlan.activities[timeSlot].push({
            ...activity,
            startTime: this.calculateStartTime(timeSlot, i),
            duration: activity.duration_hours || 2,
            transportation: this.suggestTransportation(activity)
          });
          
          activityIndex++;
        }

        // Ajustar el primer y último día
        if (day === 1) {
          dayPlan.notes.push('Día de llegada - actividades más relajadas');
          // Reducir actividades del primer día
          if (dayPlan.activities.morning.length > 0) {
            dayPlan.activities.morning = dayPlan.activities.morning.slice(0, 1);
          }
        }

        if (day === duration) {
          dayPlan.notes.push('Día de partida - verificar horarios de vuelo');
          // Reducir actividades del último día
          if (dayPlan.activities.evening.length > 0) {
            dayPlan.activities.evening = [];
          }
        }

        dailyItinerary.push(dayPlan);
      }

      return dailyItinerary;

    } catch (error) {
      console.error('❌ Error distribuyendo actividades diarias:', error);
      return [];
    }
  }

  determineTimeSlot(activity, index, totalActivities) {
    // Lógica para determinar la franja horaria más apropiada
    if (activity.recommended_time) {
      const recTime = activity.recommended_time.toLowerCase();
      if (recTime.includes('morning') || recTime.includes('mañana')) return 'morning';
      if (recTime.includes('evening') || recTime.includes('noche')) return 'evening';
      return 'afternoon';
    }

    // Si es una actividad larga, preferir mañana
    if (activity.duration_hours > 4) return 'morning';
    
    // Si es entretenimiento/vida nocturna, preferir noche
    if (activity.category === 'entertainment' || activity.category === 'nightlife') {
      return 'evening';
    }

    // Distribución equilibrada
    const slots = ['morning', 'afternoon', 'evening'];
    return slots[index % 3];
  }

  calculateStartTime(timeSlot, index) {
    const baseTimes = {
      morning: { start: 9, increment: 2 },
      afternoon: { start: 14, increment: 2 },
      evening: { start: 19, increment: 1.5 }
    };

    const base = baseTimes[timeSlot];
    const hour = base.start + (index * base.increment);
    const minutes = Math.floor((hour % 1) * 60);
    const fullHour = Math.floor(hour);

    return `${fullHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  suggestTransportation(activity) {
    // Sugerir transporte basado en la actividad y ubicación
    if (activity.accessibility && activity.accessibility.includes('car_required')) {
      return { type: 'car', duration: '15-30 min', cost: 'moderate' };
    }
    
    if (activity.distance_from_center <= 2) {
      return { type: 'walking', duration: '10-15 min', cost: 'free' };
    }
    
    if (activity.distance_from_center <= 10) {
      return { type: 'public_transport', duration: '20-30 min', cost: 'low' };
    }
    
    return { type: 'taxi', duration: '30-45 min', cost: 'moderate' };
  }

  // ==============================================
  // 🏨 RECOMENDACIONES DE ALOJAMIENTO
  // ==============================================

  async recommendAccommodations(destination, accommodationType, duration) {
    try {
      const accommodationsQuery = `
        SELECT 
          h.*,
          AVG(r.rating) as avg_rating,
          COUNT(r.id) as review_count
        FROM hotels h
        LEFT JOIN hotel_reviews r ON h.id = r.hotel_id
        JOIN destinations d ON h.destination_id = d.id
        WHERE d.name ILIKE $1
        AND h.type = $2
        AND h.is_active = true
        GROUP BY h.id
        HAVING AVG(r.rating) >= 3.5 OR COUNT(r.id) = 0
        ORDER BY avg_rating DESC, h.price_per_night ASC
        LIMIT 10
      `;

      const accommodations = await query(accommodationsQuery, [
        `%${destination}%`,
        accommodationType
      ]);

      const recommendations = accommodations.rows.map(hotel => ({
        ...hotel,
        totalCost: hotel.price_per_night * (duration - 1), // Una noche menos que días
        amenities: JSON.parse(hotel.amenities || '[]'),
        coordinates: hotel.coordinates,
        distanceFromCenter: hotel.distance_from_center,
        rating: parseFloat(hotel.avg_rating) || 0,
        reviewCount: parseInt(hotel.review_count) || 0
      }));

      // Categorizar por precio
      const categorized = {
        budget: recommendations.filter(h => h.price_per_night < 100),
        mid_range: recommendations.filter(h => h.price_per_night >= 100 && h.price_per_night < 200),
        luxury: recommendations.filter(h => h.price_per_night >= 200)
      };

      return {
        success: true,
        recommendations,
        categorized,
        totalFound: recommendations.length
      };

    } catch (error) {
      console.error('❌ Error recomendando alojamientos:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🚗 CÁLCULO DE TIEMPOS DE TRASLADO
  // ==============================================

  async calculateTransferTimes(dailyItinerary, accommodations) {
    try {
      return dailyItinerary.map(day => {
        const updatedDay = { ...day };
        
        Object.keys(day.activities).forEach(timeSlot => {
          if (day.activities[timeSlot].length > 0) {
            day.activities[timeSlot].forEach((activity, index) => {
              if (index > 0) {
                // Calcular tiempo entre actividades
                const prevActivity = day.activities[timeSlot][index - 1];
                activity.transferFromPrevious = this.estimateTransferTime(
                  prevActivity.coordinates,
                  activity.coordinates
                );
              } else if (timeSlot === 'morning' && accommodations.length > 0) {
                // Tiempo desde el hotel a la primera actividad
                activity.transferFromHotel = this.estimateTransferTime(
                  accommodations[0].coordinates,
                  activity.coordinates
                );
              }
            });
          }
        });

        return updatedDay;
      });

    } catch (error) {
      console.error('❌ Error calculando tiempos de traslado:', error);
      return dailyItinerary;
    }
  }

  estimateTransferTime(fromCoords, toCoords) {
    if (!fromCoords || !toCoords) {
      return { duration: '15 min', distance: 'N/A', method: 'walking' };
    }

    // Calcular distancia usando fórmula de Haversine (aproximada)
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(toCoords.lat - fromCoords.lat);
    const dLon = this.deg2rad(toCoords.lng - fromCoords.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(fromCoords.lat)) * Math.cos(this.deg2rad(toCoords.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distancia en km

    let method, duration;
    if (distance < 0.5) {
      method = 'walking';
      duration = `${Math.ceil(distance * 12)} min`; // 12 min por km caminando
    } else if (distance < 2) {
      method = 'walking/bike';
      duration = `${Math.ceil(distance * 6)} min`; // 6 min por km en bici
    } else if (distance < 10) {
      method = 'public_transport';
      duration = `${Math.ceil(distance * 4)} min`; // 4 min por km en transporte público
    } else {
      method = 'taxi/car';
      duration = `${Math.ceil(distance * 3)} min`; // 3 min por km en coche
    }

    return {
      distance: `${distance.toFixed(1)} km`,
      duration,
      method
    };
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // ==============================================
  // 🍽️ RECOMENDACIONES GASTRONÓMICAS
  // ==============================================

  async addDiningRecommendations(dailyItinerary, destination, travelStyle) {
    try {
      // Obtener restaurantes del destino
      const restaurants = await query(`
        SELECT r.*, d.name as destination_name
        FROM restaurants r
        JOIN destinations d ON r.destination_id = d.id
        WHERE d.name ILIKE $1
        AND r.is_active = true
        ORDER BY r.rating DESC, r.price_range ASC
        LIMIT 30
      `, [`%${destination}%`]);

      // Categorizar restaurantes
      const categorizedRestaurants = {
        breakfast: restaurants.rows.filter(r => r.meal_types && r.meal_types.includes('breakfast')),
        lunch: restaurants.rows.filter(r => r.meal_types && (r.meal_types.includes('lunch') || r.meal_types.includes('all_day'))),
        dinner: restaurants.rows.filter(r => r.meal_types && (r.meal_types.includes('dinner') || r.meal_types.includes('all_day'))),
        byPriceRange: {
          budget: restaurants.rows.filter(r => r.price_range === 'budget' || r.price_range === 'low'),
          moderate: restaurants.rows.filter(r => r.price_range === 'moderate' || r.price_range === 'medium'),
          upscale: restaurants.rows.filter(r => r.price_range === 'upscale' || r.price_range === 'high')
        }
      };

      return dailyItinerary.map(day => {
        const updatedDay = { ...day };

        // Asignar restaurantes según el estilo de viaje
        const pricePreference = this.getPricePreferenceByStyle(travelStyle);
        
        // Desayuno
        if (categorizedRestaurants.breakfast.length > 0) {
          const breakfast = this.selectRandomFromCategory(categorizedRestaurants.breakfast, pricePreference);
          updatedDay.meals.breakfast = breakfast;
        }

        // Almuerzo
        if (categorizedRestaurants.lunch.length > 0) {
          const lunch = this.selectRandomFromCategory(categorizedRestaurants.lunch, pricePreference);
          updatedDay.meals.lunch = lunch;
        }

        // Cena
        if (categorizedRestaurants.dinner.length > 0) {
          const dinner = this.selectRandomFromCategory(categorizedRestaurants.dinner, pricePreference);
          updatedDay.meals.dinner = dinner;
        }

        return updatedDay;
      });

    } catch (error) {
      console.error('❌ Error agregando recomendaciones gastronómicas:', error);
      return dailyItinerary;
    }
  }

  getPricePreferenceByStyle(travelStyle) {
    const preferences = {
      luxury: ['upscale', 'moderate'],
      budget: ['budget', 'moderate'],
      adventure: ['budget', 'moderate'],
      cultural: ['moderate', 'upscale'],
      relaxed: ['moderate', 'upscale'],
      balanced: ['moderate', 'budget']
    };
    
    return preferences[travelStyle] || ['moderate', 'budget'];
  }

  selectRandomFromCategory(restaurants, pricePreferences) {
    // Filtrar por preferencia de precio
    let filtered = restaurants.filter(r => pricePreferences.includes(r.price_range));
    
    if (filtered.length === 0) {
      filtered = restaurants; // Si no hay coincidencias, usar todos
    }

    // Seleccionar uno al azar, pero con peso hacia mejor rating
    const weighted = filtered.map(r => ({
      ...r,
      weight: r.rating * r.rating // Elevar al cuadrado para dar más peso a ratings altos
    }));

    const totalWeight = weighted.reduce((sum, r) => sum + r.weight, 0);
    const random = Math.random() * totalWeight;
    
    let accumulated = 0;
    for (const restaurant of weighted) {
      accumulated += restaurant.weight;
      if (random <= accumulated) {
        return restaurant;
      }
    }

    return weighted[0]; // Fallback
  }

  // ==============================================
  // 💡 TIPS Y RECOMENDACIONES LOCALES
  // ==============================================

  async addLocalTipsAndRecommendations(dailyItinerary, destinationInfo) {
    try {
      const localTips = destinationInfo.localTips || [];
      const generalTips = [
        'Mantén copias de tus documentos importantes',
        'Lleva siempre contigo el número de emergencia local',
        'Respeta las costumbres y tradiciones locales',
        'Prueba la gastronomía típica de la región',
        'Mantente hidratado durante las actividades'
      ];

      return dailyItinerary.map((day, index) => {
        const updatedDay = { ...day };
        
        // Agregar tips específicos del día
        if (index === 0) {
          updatedDay.tips = [
            'Primer día: tómate tiempo para adaptarte al nuevo entorno',
            'Verifica los horarios de las actividades planificadas',
            ...localTips.slice(0, 2)
          ];
        } else if (index === dailyItinerary.length - 1) {
          updatedDay.tips = [
            'Último día: confirma horarios de vuelo y check-out',
            'Considera comprar souvenirs locales',
            'Deja tiempo extra para llegar al aeropuerto'
          ];
        } else {
          // Días intermedios: tips aleatorios
          const randomTips = this.shuffleArray([...localTips, ...generalTips]).slice(0, 3);
          updatedDay.tips = randomTips;
        }

        // Agregar recomendaciones climáticas
        if (destinationInfo.climate) {
          updatedDay.weatherTips = this.getWeatherTips(destinationInfo.climate);
        }

        return updatedDay;
      });

    } catch (error) {
      console.error('❌ Error agregando tips locales:', error);
      return dailyItinerary;
    }
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getWeatherTips(climateInfo) {
    const tips = [];
    
    if (climateInfo.avgTemperature) {
      if (climateInfo.avgTemperature > 25) {
        tips.push('Usa protector solar y mantente hidratado');
        tips.push('Ropa ligera y cómoda es recomendada');
      } else if (climateInfo.avgTemperature < 15) {
        tips.push('Lleva ropa abrigada para las noches');
        tips.push('Considera capas de ropa para adaptarte al clima');
      }
    }

    if (climateInfo.rainfall && climateInfo.rainfall > 50) {
      tips.push('Lleva paraguas o impermeable');
    }

    return tips;
  }

  // ==============================================
  // 📊 RESUMEN Y PRESUPUESTO
  // ==============================================

  async generateItinerarySummary(dailyItinerary, packageData) {
    try {
      const totalActivities = dailyItinerary.reduce((sum, day) => {
        return sum + Object.values(day.activities).reduce((daySum, timeSlot) => daySum + timeSlot.length, 0);
      }, 0);

      const categoryCounts = {};
      const museumsCount = 0;
      let outdoorActivities = 0;
      let culturalActivities = 0;

      dailyItinerary.forEach(day => {
        Object.values(day.activities).forEach(timeSlot => {
          timeSlot.forEach(activity => {
            categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
            
            if (activity.category === 'outdoor' || activity.category === 'nature') {
              outdoorActivities++;
            }
            if (activity.category === 'cultural' || activity.category === 'historical') {
              culturalActivities++;
            }
          });
        });
      });

      return {
        totalDays: dailyItinerary.length,
        totalActivities,
        activitiesPerDay: Math.round(totalActivities / dailyItinerary.length * 10) / 10,
        categoriesBreakdown: categoryCounts,
        highlights: {
          culturalActivities,
          outdoorActivities,
          museumsCount,
          restaurantsIncluded: dailyItinerary.filter(day => day.meals.lunch || day.meals.dinner).length
        },
        difficulty: this.calculateDifficultyLevel(dailyItinerary),
        pace: this.calculatePaceLevel(dailyItinerary)
      };

    } catch (error) {
      console.error('❌ Error generando resumen de itinerario:', error);
      return {
        totalDays: dailyItinerary.length,
        totalActivities: 0,
        error: 'Error generando resumen'
      };
    }
  }

  calculateDifficultyLevel(dailyItinerary) {
    let difficultyScore = 0;
    let totalActivities = 0;

    dailyItinerary.forEach(day => {
      Object.values(day.activities).forEach(timeSlot => {
        timeSlot.forEach(activity => {
          totalActivities++;
          if (activity.difficulty_level) {
            const difficultyMap = { easy: 1, moderate: 2, challenging: 3, difficult: 4 };
            difficultyScore += difficultyMap[activity.difficulty_level] || 2;
          } else {
            difficultyScore += 2; // Por defecto moderado
          }
        });
      });
    });

    const averageDifficulty = totalActivities > 0 ? difficultyScore / totalActivities : 2;
    
    if (averageDifficulty <= 1.5) return 'easy';
    if (averageDifficulty <= 2.5) return 'moderate';
    if (averageDifficulty <= 3.5) return 'challenging';
    return 'difficult';
  }

  calculatePaceLevel(dailyItinerary) {
    const totalActivities = dailyItinerary.reduce((sum, day) => {
      return sum + Object.values(day.activities).reduce((daySum, timeSlot) => daySum + timeSlot.length, 0);
    }, 0);

    const avgActivitiesPerDay = totalActivities / dailyItinerary.length;
    
    if (avgActivitiesPerDay <= 2) return 'relaxed';
    if (avgActivitiesPerDay <= 3.5) return 'moderate';
    return 'active';
  }

  async estimateItineraryBudget(dailyItinerary, accommodations) {
    try {
      let totalBudget = 0;

      // Presupuesto de actividades
      dailyItinerary.forEach(day => {
        Object.values(day.activities).forEach(timeSlot => {
          timeSlot.forEach(activity => {
            if (activity.price_range) {
              const priceMap = {
                free: 0,
                low: 25,
                moderate: 50,
                high: 100,
                premium: 200
              };
              totalBudget += priceMap[activity.price_range] || 50;
            }
          });
        });
      });

      // Presupuesto de comidas
      const mealBudgetPerDay = 75; // USD promedio por día
      totalBudget += dailyItinerary.length * mealBudgetPerDay;

      // Presupuesto de alojamiento
      if (accommodations && accommodations.length > 0) {
        const avgAccommodationPrice = accommodations.reduce((sum, acc) => sum + acc.price_per_night, 0) / accommodations.length;
        totalBudget += avgAccommodationPrice * (dailyItinerary.length - 1);
      }

      // Presupuesto de transporte local (estimado)
      const transportBudgetPerDay = 30;
      totalBudget += dailyItinerary.length * transportBudgetPerDay;

      return {
        total: Math.round(totalBudget),
        breakdown: {
          activities: Math.round(totalBudget * 0.3),
          meals: dailyItinerary.length * mealBudgetPerDay,
          accommodation: accommodations.length > 0 ? Math.round(accommodations[0].price_per_night * (dailyItinerary.length - 1)) : 0,
          transport: dailyItinerary.length * transportBudgetPerDay
        },
        currency: 'USD',
        perPerson: true
      };

    } catch (error) {
      console.error('❌ Error estimando presupuesto:', error);
      return {
        total: 0,
        breakdown: {},
        error: 'Error calculando presupuesto'
      };
    }
  }

  // ==============================================
  // 🌤️ INFORMACIÓN CLIMÁTICA
  // ==============================================

  async getWeatherInfo(destination, startDate, duration) {
    try {
      // En una implementación real, aquí se consultaría un API de clima
      // Por ahora, devolver información genérica
      
      const currentMonth = startDate ? new Date(startDate).getMonth() + 1 : new Date().getMonth() + 1;
      
      const seasonalWeather = {
        1: { temp: '20-25°C', conditions: 'Verano - Calor y posibles lluvias', season: 'Verano' },
        2: { temp: '18-24°C', conditions: 'Verano - Calor intenso', season: 'Verano' },
        3: { temp: '15-22°C', conditions: 'Otoño - Temperaturas agradables', season: 'Otoño' },
        4: { temp: '12-18°C', conditions: 'Otoño - Fresco y seco', season: 'Otoño' },
        5: { temp: '8-15°C', conditions: 'Otoño - Frío', season: 'Otoño' },
        6: { temp: '5-12°C', conditions: 'Invierno - Frío intenso', season: 'Invierno' },
        7: { temp: '4-11°C', conditions: 'Invierno - Muy frío', season: 'Invierno' },
        8: { temp: '6-13°C', conditions: 'Invierno - Frío', season: 'Invierno' },
        9: { temp: '9-16°C', conditions: 'Primavera - Temperaturas suaves', season: 'Primavera' },
        10: { temp: '12-19°C', conditions: 'Primavera - Agradable', season: 'Primavera' },
        11: { temp: '15-22°C', conditions: 'Primavera - Cálido', season: 'Primavera' },
        12: { temp: '18-25°C', conditions: 'Verano - Inicio del calor', season: 'Verano' }
      };

      const weather = seasonalWeather[currentMonth] || seasonalWeather[6];

      return {
        destination,
        season: weather.season,
        expectedTemperature: weather.temp,
        generalConditions: weather.conditions,
        recommendations: [
          'Consulta el pronóstico actualizado antes de viajar',
          'Lleva ropa adecuada para la temporada',
          'Considera el clima al planificar actividades al aire libre'
        ],
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error obteniendo información climática:', error);
      return {
        error: 'Información climática no disponible',
        recommendations: ['Consulta el pronóstico local antes de viajar']
      };
    }
  }

  // ==============================================
  // 💾 GESTIÓN DE ITINERARIOS
  // ==============================================

  async saveItinerary(itineraryData, packageId, userId = null) {
    try {
      const result = await query(`
        INSERT INTO itineraries 
        (package_id, user_id, destination, duration, travel_style, itinerary_data, estimated_budget, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        packageId,
        userId,
        itineraryData.destination,
        itineraryData.duration,
        itineraryData.travelStyle,
        JSON.stringify(itineraryData),
        itineraryData.estimatedBudget?.total || 0
      ]);

      console.log(`✅ Itinerario guardado con ID: ${result.rows[0].id}`);
      return { success: true, itinerary: result.rows[0] };

    } catch (error) {
      console.error('❌ Error guardando itinerario:', error);
      return { success: false, error: error.message };
    }
  }

  async getItinerariesByPackage(packageId) {
    try {
      const result = await query(`
        SELECT * FROM itineraries 
        WHERE package_id = $1
        ORDER BY created_at DESC
      `, [packageId]);

      return {
        success: true,
        itineraries: result.rows.map(row => ({
          ...row,
          itinerary_data: JSON.parse(row.itinerary_data)
        }))
      };

    } catch (error) {
      console.error('❌ Error obteniendo itinerarios:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ItineraryBuilder;
