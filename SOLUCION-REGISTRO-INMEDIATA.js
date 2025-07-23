// SOLUCION INMEDIATA - Corregir llamada al register

// ❌ LLAMADA ACTUAL (INCORRECTA)
/*
const result = await register(
  registerData.firstName,
  registerData.lastName, 
  registerData.email,
  registerData.phone,
  registerData.password
);
*/

// ✅ LLAMADA CORRECTA (DEBE SER OBJETO)
const result = await register({
  firstName: registerData.firstName,
  lastName: registerData.lastName,
  email: registerData.email,
  phone: registerData.phone,
  password: registerData.password
});

// EXPLICACIÓN DEL PROBLEMA:
// El contexto auth-context.tsx define:
// register: (userData: { email: string; password: string; firstName: string; lastName: string; phone?: string; }) => Promise<void>
//
// Pero el login page está llamando con parámetros separados en lugar de un objeto
// Esto causa que el primer parámetro (firstName: "Gustavo") se envíe como string plano
// al fetch(), causando el error JSON parse

console.log('🔧 CORRECCIÓN: Cambiar llamada de register a objeto en login/page.tsx línea ~150');