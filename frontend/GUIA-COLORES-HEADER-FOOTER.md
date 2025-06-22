# 🎨 GUÍA DE COLORES - HEADER Y FOOTER

## 📍 **UBICACIÓN DE ARCHIVOS:**

### 🦶 **FOOTER:** 
`D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\components\Footer.tsx`

### 🔝 **HEADER:** 
`D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\components\Header.tsx`

---

## 🎨 **ESQUEMAS DE COLORES DISPONIBLES:**

### **1. 🟢 VERDE CORPORATIVO (ACTUAL):**
```typescript
// Footer (línea 7)
<footer className=\"bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white relative overflow-hidden\">

// Header (línea 19)
bg-green-900/95 backdrop-blur-md shadow-lg border-b border-green-800
```

### **2. 🔵 AZUL ORIGINAL:**
```typescript
// Footer
<footer className=\"bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white relative overflow-hidden\">

// Header
bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100
```

### **3. ⚫ NEGRO ELEGANTE:**
```typescript
// Footer
<footer className=\"bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden\">

// Header
bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800
```

### **4. 🟤 MARRÓN CORPORATIVO:**
```typescript
// Footer
<footer className=\"bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 text-white relative overflow-hidden\">

// Header
bg-amber-900/95 backdrop-blur-md shadow-lg border-b border-amber-800
```

### **5. 🔴 ROJO MODERNO:**
```typescript
// Footer
<footer className=\"bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white relative overflow-hidden\">

// Header
bg-red-900/95 backdrop-blur-md shadow-lg border-b border-red-800
```

### **6. 🟣 PÚRPURA PREMIUM:**
```typescript
// Footer
<footer className=\"bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white relative overflow-hidden\">

// Header
bg-purple-900/95 backdrop-blur-md shadow-lg border-b border-purple-800
```

---

## 🔧 **CÓMO CAMBIAR LOS COLORES:**

### **PASO 1: Footer (línea 7)**
Reemplazar:
```typescript
<footer className=\"bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white relative overflow-hidden\">
```

### **PASO 2: Header (línea 21)**
Reemplazar:
```typescript
? 'bg-green-900/95 backdrop-blur-md shadow-lg border-b border-green-800'
```

### **PASO 3: Colores de texto y acentos**
Buscar y reemplazar en Header:
- `text-green-300` → `text-[COLOR]-300`
- `bg-green-800` → `bg-[COLOR]-800`
- `border-green-700` → `border-[COLOR]-700`
- `border-green-800` → `border-[COLOR]-800`

---

## 🎯 **COLORES TAILWIND DISPONIBLES:**

### **Tonos principales:**
- `blue` - Azul profesional
- `green` - Verde corporativo
- `purple` - Púrpura premium
- `red` - Rojo dinámico
- `amber` - Dorado/Naranja
- `gray` - Gris neutro
- `slate` - Gris moderno
- `stone` - Beige/Tierra
- `neutral` - Gris puro
- `zinc` - Gris metálico

### **Intensidades disponibles:**
- `50` - Muy claro
- `100` - Claro
- `200` - Claro medio
- `300` - Medio claro
- `400` - Medio
- `500` - Estándar
- `600` - Medio oscuro
- `700` - Oscuro
- `800` - Muy oscuro
- `900` - Extremadamente oscuro

---

## 💡 **EJEMPLO DE CAMBIO COMPLETO A AZUL:**

### **Footer:**
```typescript
<footer className=\"bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white relative overflow-hidden\">
```

### **Header:**
```typescript
// Fondo cuando scroll
bg-blue-900/95 backdrop-blur-md shadow-lg border-b border-blue-800

// Texto en navegación
text-white hover:text-blue-300

// Líneas de subrayado
bg-blue-300

// Botón menú móvil
text-white hover:bg-blue-800 border-blue-700

// Menú móvil fondo
bg-blue-900/95 backdrop-blur-md shadow-2xl border-t border-blue-800

// Enlaces menú móvil
text-white hover:text-blue-300 hover:bg-blue-800

// Divisor menú móvil
border-t border-blue-800
```

---

## 📋 **ARCHIVOS AFECTADOS:**

1. **`src/components/Footer.tsx`** - Línea 7 (fondo principal)
2. **`src/components/Header.tsx`** - Múltiples líneas:
   - Línea 21: Fondo header
   - Línea 42: Texto logo
   - Línea 57+: Enlaces navegación
   - Línea 145: Botón móvil
   - Línea 161: Menú móvil

---

## ✅ **ESTADO ACTUAL:**
- **Footer:** Verde corporativo (`green-900/800`)
- **Header:** Verde corporativo cuando scroll
- **Acentos:** Verde claro (`green-300`)
- **Texto:** Blanco sobre verde

**Para cambiar colores, edita los archivos mencionados reemplazando las clases de color verde por el color deseado.**
