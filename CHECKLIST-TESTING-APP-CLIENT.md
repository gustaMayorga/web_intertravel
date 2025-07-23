# ✅ CHECKLIST DE TESTING - APP_CLIENT INTERTRAVEL

**Fecha de Testing:** ________________  
**Testeador:** ________________  
**Duración:** ________________  

## 📋 PRE-REQUISITOS

- [ ] Backend funcionando en puerto 3002
- [ ] App Cliente funcionando en puerto 3009  
- [ ] Navegador con DevTools disponible
- [ ] Conexión a internet estable

---

## 🎯 FASE 1: VINCULACIÓN DNI

### ✅ TEST 1.1: DNI con Reservas (12345678)
- [ ] URL /register-dni accesible
- [ ] Input DNI acepta solo números
- [ ] API responde en < 3 segundos
- [ ] Mensaje "1 reserva encontrada" visible
- [ ] Badge verde de vinculación
- [ ] Botón continuar habilitado
- [ ] Sin errores en consola

### ✅ TEST 1.2: DNI Usuario Existente (87654321)  
- [ ] Mensaje "Usuario ya registrado"
- [ ] Link al login visible
- [ ] Registro bloqueado correctamente
- [ ] Email existente mostrado
- [ ] No permite continuar

### ✅ TEST 1.3: DNI Nuevo Usuario (11111111)
- [ ] Mensaje "DNI verificado" 
- [ ] Sin mensaje de vinculación
- [ ] Permite continuar al registro
- [ ] Badge azul informativo

### ✅ TEST 1.4: Registro Completo
**Datos de prueba:**
- DNI: 12345678
- Nombre: Test  
- Apellido: Usuario
- Email: test@email.com
- Teléfono: +54911123456
- Contraseña: 123456

**Verificaciones:**
- [ ] Todos los campos requeridos validados
- [ ] Confirmación de contraseña funciona
- [ ] Email válido requerido
- [ ] Contraseña mínimo 6 caracteres
- [ ] Mensaje "cuenta creada y vinculada"
- [ ] Redirección automática al login
- [ ] Toast de éxito visible

**⏱️ Tiempo FASE 1:** _______ minutos

---

## 🏠 FASE 2: DASHBOARD Y SINCRONIZACIÓN

### ✅ TEST 2.1: Login y Acceso
**Credenciales:** test@email.com / 123456

- [ ] Login exitoso
- [ ] Redirección a /dashboard  
- [ ] Header muestra usuario autenticado
- [ ] Nombre de usuario visible
- [ ] Avatar cargado (o iniciales)
- [ ] Sesión persistente

### ✅ TEST 2.2: Visualización de Reservas
- [ ] Sección "Mis Reservas" visible
- [ ] 2 reservas mostradas (Camboriú y Disney)
- [ ] BookingCards con información completa:
  - [ ] Títulos de paquetes
  - [ ] Destinos y países  
  - [ ] Fechas de viaje
  - [ ] Duración en días
  - [ ] Número de viajeros
  - [ ] Montos total y pagado
  - [ ] Estados de reserva y pago
  - [ ] Servicios incluidos
  - [ ] Botón "Ver Detalles"

### ✅ TEST 2.3: Estadísticas del Usuario
- [ ] Cards de estadísticas visibles:
  - [ ] Total Viajes: 2
  - [ ] Confirmados: 2  
  - [ ] Total Invertido: $3,898
  - [ ] Promedio por Viaje: $1,949
- [ ] Iconos apropiados en cada card
- [ ] Números formateados correctamente

### ✅ TEST 2.4: Próximo Viaje Destacado
- [ ] Card destacado del próximo viaje
- [ ] Destino correcto (Camboriú)
- [ ] Contador de días hasta el viaje
- [ ] Duración del viaje mostrada
- [ ] Botón "Ver Detalles del Viaje"
- [ ] Diseño visual atractivo

### ✅ TEST 2.5: Sincronización Automática
- [ ] Indicador "Sincronización activa" visible
- [ ] Badge verde con punto pulsante
- [ ] Tooltip con información de última sync
- [ ] Llamadas automáticas cada 30 segundos (Network tab)
- [ ] Sin errores de sincronización
- [ ] Performance estable

### ✅ TEST 2.6: Sincronización Manual
- [ ] Botón "Actualizar" funcional
- [ ] Loading state durante refresh
- [ ] Datos actualizados tras click
- [ ] Indicador sync actualizado
- [ ] Sin duplicación de requests

**⏱️ Tiempo FASE 2:** _______ minutos

---

## 🔔 FASE 3: SISTEMA DE NOTIFICACIONES

### ✅ TEST 3.1: Centro de Notificaciones
- [ ] Icono campana en header visible
- [ ] Badge contador de no leídas
- [ ] Click abre Sheet desde la derecha
- [ ] Título "Notificaciones" visible
- [ ] Botones de acción en header
- [ ] Scroll área funcional

### ✅ TEST 3.2: Notificaciones Automáticas
**Esperar y verificar aparición:**
- [ ] Bienvenida (3 seg) - Tipo: info, Prioridad: medium
- [ ] Recordatorio documentos (10 seg) - Tipo: warning, Prioridad: high
- [ ] Oferta especial (20 seg) - Tipo: success, Prioridad: medium  
- [ ] Pago pendiente (30 seg) - Tipo: payment, Prioridad: high
- [ ] Clima destino (45 seg) - Tipo: travel, Prioridad: low
- [ ] Actualización urgente (60 seg) - Tipo: error, Prioridad: urgent

### ✅ TEST 3.3: Categorización Visual
- [ ] Cada tipo tiene icono específico:
  - [ ] Booking: Calendar
  - [ ] Travel: Plane  
  - [ ] Payment: CreditCard
  - [ ] Warning: AlertTriangle
  - [ ] Error: X
  - [ ] Success: Check
  - [ ] Info: Info
- [ ] Colores diferenciados por tipo
- [ ] Badges de prioridad visibles
- [ ] Timestamps relativos funcionando

### ✅ TEST 3.4: Interacciones
- [ ] Click marca como leída (punto azul desaparece)
- [ ] Botón X elimina notificación individual
- [ ] "Marcar todas como leídas" funciona
- [ ] "Limpiar todas" funciona
- [ ] Toggle activar/desactivar funciona
- [ ] Botones de acción navegan correctamente
- [ ] Persistencia en localStorage

### ✅ TEST 3.5: Integración con Sincronización
- [ ] Notificaciones de cambios de sync aparecen
- [ ] Tipo "booking" con prioridad media
- [ ] Botón "Ver Reservas" funcional
- [ ] Dashboard se actualiza automáticamente
- [ ] Sin notificaciones duplicadas

**⏱️ Tiempo FASE 3:** _______ minutos

---

## 📱 FASE 4: RESPONSIVE Y UX

### ✅ TEST 4.1: Desktop (1920x1080)
- [ ] Layout completo visible
- [ ] Navegación horizontal funcional
- [ ] Todos los elementos accesibles
- [ ] Tipografía legible
- [ ] Espaciado apropiado

### ✅ TEST 4.2: Tablet (768x1024) 
- [ ] Layout se adapta correctamente
- [ ] Cards de reservas en grid apropiado
- [ ] Navegación responsiva
- [ ] Botones tamaño adecuado
- [ ] Sheet notificaciones apropiado

### ✅ TEST 4.3: Móvil (375x667)
- [ ] Menú hamburguesa funcional
- [ ] Cards apiladas verticalmente  
- [ ] Header compacto pero funcional
- [ ] Botones touch-friendly
- [ ] Scroll suave
- [ ] Sin overflow horizontal

### ✅ TEST 4.4: Performance
- [ ] Carga inicial < 3 segundos
- [ ] Navegación fluida
- [ ] Sincronización sin lag
- [ ] Notificaciones sin bloqueo
- [ ] Memoria estable (no leaks)

**⏱️ Tiempo FASE 4:** _______ minutos

---

## 🔍 FASE 5: EDGE CASES Y ERRORES

### ✅ TEST 5.1: Sin Conexión Backend
**Detener backend y probar:**
- [ ] Verificación DNI muestra error apropiado
- [ ] Mensaje "Error de conexión" claro
- [ ] Botón "Reintentar" funcional
- [ ] Sin crash de aplicación
- [ ] Loading states manejados

### ✅ TEST 5.2: Validaciones de Formulario
**Probar datos inválidos:**
- [ ] Campos vacíos bloqueados
- [ ] Email inválido rechazado
- [ ] Contraseña corta (<6) rechazada
- [ ] Confirmación password validada
- [ ] DNI no numérico rechazado
- [ ] Mensajes de error claros

### ✅ TEST 5.3: Estados de Carga
- [ ] Skeleton durante carga de reservas
- [ ] Spinners en botones durante loading
- [ ] Estado "Sin reservas" apropiado
- [ ] Loading de notificaciones manejado
- [ ] Timeouts gestionados correctamente

### ✅ TEST 5.4: Persistencia de Datos
- [ ] Sesión persiste tras refresh
- [ ] Notificaciones persisten en localStorage
- [ ] Configuraciones guardadas
- [ ] Estado de autenticación mantenido

**⏱️ Tiempo FASE 5:** _______ minutos

---

## 📊 RESUMEN DE RESULTADOS

### ✅ FUNCIONALIDADES CRÍTICAS
- [ ] Vinculación DNI: ___% funcionando
- [ ] Dashboard: ___% funcionando  
- [ ] Sincronización: ___% funcionando
- [ ] Notificaciones: ___% funcionando
- [ ] Autenticación: ___% funcionando

### ✅ EXPERIENCIA DE USUARIO
- [ ] Responsive: ___% funcionando
- [ ] Performance: ___% satisfactorio
- [ ] Manejo errores: ___% apropiado
- [ ] Navegación: ___% intuitiva

### ❌ ERRORES ENCONTRADOS
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

### ⚠️ MEJORAS SUGERIDAS
1. _________________________________
2. _________________________________
3. _________________________________

---

## 🎯 DECISIÓN FINAL

### **ESTADO DEL SISTEMA:**
- [ ] ✅ **APROBADO** - Listo para producción
- [ ] ⚠️ **APROBADO CON OBSERVACIONES** - Errores menores
- [ ] ❌ **RECHAZADO** - Requiere correcciones críticas

### **LISTO PARA PRODUCCIÓN:**
- [ ] **SÍ** - Sistema completamente funcional
- [ ] **NO** - Requiere correcciones antes de deploy

### **PRÓXIMOS PASOS:**
_________________________________________
_________________________________________
_________________________________________

---

## 📝 OBSERVACIONES ADICIONALES

_________________________________________
_________________________________________
_________________________________________
_________________________________________

---

**FIRMA TESTEADOR:** ________________  
**FECHA:** ________________  
**TIEMPO TOTAL:** ________________

---

**🎉 Si todas las casillas están marcadas, ¡el sistema está listo para uso inmediato!**
