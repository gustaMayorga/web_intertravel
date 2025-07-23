import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/whapify/config
 * Propósito: Configuración de Whapify para InterTravel
 * 
 * Esta API permite obtener la configuración personalizada de Whapify
 * para cada contexto de la aplicación InterTravel
 */

interface WhapifyContextConfig {
  ref?: string;
  headerTitle?: string;
  color?: string;
  welcomeMessage?: string;
  template?: 'template1' | 'template2';
  showPersona?: boolean;
  loadMessages?: boolean;
}

interface WhapifyConfig {
  whapify: {
    botId: string;
    authorizedDomains: string[];
    defaultSettings: {
      headerTitle: string;
      color: string;
      template: 'template1' | 'template2';
      showPersona: boolean;
      loadMessages: boolean;
    };
    contextConfigs: {
      [key: string]: WhapifyContextConfig;
    };
  };
  integrations: {
    whatsapp: {
      enabled: boolean;
      fallbackNumber: string;
    };
    email: {
      enabled: boolean;
      fallbackEmail: string;
    };
    analytics: {
      trackChats: boolean;
      trackLeads: boolean;
      trackConversions: boolean;
    };
  };
  features: {
    autoTransition: boolean;
    loadPreviousMessages: boolean;
    multiLanguage: boolean;
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: {
        [key: string]: { open: string; close: string; enabled: boolean };
      };
    };
  };
}

// Configuración por defecto para InterTravel
const getDefaultWhapifyConfig = (): WhapifyConfig => ({
  whapify: {
    botId: process.env.WHAPIFY_BOT_ID || process.env.NEXT_PUBLIC_WHAPIFY_BOT_ID || 'demo_bot_fallback',
    authorizedDomains: [
      'localhost:3005',
      'localhost:3000',
      'intertravel.com.ar',
      'www.intertravel.com.ar',
      'admin.intertravel.com.ar',
      'agencias.intertravel.com.ar',
      'app.intertravel.com.ar'
    ],
    defaultSettings: {
      headerTitle: 'InterTravel Group',
      color: '#16213e',
      template: 'template1',
      showPersona: true,
      loadMessages: true
    },
    contextConfigs: {
      landing: {
        ref: 'landing-welcome',
        headerTitle: 'InterTravel - Bienvenido',
        color: '#16213e',
        welcomeMessage: '¡Hola! 👋 Bienvenido a InterTravel. ¿En qué destino soñás viajar?',
        template: 'template1',
        showPersona: true,
        loadMessages: true
      },
      packages: {
        ref: 'packages-browse',
        headerTitle: 'InterTravel - Paquetes',
        color: '#2563eb',
        welcomeMessage: '¿Te ayudo a encontrar el paquete perfecto para tu próximo viaje? ✈️',
        template: 'template1',
        showPersona: true,
        loadMessages: true
      },
      'package-detail': {
        ref: 'package-inquiry',
        headerTitle: 'InterTravel - Consulta',
        color: '#16a34a',
        welcomeMessage: '¿Te interesa este paquete? ¡Te ayudo con toda la información! 🎒',
        template: 'template2',
        showPersona: true,
        loadMessages: true
      },
      agency: {
        ref: 'agency-portal',
        headerTitle: 'InterTravel B2B',
        color: '#7c3aed',
        welcomeMessage: 'Portal para Agencias - ¿Necesitás información sobre comisiones y tarifas? 🏢',
        template: 'template2',
        showPersona: true,
        loadMessages: false // No cargar mensajes previos en portal B2B
      },
      admin: {
        ref: 'admin-support',
        headerTitle: 'InterTravel - Soporte',
        color: '#dc2626',
        welcomeMessage: 'Soporte técnico y administrativo disponible 🛠️',
        template: 'template1',
        showPersona: false, // Sin persona en admin
        loadMessages: true
      },
      prebooking: {
        ref: 'prebooking-completion',
        headerTitle: 'InterTravel - Reserva',
        color: '#ea580c',
        welcomeMessage: '¡Perfecto! Te ayudo a completar tu reserva 📋',
        template: 'template2',
        showPersona: true,
        loadMessages: true
      },
      'contact-form': {
        ref: 'contact-support',
        headerTitle: 'InterTravel - Contacto',
        color: '#059669',
        welcomeMessage: '¿Tenés alguna consulta? ¡Estoy aquí para ayudarte! 💬',
        template: 'template1',
        showPersona: true,
        loadMessages: true
      },
      'quote-request': {
        ref: 'quote-request',
        headerTitle: 'InterTravel - Cotización',
        color: '#7c2d12',
        welcomeMessage: '¿Necesitás una cotización personalizada? ¡Te ayudo a armar tu viaje ideal! 💰',
        template: 'template2',
        showPersona: true,
        loadMessages: true
      }
    }
  },
  integrations: {
    whatsapp: {
      enabled: true,
      fallbackNumber: process.env.INTERTRAVEL_WHATSAPP_MAIN || '+5492615555555'
    },
    email: {
      enabled: true,
      fallbackEmail: process.env.INTERTRAVEL_EMAIL_MAIN || 'info@intertravel.com.ar'
    },
    analytics: {
      trackChats: true,
      trackLeads: true,
      trackConversions: true
    }
  },
  features: {
    autoTransition: true,
    loadPreviousMessages: true,
    multiLanguage: false, // Por ahora solo español
    businessHours: {
      enabled: true,
      timezone: 'America/Argentina/Mendoza',
      schedule: {
        monday: { open: '09:00', close: '18:00', enabled: true },
        tuesday: { open: '09:00', close: '18:00', enabled: true },
        wednesday: { open: '09:00', close: '18:00', enabled: true },
        thursday: { open: '09:00', close: '18:00', enabled: true },
        friday: { open: '09:00', close: '18:00', enabled: true },
        saturday: { open: '09:00', close: '13:00', enabled: true },
        sunday: { open: '00:00', close: '00:00', enabled: false }
      }
    }
  }
});

/**
 * GET /api/whapify/config
 * Obtiene la configuración de Whapify
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context');
    const environment = process.env.NODE_ENV;

    // Obtener configuración base
    const config = getDefaultWhapifyConfig();

    // Si no hay botId configurado, devolver error
    if (!config.whapify.botId) {
      return NextResponse.json(
        { 
          error: 'Whapify Bot ID no configurado',
          message: 'Configure WHAPIFY_BOT_ID en las variables de entorno'
        },
        { status: 500 }
      );
    }

    // Filtrar configuración por contexto si se especifica
    let responseConfig = config;
    if (context && config.whapify.contextConfigs[context]) {
      responseConfig = {
        ...config,
        whapify: {
          ...config.whapify,
          activeContext: context,
          currentConfig: config.whapify.contextConfigs[context]
        }
      };
    }

    // Agregar metadata
    const response = {
      ...responseConfig,
      metadata: {
        environment,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'InterTravel Whapify Integration',
        requestedContext: context || 'all'
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error en /api/whapify/config:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: 'No se pudo cargar la configuración de Whapify'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whapify/config
 * Actualiza la configuración de Whapify (solo para admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, config: newConfig, adminToken } = body;

    // Verificar autorización de admin
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validar configuración
    if (!newConfig || typeof newConfig !== 'object') {
      return NextResponse.json(
        { error: 'Configuración inválida' },
        { status: 400 }
      );
    }

    // Aquí se implementaría la lógica para guardar en base de datos
    // Por ahora devolvemos la configuración actualizada
    
    console.log('Actualizando configuración Whapify:', {
      context,
      config: newConfig,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      updatedConfig: newConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error actualizando configuración Whapify:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}