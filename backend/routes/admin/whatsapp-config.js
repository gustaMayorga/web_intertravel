const express = require('express');
const router = express.Router();

/**
 * GET /api/admin/whatsapp-config
 * Obtener configuración de WhatsApp
 */
router.get('/', (req, res) => {
  try {
    console.log('📱 Obteniendo configuración WhatsApp');
    
    res.json({
      success: true,
      config: {
        enabled: true,
        phoneNumber: process.env.WHATSAPP_NUMBER || '+5491112345678',
        defaultMessage: 'Hola! Estoy interesado en sus paquetes de viaje. ¿Podrían brindarme más información?',
        businessHours: {
          start: '09:00',
          end: '18:00',
          timezone: 'America/Argentina/Buenos_Aires'
        },
        autoResponse: {
          enabled: true,
          message: 'Gracias por contactarnos! Te responderemos a la brevedad durante nuestro horario de atención.'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo config WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo configuración WhatsApp',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/whatsapp-config
 * Actualizar configuración de WhatsApp
 */
router.post('/', (req, res) => {
  try {
    const { phoneNumber, defaultMessage, enabled } = req.body;
    
    console.log('📱 Actualizando configuración WhatsApp');
    
    // Aquí irían las validaciones y guardado en BD
    // Por ahora devolvemos éxito
    
    res.json({
      success: true,
      message: 'Configuración WhatsApp actualizada correctamente',
      config: {
        enabled: enabled !== undefined ? enabled : true,
        phoneNumber: phoneNumber || process.env.WHATSAPP_NUMBER || '+5491112345678',
        defaultMessage: defaultMessage || 'Hola! Estoy interesado en sus paquetes de viaje.',
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error actualizando config WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando configuración WhatsApp',
      message: error.message
    });
  }
});

console.log('✅ Admin WhatsApp routes loaded');
module.exports = router;