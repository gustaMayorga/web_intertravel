// API para gestionar la configuración de WhatsApp
// /api/whatsapp/config

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Devolver configuración actual (simulada)
    const config = {
      whatsapp: {
        main: '+5492615555555',
        results: '+5492615555556',
        detail: '+5492615555557',
        agency: '+5492615555558',
        prebooking: '+5492615555559'
      },
      messages: {
        main: 'Hola! Me interesa conocer más sobre sus paquetes',
        results: 'Me interesa obtener más información sobre los paquetes disponibles',
        detail: 'Me interesa el paquete [PACKAGE_NAME] y me gustaría recibir más información',
        agency: 'Hola! Soy agencia de viajes y necesito información sobre su plataforma B2B',
        prebooking: 'Completé el formulario de prebooking y me gustaría finalizar mi reserva'
      },
      globalSettings: {
        hours: 'Lun-Vie 9:00-18:00, Sáb 9:00-13:00',
        welcomeMessage: '¡Hola! 👋 Bienvenido a InterTravel. ¿En qué podemos ayudarte hoy?',
        offHoursMessage: 'Gracias por contactarnos. Nuestro horario de atención es Lun-Vie 9:00-18:00. Te responderemos a la brevedad. 🕒'
      },
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      config: config
    });
  }
  
  else if (req.method === 'POST') {
    // Actualizar configuración
    try {
      const { config: newConfig } = req.body;
      
      // Validar datos
      if (!newConfig || !newConfig.whatsapp || !newConfig.messages) {
        return res.status(400).json({
          success: false,
          error: 'Configuración inválida'
        });
      }

      // En una implementación real, aquí guardarías en base de datos
      // Por ahora, solo simularemos que se guardó
      
      console.log('📱 Configuración de WhatsApp actualizada:', newConfig);
      
      res.status(200).json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        config: newConfig
      });
    } catch (error) {
      console.error('Error actualizando configuración WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`
    });
  }
}