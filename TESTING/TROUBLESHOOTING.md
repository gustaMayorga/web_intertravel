# 🆘 TROUBLESHOOTING GUIDE - TESTING INTERTRAVEL
## Soluciones para Problemas Comunes en Testing

---

## 🚨 **ERRORES CRÍTICOS**

### ❌ **"npm: command not found"**
**Problema:** Node.js no está instalado o no está en PATH
**Solución:**
```bash
1. Instalar Node.js desde https://nodejs.org/
2. Reiniciar terminal/cmd
3. Verificar: node --version && npm --version
```

### ❌ **"Error: ENOENT no such file or directory"**
**Problema:** Rutas incorrectas o archivos faltantes
**Solución:**
```bash
1. Verificar que estás en la carpeta correcta
2. Ruta correcta: D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\app_cliete
3. Verificar que existe package.json en esa carpeta
```

### ❌ **"Port 3009 is already in use"**
**Problema:** Puerto ocupado por otra aplicación
**Solución:**
```bash
# Opción 1: Matar proceso en puerto 3009
netstat -ano | findstr :3009
taskkill /PID [PID_NUMBER] /F

# Opción 2: Usar puerto alternativo
npm run dev -- -p 3010
```

---

## ⚠️ **WARNINGS COMUNES**

### 🟡 **"Module not found" o dependencias faltantes**
**Problema:** node_modules no está actualizado
**Solución:**
```bash
cd app_cliete
rm -rf node_modules package-lock.json
npm install
```

### 🟡 **"Backend not responding"**
**Problema:** Backend no está corriendo en puerto 3002
**Solución:**
```bash
# En otra terminal:
cd backend
npm start

# Verificar que responde:
curl http://localhost:3002/api/health
```

### 🟡 **"CORS error"**
**Problema:** Problemas de Cross-Origin entre frontend/backend
**Solución:**
```bash
1. Verificar que backend permite localhost:3009
2. Revisar configuración CORS en backend
3. Verificar URL backend en config: http://localhost:3002
```

---

## 🌐 **PROBLEMAS DE NAVEGADOR**

### 🔄 **Página se carga infinitamente**
**Posibles causas:**
1. **JavaScript error:** Revisar consola (F12)
2. **API not responding:** Verificar Network tab
3. **Redirect loop:** Revisar rutas de autenticación

**Solución:**
```bash
1. Abrir DevTools (F12)
2. Revisar Console tab para errores
3. Revisar Network tab para requests fallidos
4. Limpiar caché: Ctrl+F5
```

### 🎨 **Estilos no se cargan (Tailwind)**
**Problema:** CSS no está compilando correctamente
**Solución:**
```bash
1. Verificar que tailwind.config.ts existe
2. Verificar que globals.css incluye @tailwind directives
3. Restart del dev server: Ctrl+C y npm run dev
```

### 📱 **Responsive no funciona**
**Problema:** Viewport meta tag o CSS issues
**Solución:**
```bash
1. Verificar viewport en layout.tsx
2. Probar en diferentes resoluciones
3. Revisar breakpoints de Tailwind
```

---

## 🔐 **PROBLEMAS DE AUTENTICACIÓN**

### 🚫 **Login form no aparece**
**Problema:** Ruta /login no está bien configurada
**Solución:**
```bash
1. Verificar que app/(auth)/login/page.tsx existe
2. Verificar rutas en navegación
3. Probar acceso directo: http://localhost:3009/login
```

### 🔑 **"Token not found" o auth errors**
**Problema:** Sistema de autenticación no inicializado
**Solución:**
```bash
1. Limpiar localStorage: F12 > Application > Local Storage > Clear
2. Verificar AuthContext está funcionando
3. Revisar configuración backend auth
```

---

## 📊 **PROBLEMAS DE PERFORMANCE**

### 🐌 **App muy lenta**
**Posibles causas:**
1. **Dev mode:** Normal en desarrollo con Turbopack
2. **Too many files:** Limpiar archivos temporales
3. **Network issues:** Revisar conexión backend

**Solución:**
```bash
1. Probar build de producción: npm run build && npm start
2. Limpiar caché: rm -rf .next
3. Verificar que backend responde rápido
```

### 💾 **High memory usage**
**Problema:** Next.js development server usando mucha RAM
**Solución:**
```bash
1. Restart del dev server
2. Cerrar otras aplicaciones
3. Aumentar memoria virtual si es necesario
```

---

## 🔧 **COMANDOS ÚTILES DE DIAGNÓSTICO**

### 📋 **Verificar estado general:**
```bash
# Verificar Node.js y npm
node --version
npm --version

# Verificar puertos en uso
netstat -ano | findstr :3002
netstat -ano | findstr :3009

# Verificar estructura de archivos
dir app_cliete\package.json
dir app_cliete\src
```

### 🌐 **Testing de conectividad:**
```bash
# Verificar backend
curl http://localhost:3002/api/health

# Verificar frontend
curl http://localhost:3009

# Verificar DNS
ping localhost
```

### 🧹 **Limpieza completa:**
```bash
# Limpiar dependencias
cd app_cliete
rm -rf node_modules package-lock.json .next
npm install

# Limpiar caché navegador
# Ctrl+Shift+Delete o F12 > Application > Clear Storage
```

---

## 📞 **¿NECESITAS MÁS AYUDA?**

### 📝 **Información a recopilar:**
1. **Sistema operativo** y versión
2. **Versión Node.js** (`node --version`)
3. **Error exacto** (screenshot o copy/paste)
4. **Paso específico** donde falló
5. **Logs completos** de la consola

### 🔍 **Logs importantes:**
- **Terminal:** Output completo de npm run dev
- **Browser Console:** F12 > Console tab
- **Network Tab:** F12 > Network tab para requests
- **Backend logs:** Si backend está corriendo

### 📊 **Template de reporte de error:**
```
🐛 ERROR ENCONTRADO:
- Paso: [TEST-01, fase X]
- Error: [mensaje exacto]
- OS: [Windows 10/11]
- Node: [versión]
- Browser: [Chrome/Firefox/etc]

📋 LOGS:
[Pegar logs aquí]

📸 SCREENSHOT:
[Si es problema visual]
```

---

**🎯 ¡Con esta guía deberías poder resolver la mayoría de problemas!**

**Si encuentras un error nuevo, repórtalo para que se agregue a esta guía.**
