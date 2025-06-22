// ======================================
// TRAVEL COMPOSITOR CONFIGURACIÓN MEJORADA
// ======================================

const tcConfig = {
  // URLs posibles de Travel Compositor
  apiUrls: [
    'https://online.travelcompositor.com/api',
    'https://online.travelcompositor.com/resources',
    'https://online.travelcompositor.com',
    'https://api.travelcompositor.com'
  ],
  
  authEndpoints: [
    '/auth',
    '/login', 
    '/authenticate',
    '/token',
    '/oauth/token'
  ],
  
  username: process.env.TC_USERNAME || 'ApiUser1',
  password: process.env.TC_PASSWORD || 'Veoveo77*',
  micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
  timeout: 30000,
  
  // Cache de token
  tokenCache: {
    token: null,
    expires: null,
    validApiUrl: null
  },
  
  // Probar múltiples URLs y endpoints
  async findWorkingEndpoint() {
    const axios = require('axios');
    
    for (const baseUrl of this.apiUrls) {
      for (const authEndpoint of this.authEndpoints) {
        try {
          console.log(`🔍 Probando: ${baseUrl}${authEndpoint}`);
          
          const response = await axios.post(`${baseUrl}${authEndpoint}`, {
            username: this.username,
            password: this.password
          }, {
            timeout: this.timeout,
            headers: { 'Content-Type': 'application/json' },
            validateStatus: (status) => status < 500 // Aceptar 400s para debug
          });
          
          console.log(`📊 Respuesta ${response.status}:`, response.data);
          
          if (response.status === 200 && response.data) {
            if (response.data.token || response.data.access_token) {
              this.tokenCache.validApiUrl = baseUrl;
              const token = response.data.token || response.data.access_token;
              this.tokenCache.token = token;
              this.tokenCache.expires = Date.now() + (response.data.expires_in || 3600) * 1000;
              
              console.log(`✅ Endpoint funcional encontrado: ${baseUrl}${authEndpoint}`);
              return { baseUrl, authEndpoint, token };
            }
          }
          
        } catch (error) {
          console.log(`❌ Error en ${baseUrl}${authEndpoint}:`, error.message);
        }
      }
    }
    
    return null;
  },
  
  // Autenticación mejorada
  async authenticate() {
    try {
      // Si ya tenemos un endpoint válido, usarlo
      if (this.tokenCache.validApiUrl) {
        const axios = require('axios');
        const response = await axios.post(`${this.tokenCache.validApiUrl}/auth`, {
          username: this.username,
          password: this.password
        }, {
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data && (response.data.token || response.data.access_token)) {
          const token = response.data.token || response.data.access_token;
          this.tokenCache.token = token;
          this.tokenCache.expires = Date.now() + (response.data.expires_in || 3600) * 1000;
          console.log('✅ Travel Compositor re-autenticado');
          return token;
        }
      }
      
      // Si no, buscar endpoint funcional
      const result = await this.findWorkingEndpoint();
      if (result) {
        return result.token;
      }
      
      throw new Error('No se encontró endpoint funcional');
      
    } catch (error) {
      console.warn('⚠️ Error autenticando con Travel Compositor:', error.message);
      return null;
    }
  },
  
  // Test de conectividad simple
  async testConnectivity() {
    const axios = require('axios');
    
    console.log('🧪 Probando conectividad básica con Travel Compositor...');
    
    for (const baseUrl of this.apiUrls) {
      try {
        const response = await axios.get(baseUrl, {
          timeout: 5000,
          validateStatus: () => true // Aceptar cualquier status
        });
        
        console.log(`📡 ${baseUrl} - Status: ${response.status}`);
        
        if (response.status < 500) {
          console.log(`✅ ${baseUrl} está respondiendo`);
          return baseUrl;
        }
        
      } catch (error) {
        console.log(`❌ ${baseUrl} - Error: ${error.message}`);
      }
    }
    
    return null;
  },
  
  // Obtener token válido
  async getValidToken() {
    if (this.tokenCache.token && this.tokenCache.expires > Date.now()) {
      return this.tokenCache.token;
    }
    return await this.authenticate();
  }
};

module.exports = tcConfig;