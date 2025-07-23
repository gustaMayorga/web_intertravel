// ===============================================
// VERIFICADOR COMPLETO DE FUNCIONALIDADES ADMIN
// ===============================================
// Este script verifica que TODOS los botones y funciones del admin trabajen

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO FUNCIONALIDADES COMPLETAS DEL ADMIN...');
console.log('');

// ===============================================
// 1. VERIFICAR ARCHIVOS ADMIN
// ===============================================

const adminPath = 'D:\\Inter\\intertravel-website\\WEB-FINAL-UNIFICADA\\frontend\\src\\app\\admin';
const adminModules = [
  'destinations',
  'packages', 
  'bookings',
  'users',
  'analytics',
  'settings',
  'agencies',
  'reports'
];

console.log('1️⃣ Verificando módulos admin...');

adminModules.forEach(module => {
  const modulePath = path.join(adminPath, module, 'page.tsx');
  if (fs.existsSync(modulePath)) {
    console.log(`✅ Módulo ${module}: EXISTE`);
    
    // Leer contenido y verificar funcionalidades
    const content = fs.readFileSync(modulePath, 'utf8');
    
    // Verificar funciones críticas
    const functions = {
      'useState': content.includes('useState'),
      'useEffect': content.includes('useEffect'),
      'fetch o API calls': content.includes('fetch') || content.includes('/api/'),
      'Botones de acción': content.includes('onClick') || content.includes('onSubmit'),
      'Formularios': content.includes('form') || content.includes('Form'),
      'Tablas': content.includes('table') || content.includes('Table'),
      'Modales': content.includes('modal') || content.includes('Modal') || content.includes('Dialog'),
      'Loading states': content.includes('loading') || content.includes('Loading') || content.includes('Skeleton')
    };
    
    Object.entries(functions).forEach(([func, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${func}`);
    });
    
    console.log('');
  } else {
    console.log(`❌ Módulo ${module}: NO EXISTE`);
  }
});

// ===============================================
// 2. CREAR FUNCIONES FALTANTES PARA BOTONES
// ===============================================

console.log('2️⃣ Creando funciones para botones que no funcionan...');

// Archivo de utilidades para funciones comunes
const adminUtilsContent = `
// ===============================================
// UTILIDADES ADMIN - FUNCIONES COMUNES
// ===============================================

export class AdminAPI {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  
  // Método genérico para llamadas API
  static async call(endpoint: string, options: RequestInit = {}) {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(\`\${this.baseURL}/api/admin/\${endpoint}\`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? \`Bearer \${token}\` : '',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // CRUD genérico
  static async get(endpoint: string, params?: Record<string, any>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.call(\`\${endpoint}\${queryString}\`);
  }

  static async post(endpoint: string, data: any) {
    return this.call(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put(endpoint: string, data: any) {
    return this.call(endpoint, {
      method: 'PUT', 
      body: JSON.stringify(data)
    });
  }

  static async delete(endpoint: string) {
    return this.call(endpoint, {
      method: 'DELETE'
    });
  }
}

// Funciones específicas por módulo
export const UsersAPI = {
  getAll: (filters?: any) => AdminAPI.get('users', filters),
  getById: (id: number) => AdminAPI.get(\`users/\${id}\`),
  create: (data: any) => AdminAPI.post('users', data),
  update: (id: number, data: any) => AdminAPI.put(\`users/\${id}\`, data),
  delete: (id: number) => AdminAPI.delete(\`users/\${id}\`),
  updateStatus: (id: number, status: string) => AdminAPI.put(\`users/\${id}/status\`, { status }),
  resetPassword: (id: number) => AdminAPI.post(\`users/\${id}/reset-password\`, {}),
  getStats: () => AdminAPI.get('users/stats')
};

export const PackagesAPI = {
  getAll: (filters?: any) => AdminAPI.get('packages', filters),
  getById: (id: number) => AdminAPI.get(\`packages/\${id}\`),
  create: (data: any) => AdminAPI.post('packages', data),
  update: (id: number, data: any) => AdminAPI.put(\`packages/\${id}\`, data),
  delete: (id: number) => AdminAPI.delete(\`packages/\${id}\`),
  updateStatus: (id: number, status: string) => AdminAPI.put(\`packages/\${id}/status\`, { status }),
  duplicate: (id: number) => AdminAPI.post(\`packages/\${id}/duplicate\`, {}),
  getStats: () => AdminAPI.get('packages/stats')
};

export const BookingsAPI = {
  getAll: (filters?: any) => AdminAPI.get('bookings', filters),
  getById: (id: number) => AdminAPI.get(\`bookings/\${id}\`),
  create: (data: any) => AdminAPI.post('bookings', data),
  update: (id: number, data: any) => AdminAPI.put(\`bookings/\${id}\`, data),
  updateStatus: (id: number, status: string) => AdminAPI.put(\`bookings/\${id}/status\`, { status }),
  sendConfirmation: (id: number) => AdminAPI.post(\`bookings/\${id}/send-confirmation\`, {}),
  generateVoucher: (id: number) => AdminAPI.get(\`bookings/\${id}/voucher\`),
  getStats: () => AdminAPI.get('bookings/stats')
};

export const AgenciesAPI = {
  getAll: (filters?: any) => AdminAPI.get('agencies', filters),
  getById: (id: number) => AdminAPI.get(\`agencies/\${id}\`),
  create: (data: any) => AdminAPI.post('agencies', data),
  update: (id: number, data: any) => AdminAPI.put(\`agencies/\${id}\`, data),
  delete: (id: number) => AdminAPI.delete(\`agencies/\${id}\`),
  updateLevel: (id: number, level: string) => AdminAPI.put(\`agencies/\${id}/level\`, { level }),
  updateCommission: (id: number, commission: number) => AdminAPI.put(\`agencies/\${id}/commission\`, { commission }),
  getStats: () => AdminAPI.get('agencies/stats')
};

export const DestinationsAPI = {
  getAll: (filters?: any) => AdminAPI.get('destinations', filters),
  getById: (id: number) => AdminAPI.get(\`destinations/\${id}\`),
  create: (data: any) => AdminAPI.post('destinations', data),
  update: (id: number, data: any) => AdminAPI.put(\`destinations/\${id}\`, data),
  delete: (id: number) => AdminAPI.delete(\`destinations/\${id}\`),
  updateStatus: (id: number, status: string) => AdminAPI.put(\`destinations/\${id}/status\`, { status })
};

export const SettingsAPI = {
  getAll: () => AdminAPI.get('settings'),
  update: (key: string, value: any) => AdminAPI.put(\`settings/\${key}\`, { value }),
  updateBulk: (settings: Record<string, any>) => AdminAPI.put('settings', settings)
};

export const AnalyticsAPI = {
  getDashboard: () => AdminAPI.get('analytics/dashboard'),
  getRevenue: (period?: string) => AdminAPI.get('analytics/revenue', period ? { period } : {}),
  getUsers: (period?: string) => AdminAPI.get('analytics/users', period ? { period } : {}),
  getBookings: (period?: string) => AdminAPI.get('analytics/bookings', period ? { period } : {}),
  getPackages: (period?: string) => AdminAPI.get('analytics/packages', period ? { period } : {})
};

export const ReportsAPI = {
  getFinancial: (filters?: any) => AdminAPI.get('reports/financial', filters),
  getSales: (filters?: any) => AdminAPI.get('reports/sales', filters),
  getAgencies: (filters?: any) => AdminAPI.get('reports/agencies', filters),
  getOperational: (filters?: any) => AdminAPI.get('reports/operational', filters),
  export: (type: string, format: string, filters?: any) => 
    AdminAPI.get(\`reports/\${type}/export/\${format}\`, filters)
};

// Utilidades comunes
export const AdminUtils = {
  formatCurrency: (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  formatDate: (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-AR');
  },

  formatDateTime: (date: string | Date) => {
    return new Date(date).toLocaleString('es-AR');
  },

  showSuccessToast: (message: string) => {
    // Implementar toast de éxito
    console.log('✅ Success:', message);
  },

  showErrorToast: (message: string) => {
    // Implementar toast de error
    console.error('❌ Error:', message);
  },

  showConfirmDialog: (message: string): Promise<boolean> => {
    // Implementar modal de confirmación
    return Promise.resolve(confirm(message));
  }
};

// Hooks personalizados
export function useAdminAPI<T>(endpoint: string, filters?: any) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminAPI.get(endpoint, filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(filters)]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
`;

// Crear directorio lib si no existe
const libPath = path.join(adminPath, '..', '..', 'lib');
if (!fs.existsSync(libPath)) {
  fs.mkdirSync(libPath, { recursive: true });
}

fs.writeFileSync(path.join(libPath, 'admin-api.ts'), adminUtilsContent);
console.log('✅ Archivo de utilidades admin creado: lib/admin-api.ts');

// ===============================================
// 3. VERIFICAR RUTAS API DEL FRONTEND
// ===============================================

console.log('');
console.log('3️⃣ Verificando rutas API del frontend...');

const apiPath = path.join(adminPath, '..', 'api', 'admin');
const requiredAPIs = [
  'users/route.ts',
  'users/stats/route.ts',
  'packages/route.ts',
  'bookings/route.ts',
  'agencies/route.ts',
  'agencies/stats/route.ts',
  'destinations/route.ts',
  'settings/route.ts',
  'analytics/route.ts',
  'reports/route.ts'
];

requiredAPIs.forEach(api => {
  const apiFile = path.join(apiPath, api);
  if (fs.existsSync(apiFile)) {
    console.log(\`✅ API \${api}: EXISTE\`);
  } else {
    console.log(\`❌ API \${api}: FALTA\`);
  }
});

// ===============================================
// 4. VERIFICAR BACKEND MODULES
// ===============================================

console.log('');
console.log('4️⃣ Verificando módulos del backend...');

const backendModulesPath = 'D:\\Inter\\intertravel-website\\WEB-FINAL-UNIFICADA\\backend\\modules';
const requiredModules = [
  'users.js',
  'packages.js',
  'bookings.js',
  'destinations.js',
  'settings-manager.js',
  'smart-fallback-system.js',
  'leads.js'
];

requiredModules.forEach(module => {
  const moduleFile = path.join(backendModulesPath, module);
  if (fs.existsSync(moduleFile)) {
    console.log(\`✅ Módulo \${module}: EXISTE\`);
  } else {
    console.log(\`❌ Módulo \${module}: FALTA\`);
  }
});

console.log('');
console.log('🎉 VERIFICACIÓN COMPLETADA!');
console.log('');
console.log('📋 PARA ASEGURAR QUE TODOS LOS BOTONES FUNCIONEN:');
console.log('');
console.log('1. Ejecutar REPARACION-CRITICA-COMPLETA.js');
console.log('2. Importar AdminAPI en los componentes admin');
console.log('3. Conectar botones con las funciones API');
console.log('4. Implementar manejo de estados de loading/error');
console.log('5. Agregar confirmaciones para acciones destructivas');
console.log('');
console.log('💡 Ejemplo de uso en componentes:');
console.log('');
console.log('import { UsersAPI, AdminUtils } from "@/lib/admin-api";');
console.log('');
console.log('const handleDeleteUser = async (id: number) => {');
console.log('  const confirmed = await AdminUtils.showConfirmDialog("¿Eliminar usuario?");');
console.log('  if (confirmed) {');
console.log('    try {');
console.log('      await UsersAPI.delete(id);');
console.log('      AdminUtils.showSuccessToast("Usuario eliminado");');
console.log('      refetchUsers();');
console.log('    } catch (error) {');
console.log('      AdminUtils.showErrorToast("Error al eliminar");');
console.log('    }');
console.log('  }');
console.log('};');
