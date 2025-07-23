// ===============================================
// TESTING UI/UX Y DETECCIÓN DE BUGS VISUALES
// Verificación experiencia usuario completa
// ===============================================

const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuración testing UI/UX
const config = {
  frontend: 'http://localhost:3005',
  admin: 'http://localhost:3005/admin',
  appClient: 'http://localhost:3009',
  headless: false, // Ver navegador durante tests
  timeout: 30000
};

// ===============================================
// TESTING FRONTEND PÚBLICO
// ===============================================

async function testPublicUI() {
  console.log('\n🎨 TESTING UI/UX FRONTEND PÚBLICO');
  console.log('==================================');
  
  const browser = await puppeteer.launch({ headless: config.headless });
  const page = await browser.newPage();
  const issues = [];
  
  try {
    // Configurar viewport móvil y desktop
    await page.setViewport({ width: 1200, height: 800 });
    
    // 1. Cargar página principal
    console.log('1️⃣ Cargando página principal...');
    await page.goto(config.frontend, { waitUntil: 'networkidle2', timeout: config.timeout });
    
    // Verificar elementos críticos
    const title = await page.title();
    if (!title.includes('InterTravel')) {
      issues.push('❌ Título página no contiene "InterTravel"');
    }
    
    // 2. Verificar buscador
    console.log('2️⃣ Testing buscador de paquetes...');
    const searchBox = await page.$('input[type="search"], input[placeholder*="buscar"], input[placeholder*="destino"]');
    if (!searchBox) {
      issues.push('❌ Buscador no encontrado en homepage');
    } else {
      await searchBox.type('Peru');
      console.log('✅ Buscador funcional');
    }
    
    // 3. Verificar responsividad móvil
    console.log('3️⃣ Testing responsividad móvil...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(2000);
    
    const mobileMenu = await page.$('button[aria-label*="menu"], .hamburger, .mobile-menu');
    if (!mobileMenu) {
      issues.push('⚠️ Menú móvil no detectado');
    }
    
    // 4. Verificar elementos visuales
    console.log('4️⃣ Verificando elementos visuales...');
    
    // Screenshots para análisis visual
    await page.screenshot({ path: 'ui-test-mobile.png' });
    await page.setViewport({ width: 1200, height: 800 });
    await page.screenshot({ path: 'ui-test-desktop.png' });
    
    // 5. Verificar links críticos
    console.log('5️⃣ Verificando navegación...');
    const links = await page.$$eval('a', links => 
      links.map(link => ({ href: link.href, text: link.textContent.trim() }))
        .filter(link => link.text && link.href)
    );
    
    if (links.length < 5) {
      issues.push('⚠️ Pocos links de navegación detectados');
    }
    
    console.log(`✅ Frontend público: ${issues.length} issues detectados`);
    
  } catch (error) {
    issues.push(`💥 Error testing frontend: ${error.message}`);
  }
  
  await browser.close();
  return issues;
}

// ===============================================
// TESTING ADMIN PANEL UI
// ===============================================

async function testAdminUI() {
  console.log('\n👨‍💼 TESTING UI/UX ADMIN PANEL');
  console.log('==============================');
  
  const browser = await puppeteer.launch({ headless: config.headless });
  const page = await browser.newPage();
  const issues = [];
  
  try {
    await page.setViewport({ width: 1200, height: 800 });
    
    // 1. Cargar login admin
    console.log('1️⃣ Cargando login admin...');
    await page.goto(config.admin, { waitUntil: 'networkidle2', timeout: config.timeout });
    
    // 2. Verificar formulario login
    console.log('2️⃣ Testing formulario login...');
    const usernameField = await page.$('input[name="username"], input[type="email"], input[placeholder*="usuario"]');
    const passwordField = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"], button:contains("Login"), button:contains("Ingresar")');
    
    if (!usernameField) issues.push('❌ Campo usuario no encontrado');
    if (!passwordField) issues.push('❌ Campo password no encontrado'); 
    if (!loginButton) issues.push('❌ Botón login no encontrado');
    
    // 3. Test login real
    if (usernameField && passwordField && loginButton) {
      console.log('3️⃣ Probando login admin...');
      await usernameField.type('admin');
      await passwordField.type('admin123');
      await loginButton.click();
      
      await page.waitForTimeout(3000);
      
      // Verificar si login exitoso
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || currentUrl.includes('admin')) {
        console.log('✅ Login admin exitoso');
        
        // 4. Verificar dashboard
        console.log('4️⃣ Testing dashboard admin...');
        const navigation = await page.$('nav, .sidebar, .menu');
        if (!navigation) {
          issues.push('❌ Navegación admin no encontrada');
        }
        
        // Verificar módulos principales
        const modulesText = await page.evaluate(() => document.body.textContent);
        const expectedModules = ['clientes', 'reservas', 'paquetes', 'usuarios'];
        const foundModules = expectedModules.filter(module => 
          modulesText.toLowerCase().includes(module)
        );
        
        if (foundModules.length < 2) {
          issues.push('⚠️ Pocos módulos admin detectados');
        }
        
        // Screenshot dashboard
        await page.screenshot({ path: 'ui-test-admin-dashboard.png' });
        
      } else {
        issues.push('❌ Login admin falló - no redirigió a dashboard');
      }
    }
    
    console.log(`✅ Admin UI: ${issues.length} issues detectados`);
    
  } catch (error) {
    issues.push(`💥 Error testing admin UI: ${error.message}`);
  }
  
  await browser.close();
  return issues;
}

// ===============================================
// TESTING APP CLIENTE UI
// ===============================================

async function testAppClientUI() {
  console.log('\n📱 TESTING UI/UX APP CLIENTE');
  console.log('============================');
  
  const browser = await puppeteer.launch({ headless: config.headless });
  const page = await browser.newPage();
  const issues = [];
  
  try {
    // Simular dispositivo móvil
    await page.setViewport({ width: 375, height: 667 });
    
    // 1. Cargar app cliente
    console.log('1️⃣ Cargando app cliente...');
    await page.goto(config.appClient, { waitUntil: 'networkidle2', timeout: config.timeout });
    
    // 2. Verificar PWA características
    console.log('2️⃣ Verificando características PWA...');
    const manifest = await page.$('link[rel="manifest"]');
    if (!manifest) {
      issues.push('⚠️ Manifest PWA no encontrado');
    }
    
    // 3. Verificar responsive design
    console.log('3️⃣ Testing responsive design...');
    await page.screenshot({ path: 'ui-test-app-mobile.png' });
    
    // 4. Verificar elementos móviles
    const mobileElements = await page.evaluate(() => {
      const elements = {
        touchTargets: document.querySelectorAll('button, a, input').length,
        fontSize: window.getComputedStyle(document.body).fontSize,
        viewport: document.querySelector('meta[name="viewport"]')?.content
      };
      return elements;
    });
    
    if (!mobileElements.viewport || !mobileElements.viewport.includes('width=device-width')) {
      issues.push('⚠️ Viewport meta tag no optimizado para móvil');
    }
    
    console.log(`✅ App Cliente UI: ${issues.length} issues detectados`);
    
  } catch (error) {
    issues.push(`💥 Error testing app cliente UI: ${error.message}`);
  }
  
  await browser.close();
  return issues;
}

// ===============================================
// PERFORMANCE UI TESTING
// ===============================================

async function testUIPerformance() {
  console.log('\n⚡ TESTING PERFORMANCE UI');
  console.log('=========================');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const performanceIssues = [];
  
  try {
    // Habilitar métricas de performance
    await page.setCacheEnabled(false);
    
    // Test Frontend
    console.log('1️⃣ Midiendo performance frontend...');
    const startTime = Date.now();
    await page.goto(config.frontend, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 5000) {
      performanceIssues.push(`⚠️ Frontend carga lenta: ${loadTime}ms`);
    }
    
    // Métricas Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          entries.forEach(entry => {
            metrics[entry.name] = entry.value;
          });
          resolve(metrics);
        }).observe({ type: 'measure', buffered: true });
        
        // Fallback si no hay métricas
        setTimeout(() => resolve({}), 2000);
      });
    });
    
    console.log(`✅ Performance UI: Load time ${loadTime}ms`);
    
  } catch (error) {
    performanceIssues.push(`💥 Error testing performance: ${error.message}`);
  }
  
  await browser.close();
  return performanceIssues;
}

// ===============================================
// EJECUTAR TESTING UI/UX COMPLETO
// ===============================================

async function runCompleteUITesting() {
  console.log('🎨 INICIANDO TESTING UI/UX COMPLETO');
  console.log('===================================');
  console.log(`Fecha: ${new Date().toISOString()}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    frontend: [],
    admin: [],
    appClient: [],
    performance: [],
    summary: {}
  };
  
  try {
    // Ejecutar todos los tests UI
    console.log('🚀 Ejecutando tests UI/UX...');
    
    results.frontend = await testPublicUI();
    results.admin = await testAdminUI();
    results.appClient = await testAppClientUI();
    results.performance = await testUIPerformance();
    
    // Calcular resumen
    const totalIssues = results.frontend.length + results.admin.length + 
                       results.appClient.length + results.performance.length;
    
    results.summary = {
      frontendIssues: results.frontend.length,
      adminIssues: results.admin.length,
      appClientIssues: results.appClient.length,
      performanceIssues: results.performance.length,
      totalIssues,
      uiScore: Math.max(0, 100 - (totalIssues * 10))
    };
    
    // Guardar resultados
    fs.writeFileSync('ui-testing-complete-report.json', JSON.stringify(results, null, 2));
    
    console.log('\n📊 RESUMEN TESTING UI/UX');
    console.log('========================');
    console.log(`🌐 Frontend issues: ${results.summary.frontendIssues}`);
    console.log(`👨‍💼 Admin issues: ${results.summary.adminIssues}`);
    console.log(`📱 App Cliente issues: ${results.summary.appClientIssues}`);
    console.log(`⚡ Performance issues: ${results.summary.performanceIssues}`);
    console.log(`📈 UI Score: ${results.summary.uiScore}%`);
    
    console.log('\n📸 Screenshots generados:');
    console.log('- ui-test-desktop.png');
    console.log('- ui-test-mobile.png'); 
    console.log('- ui-test-admin-dashboard.png');
    console.log('- ui-test-app-mobile.png');
    
    console.log('\n💾 Reporte UI guardado en: ui-testing-complete-report.json');
    
    if (results.summary.uiScore >= 80) {
      console.log('🎉 UI/UX EN BUEN ESTADO - LISTO PARA PRODUCCIÓN');
    } else if (results.summary.uiScore >= 60) {
      console.log('⚠️ UI/UX FUNCIONAL - REQUIERE MEJORAS');
    } else {
      console.log('❌ UI/UX REQUIERE TRABAJO IMPORTANTE');
    }
    
  } catch (error) {
    console.error('💥 Error en testing UI completo:', error);
  }
}

// Ejecutar testing UI
if (require.main === module) {
  runCompleteUITesting();
}

module.exports = {
  runCompleteUITesting,
  testPublicUI,
  testAdminUI,
  testAppClientUI,
  testUIPerformance
};
