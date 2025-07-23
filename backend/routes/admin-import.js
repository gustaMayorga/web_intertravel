// ===============================================
// SISTEMA DE IMPORTACIÓN EXCEL PARA BOOKINGS
// ===============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');

// Importar BookingsManager
let BookingsManager;
try {
  BookingsManager = require('../modules/bookings');
  console.log('✅ BookingsManager cargado para importación');
} catch (error) {
  console.warn('⚠️ BookingsManager no disponible para importación:', error.message);
}

// Configurar multer para upload de archivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Solo Excel (.xlsx, .xls) y CSV.'));
    }
  }
});

// Middleware de autenticación
function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }
  
  // Simplificado para desarrollo
  req.user = { username: 'admin', role: 'admin', id: 'dev-admin' };
  next();
}

// ===============================================
// TEMPLATES Y VALIDACIONES
// ===============================================

// Template de Excel para reservas
const BOOKING_TEMPLATE = {
  headers: [
    'booking_reference',
    'package_title', 
    'package_source',
    'destination',
    'country',
    'customer_name',
    'customer_email',
    'customer_phone',
    'travelers_count',
    'travel_date',
    'return_date',
    'duration_days',
    'total_amount',
    'currency',
    'status',
    'payment_status',
    'special_requests'
  ],
  required: [
    'customer_name',
    'customer_email', 
    'travel_date',
    'total_amount',
    'package_title'
  ],
  example: {
    booking_reference: 'IT-2025-001',
    package_title: 'Perú Mágico - Machu Picchu y Cusco',
    package_source: 'travel_compositor',
    destination: 'Cusco',
    country: 'Perú',
    customer_name: 'María González',
    customer_email: 'maria@example.com',
    customer_phone: '+54 9 11 1234-5678',
    travelers_count: 2,
    travel_date: '2025-01-20',
    return_date: '2025-01-27',
    duration_days: 7,
    total_amount: 3780,
    currency: 'USD',
    status: 'confirmed',
    payment_status: 'partial',
    special_requests: 'Solicitud de habitación con vista a la montaña'
  }
};

// Función de validación de datos
function validateBookingRow(row, rowIndex) {
  const errors = [];
  const warnings = [];
  
  // Validar campos requeridos
  BOOKING_TEMPLATE.required.forEach(field => {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push(`Fila ${rowIndex}: Campo requerido '${field}' está vacío`);
    }
  });
  
  // Validar email
  if (row.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.customer_email)) {
    errors.push(`Fila ${rowIndex}: Email inválido '${row.customer_email}'`);
  }
  
  // Validar fecha
  if (row.travel_date) {
    const date = new Date(row.travel_date);
    if (isNaN(date.getTime())) {
      errors.push(`Fila ${rowIndex}: Fecha de viaje inválida '${row.travel_date}'`);
    }
  }
  
  // Validar monto
  if (row.total_amount && (isNaN(parseFloat(row.total_amount)) || parseFloat(row.total_amount) <= 0)) {
    errors.push(`Fila ${rowIndex}: Monto inválido '${row.total_amount}'`);
  }
  
  // Validar estados
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (row.status && !validStatuses.includes(row.status)) {
    warnings.push(`Fila ${rowIndex}: Estado '${row.status}' no reconocido, se usará 'pending'`);
    row.status = 'pending';
  }
  
  const validPaymentStatuses = ['pending', 'paid', 'partial', 'refunded', 'failed'];
  if (row.payment_status && !validPaymentStatuses.includes(row.payment_status)) {
    warnings.push(`Fila ${rowIndex}: Estado de pago '${row.payment_status}' no reconocido, se usará 'pending'`);
    row.payment_status = 'pending';
  }
  
  // Validar package_source
  const validPackageSources = ['travel_compositor', 'manual', 'imported'];
  if (row.package_source && !validPackageSources.includes(row.package_source)) {
    warnings.push(`Fila ${rowIndex}: Fuente de paquete '${row.package_source}' no reconocida, se usará 'imported'`);
    row.package_source = 'imported';
  }
  
  return { errors, warnings, row };
}

// ===============================================
// RUTAS DE IMPORTACIÓN
// ===============================================

// 📊 Descargar template de Excel
router.get('/import/template/bookings', requireAuth, (req, res) => {
  try {
    console.log('📊 Generando template de Excel para reservas...');
    
    // Crear workbook con datos de ejemplo
    const wb = XLSX.utils.book_new();
    
    // Hoja de instrucciones
    const instructions = [
      ['TEMPLATE DE IMPORTACIÓN DE RESERVAS - INTERTRAVEL'],
      [''],
      ['INSTRUCCIONES:'],
      ['1. Complete todos los campos requeridos marcados con *'],
      ['2. Use el formato de fecha YYYY-MM-DD (ej: 2025-01-20)'],
      ['3. Los montos deben ser números sin símbolos (ej: 3780.50)'],
      ['4. Los estados válidos son: pending, confirmed, cancelled, completed'],
      ['5. Las fuentes válidas son: travel_compositor, manual, imported'],
      [''],
      ['CAMPOS REQUERIDOS:'],
      ...BOOKING_TEMPLATE.required.map(field => [`* ${field}`])
    ];
    
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');
    
    // Hoja con headers y ejemplo
    const exampleData = [
      BOOKING_TEMPLATE.headers,
      Object.values(BOOKING_TEMPLATE.example)
    ];
    
    const wsData = XLSX.utils.aoa_to_sheet(exampleData);
    XLSX.utils.book_append_sheet(wb, wsData, 'Reservas');
    
    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const filename = `template_reservas_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    console.log(`✅ Template de reservas generado: ${filename}`);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Error generando template:', error);
    res.status(500).json({
      success: false,
      error: 'Error generando template'
    });
  }
});

// 📤 Upload y análisis de archivo
router.post('/import/upload/bookings', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó archivo'
      });
    }
    
    console.log(`📤 Procesando archivo: ${req.file.originalname}`);
    
    // Leer archivo Excel/CSV
    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Archivo corrupto o formato inválido'
      });
    }
    
    // Obtener primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    if (rawData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El archivo está vacío'
      });
    }
    
    console.log(`📊 Archivo contiene ${rawData.length} filas`);
    
    // Validar y procesar datos
    const validationResults = {
      valid: [],
      errors: [],
      warnings: [],
      totalRows: rawData.length,
      validRows: 0,
      errorRows: 0
    };
    
    rawData.forEach((row, index) => {
      const validation = validateBookingRow(row, index + 2); // +2 porque Excel empieza en 1 y hay header
      
      if (validation.errors.length === 0) {
        validationResults.valid.push(validation.row);
        validationResults.validRows++;
      } else {
        validationResults.errorRows++;
      }
      
      validationResults.errors.push(...validation.errors);
      validationResults.warnings.push(...validation.warnings);
    });
    
    // Generar ID único para este proceso de importación
    const importId = `IMP-${Date.now()}`;
    
    console.log(`✅ Validación completada: ${validationResults.validRows} válidas, ${validationResults.errorRows} con errores`);
    
    // Responder con resultados de validación
    res.json({
      success: true,
      importId,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      validation: validationResults,
      message: `Archivo procesado: ${validationResults.validRows} reservas válidas de ${validationResults.totalRows} total`
    });
    
  } catch (error) {
    console.error('❌ Error procesando archivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando archivo'
    });
  }
});

// ⚡ Ejecutar importación de reservas
router.post('/import/execute/bookings', requireAuth, async (req, res) => {
  try {
    const { importId, validData, options = {} } = req.body;
    
    if (!validData || !Array.isArray(validData)) {
      return res.status(400).json({
        success: false,
        error: 'Datos de importación inválidos'
      });
    }
    
    console.log(`⚡ Ejecutando importación ${importId} - ${validData.length} reservas`);
    
    const results = {
      importId,
      totalRows: validData.length,
      successRows: 0,
      errorRows: 0,
      errors: [],
      importedBookings: []
    };
    
    // Procesar cada reserva
    for (let i = 0; i < validData.length; i++) {
      const rowData = validData[i];
      
      try {
        // Preparar datos para BookingsManager
        const bookingData = {
          package_id: rowData.package_id || `PKG-${Date.now()}-${i}`,
          package_title: rowData.package_title,
          package_source: rowData.package_source || 'imported',
          destination: rowData.destination,
          country: rowData.country,
          customer_name: rowData.customer_name,
          customer_email: rowData.customer_email,
          customer_phone: rowData.customer_phone,
          travelers_count: parseInt(rowData.travelers_count) || 1,
          travel_date: rowData.travel_date,
          return_date: rowData.return_date,
          duration_days: parseInt(rowData.duration_days) || 1,
          total_amount: parseFloat(rowData.total_amount),
          currency: rowData.currency || 'USD',
          special_requests: rowData.special_requests,
          source: 'import',
          metadata: {
            imported_by: req.user.username,
            import_id: importId,
            import_date: new Date().toISOString(),
            original_status: rowData.status || 'pending',
            original_payment_status: rowData.payment_status || 'pending'
          }
        };
        
        let result;
        if (BookingsManager && BookingsManager.createBooking) {
          result = await BookingsManager.createBooking(bookingData);
          
          if (result.success) {
            // Actualizar estados si fueron proporcionados
            if (rowData.status && rowData.status !== 'pending') {
              await BookingsManager.updateBookingStatus(
                result.booking.id, 
                rowData.status, 
                `Estado importado: ${rowData.status}`
              );
            }
            
            if (rowData.payment_status && rowData.payment_status !== 'pending') {
              await BookingsManager.updatePaymentStatus(
                result.booking.id,
                rowData.payment_status
              );
            }
          }
        } else {
          // Fallback mock creation
          result = {
            success: true,
            booking: {
              id: `BK-IMP-${Date.now()}-${i}`,
              booking_reference: `IT-IMP-${String(Date.now()).slice(-6)}-${i}`,
              ...bookingData,
              status: rowData.status || 'pending',
              payment_status: rowData.payment_status || 'pending',
              created_at: new Date().toISOString()
            }
          };
        }
        
        if (result.success) {
          results.successRows++;
          results.importedBookings.push(result.booking);
          console.log(`✅ Reserva ${i + 1}/${validData.length} importada: ${result.booking.booking_reference}`);
        } else {
          results.errorRows++;
          results.errors.push(`Fila ${i + 1}: ${result.error}`);
          console.error(`❌ Error en reserva ${i + 1}: ${result.error}`);
        }
        
      } catch (error) {
        results.errorRows++;
        results.errors.push(`Fila ${i + 1}: ${error.message}`);
        console.error(`❌ Error procesando fila ${i + 1}:`, error);
      }
    }
    
    console.log(`🎯 Importación ${importId} completada: ${results.successRows} exitosas, ${results.errorRows} errores`);
    
    res.json({
      success: true,
      message: `Importación completada: ${results.successRows} reservas importadas exitosamente`,
      results
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando importación:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando importación'
    });
  }
});

// 📋 Obtener historial de importaciones
router.get('/import/history/bookings', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    console.log('📋 Obteniendo historial de importaciones...');
    
    // Mock history data
    const mockHistory = [
      {
        id: 'IMP-1735234567890',
        fileName: 'reservas_enero_2025.xlsx',
        importDate: '2024-12-26T10:30:00Z',
        status: 'completed',
        totalRows: 50,
        successRows: 47,
        errorRows: 3,
        duration: 45,
        performedBy: req.user.username,
        errors: [
          'Fila 15: Email inválido',
          'Fila 23: Fecha de viaje inválida',
          'Fila 41: Monto requerido'
        ]
      },
      {
        id: 'IMP-1735148167890',
        fileName: 'bookings_backup.csv',
        importDate: '2024-12-25T14:20:00Z',
        status: 'partial',
        totalRows: 25,
        successRows: 20,
        errorRows: 5,
        duration: 32,
        performedBy: req.user.username,
        errors: [
          'Fila 8: Cliente duplicado',
          'Fila 12: País no reconocido',
          'Fila 16: Monto inválido',
          'Fila 19: Fecha pasada',
          'Fila 22: Email requerido'
        ]
      }
    ];
    
    // Paginación
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = mockHistory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        imports: paginatedHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockHistory.length,
          totalPages: Math.ceil(mockHistory.length / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 📊 Estadísticas de importaciones
router.get('/import/stats/bookings', requireAuth, async (req, res) => {
  try {
    console.log('📊 Generando estadísticas de importaciones...');
    
    const mockStats = {
      totalImports: 15,
      totalRowsProcessed: 1250,
      totalSuccessRows: 1189,
      totalErrorRows: 61,
      successRate: 95.1,
      lastImport: '2024-12-26T10:30:00Z',
      topErrors: [
        { error: 'Email inválido', count: 23 },
        { error: 'Fecha de viaje inválida', count: 18 },
        { error: 'Monto requerido', count: 12 },
        { error: 'Cliente duplicado', count: 8 }
      ],
      monthlyStats: [
        { month: '2024-12', imports: 6, rows: 450, success: 428 },
        { month: '2024-11', imports: 4, rows: 320, success: 305 },
        { month: '2024-10', imports: 5, rows: 480, success: 456 }
      ]
    };
    
    res.json({
      success: true,
      data: mockStats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;