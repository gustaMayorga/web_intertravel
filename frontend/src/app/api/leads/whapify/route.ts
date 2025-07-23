import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/leads/whapify
 * Propósito: Manejo de leads generados desde Whapify WebChat
 * 
 * Esta API recibe y procesa los leads capturados por el sistema Whapify
 * integrándolos con el sistema de leads de InterTravel
 */

interface WhapifyLeadData {
  source: 'whapify';
  context: string;
  packageName?: string;
  timestamp: string;
  leadData: {
    contactInfo?: {
      email?: string;
      phone?: string;
      name?: string;
    };
    conversationId?: string;
    messageHistory?: Array<{
      timestamp: string;
      sender: 'user' | 'bot';
      message: string;
    }>;
    intent?: string;
    customFields?: Record<string, any>;
  };
}

interface InterTravelLead {
  id: string;
  source: string;
  context: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactInfo: {
    email?: string;
    phone?: string;
    name?: string;
    preferredContact?: 'email' | 'phone' | 'whatsapp';
  };
  leadDetails: {
    packageInterest?: string;
    budget?: string;
    travelDates?: string;
    travelers?: number;
    specialRequests?: string;
    conversationSummary?: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    whapifyConversationId?: string;
    referrerUrl?: string;
    device?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

/**
 * POST /api/leads/whapify
 * Procesa un nuevo lead desde Whapify
 */
export async function POST(request: NextRequest) {
  try {
    const body: WhapifyLeadData = await request.json();

    // Validar datos requeridos
    if (!body.source || body.source !== 'whapify') {
      return NextResponse.json(
        { error: 'Fuente de lead inválida' },
        { status: 400 }
      );
    }

    if (!body.context) {
      return NextResponse.json(
        { error: 'Contexto requerido' },
        { status: 400 }
      );
    }

    // Generar ID único para el lead
    const leadId = `whapify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determinar prioridad basada en el contexto
    const priority = determinePriority(body.context, body.leadData);

    // Crear objeto lead para InterTravel
    const interTravelLead: InterTravelLead = {
      id: leadId,
      source: 'whapify',
      context: body.context,
      status: 'new',
      priority,
      contactInfo: {
        email: body.leadData.contactInfo?.email,
        phone: body.leadData.contactInfo?.phone,
        name: body.leadData.contactInfo?.name || 'Cliente Potencial',
        preferredContact: body.leadData.contactInfo?.phone ? 'whatsapp' : 'email'
      },
      leadDetails: {
        packageInterest: body.packageName,
        conversationSummary: generateConversationSummary(body.leadData.messageHistory),
        specialRequests: extractSpecialRequests(body.leadData.messageHistory)
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        whapifyConversationId: body.leadData.conversationId,
        referrerUrl: request.headers.get('referer') || undefined,
        device: determineDevice(request.headers.get('user-agent') || ''),
        utmSource: 'whapify',
        utmMedium: 'chat',
        utmCampaign: body.context
      }
    };

    // Intentar guardar en base de datos
    try {
      await saveLeadToDatabase(interTravelLead);
    } catch (dbError) {
      console.error('Error guardando lead en BD:', dbError);
      // Continuar con el procesamiento aunque falle la BD
    }

    // Enviar notificaciones
    const notificationResults = await sendNotifications(interTravelLead);

    // Respuesta exitosa
    const response = {
      success: true,
      leadId,
      message: 'Lead procesado correctamente',
      lead: {
        id: leadId,
        status: interTravelLead.status,
        priority: interTravelLead.priority,
        context: interTravelLead.context
      },
      notifications: notificationResults,
      timestamp: new Date().toISOString()
    };

    // Log para análisis
    console.log('Nuevo lead de Whapify procesado:', {
      leadId,
      context: body.context,
      hasContact: !!(body.leadData.contactInfo?.email || body.leadData.contactInfo?.phone),
      priority,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error procesando lead de Whapify:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: 'No se pudo procesar el lead',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Determina la prioridad del lead basada en el contexto y datos
 */
function determinePriority(
  context: string, 
  leadData: WhapifyLeadData['leadData']
): 'low' | 'medium' | 'high' | 'urgent' {
  // Contextos de alta prioridad
  if (context === 'prebooking' || context === 'quote-request') {
    return 'urgent';
  }
  
  if (context === 'package-detail') {
    return 'high';
  }
  
  if (context === 'agency') {
    return 'high';
  }
  
  // Si tiene información de contacto completa
  if (leadData.contactInfo?.email && leadData.contactInfo?.phone) {
    return 'medium';
  }
  
  // Por defecto
  return 'low';
}

/**
 * Genera un resumen de la conversación
 */
function generateConversationSummary(
  messageHistory?: Array<{
    timestamp: string;
    sender: 'user' | 'bot';
    message: string;
  }>
): string {
  if (!messageHistory || messageHistory.length === 0) {
    return 'Conversación iniciada por Whapify WebChat';
  }
  
  const userMessages = messageHistory
    .filter(msg => msg.sender === 'user')
    .map(msg => msg.message)
    .slice(0, 3); // Primeros 3 mensajes del usuario
  
  if (userMessages.length === 0) {
    return 'Usuario inició conversación';
  }
  
  return `Consulta: ${userMessages.join(' | ')}`;
}

/**
 * Extrae solicitudes especiales de la conversación
 */
function extractSpecialRequests(
  messageHistory?: Array<{
    timestamp: string;
    sender: 'user' | 'bot';
    message: string;
  }>
): string {
  if (!messageHistory) return '';
  
  const userMessages = messageHistory
    .filter(msg => msg.sender === 'user')
    .map(msg => msg.message.toLowerCase());
  
  const keywords = [
    'discapacidad', 'accesibilidad', 'vegetariano', 'vegano',
    'alergia', 'celíaco', 'diabético', 'embarazada',
    'luna de miel', 'aniversario', 'cumpleaños',
    'grupo', 'empresa', 'corporativo'
  ];
  
  const foundRequests = userMessages
    .filter(msg => keywords.some(keyword => msg.includes(keyword)))
    .slice(0, 2);
  
  return foundRequests.join(' | ');
}

/**
 * Determina el tipo de dispositivo
 */
function determineDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

/**
 * Guarda el lead en la base de datos
 */
async function saveLeadToDatabase(lead: InterTravelLead): Promise<void> {
  try {
    // Aquí iría la lógica para guardar en la BD
    // Por ahora, simular guardado exitoso
    
    // En un entorno real, esto sería algo como:
    // await db.leads.create(lead);
    
    console.log('Lead guardado en BD (simulado):', lead.id);
  } catch (error) {
    console.error('Error guardando lead:', error);
    throw error;
  }
}

/**
 * Envía notificaciones del nuevo lead
 */
async function sendNotifications(lead: InterTravelLead): Promise<{
  email: boolean;
  whatsapp: boolean;
  slack: boolean;
}> {
  const results = {
    email: false,
    whatsapp: false,
    slack: false
  };
  
  try {
    // Notificación por email
    if (process.env.NOTIFICATION_EMAIL_ENABLED === 'true') {
      results.email = await sendEmailNotification(lead);
    }
    
    // Notificación por WhatsApp interno
    if (process.env.NOTIFICATION_WHATSAPP_ENABLED === 'true') {
      results.whatsapp = await sendWhatsAppNotification(lead);
    }
    
    // Notificación por Slack
    if (process.env.NOTIFICATION_SLACK_ENABLED === 'true') {
      results.slack = await sendSlackNotification(lead);
    }
    
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
  }
  
  return results;
}

/**
 * Envía notificación por email
 */
async function sendEmailNotification(lead: InterTravelLead): Promise<boolean> {
  try {
    // Aquí iría la integración con servicio de email
    console.log('Enviando notificación por email para lead:', lead.id);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

/**
 * Envía notificación por WhatsApp interno
 */
async function sendWhatsAppNotification(lead: InterTravelLead): Promise<boolean> {
  try {
    // Aquí iría la integración con WhatsApp Business API
    console.log('Enviando notificación por WhatsApp para lead:', lead.id);
    return true;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return false;
  }
}

/**
 * Envía notificación por Slack
 */
async function sendSlackNotification(lead: InterTravelLead): Promise<boolean> {
  try {
    // Aquí iría la integración con Slack
    console.log('Enviando notificación por Slack para lead:', lead.id);
    return true;
  } catch (error) {
    console.error('Error enviando Slack:', error);
    return false;
  }
}

/**
 * GET /api/leads/whapify
 * Obtiene estadísticas de leads de Whapify (solo admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminToken = searchParams.get('token');
    
    // Verificar autorización
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Aquí iría la lógica para obtener estadísticas de la BD
    const stats = {
      total: 0,
      byContext: {},
      byStatus: {},
      byPriority: {},
      last30Days: 0,
      conversionRate: 0
    };
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error obteniendo stats de leads:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}