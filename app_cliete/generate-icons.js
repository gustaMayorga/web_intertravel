const fs = require('fs');
const path = require('path');

console.log('🎨 Generando iconos faltantes para InterTravel App...\n');

const iconsDir = 'D:\\Inter\\intertravel-website\\WEB-FINAL-UNIFICADA\\app_cliete\\public\\icons';

// Asegurar que el directorio existe
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 Directorio icons creado');
}

// Tamaños de iconos necesarios
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Función para crear SVG con tamaño específico
function createSVG(size) {
    const fontSize = Math.max(12, size / 8);
    const circleRadius = size / 12;
    const pathSize = size / 3;
    const textY = size * 0.85;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size/7}" fill="url(#grad1)"/>
  <circle cx="${size/2}" cy="${size/3}" r="${circleRadius}" fill="white"/>
  <path d="M${size/3} ${size/2} L${size/2} ${size*2/3} L${size*2/3} ${size/2} L${size/2} ${size*5/12} Z" fill="white"/>
  <text x="${size/2}" y="${textY}" text-anchor="middle" fill="white" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold">IT</text>
</svg>`;
}

// Generar todos los iconos
sizes.forEach(size => {
    const svgContent = createSVG(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    
    fs.writeFileSync(filepath, svgContent, 'utf8');
    console.log(`✅ Creado: ${filename}`);
});

// Crear también un favicon.ico como SVG
const faviconContent = createSVG(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconContent, 'utf8');
console.log('✅ Creado: favicon.svg');

console.log('\n🎉 Todos los iconos generados exitosamente!');
console.log('📝 Archivos creados en:', iconsDir);
console.log('\n💡 Nota: Los archivos son SVG, que son compatibles.');
console.log('   Los navegadores modernos los manejan como PNG/ICO.');
