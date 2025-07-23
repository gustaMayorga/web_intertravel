const fs = require('fs');
const path = require('path');

// Configuración de caracteres problemáticos y sus reemplazos
const CHAR_REPLACEMENTS = {
  // Comillas problemáticas
  '"': '"',
  '"': '"',
  ''': "'",
  ''': "'",
  
  // Guiones problemáticos
  '–': '-',
  '—': '-',
  '―': '-',
  
  // Espacios problemáticos
  ' ': ' ',  // Non-breaking space
  ' ': ' ',  // Em space
  ' ': ' ',  // En space
  
  // Otros caracteres problemáticos
  '…': '...',
  '•': '*',
  '°': 'deg',
  '™': 'TM',
  '®': '(R)',
  '©': '(C)',
};

// Extensiones de archivos a procesar
const EXTENSIONS_TO_PROCESS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

class SpecialCharCleaner {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.filesProcessed = 0;
    this.filesWithChanges = 0;
    this.errors = [];
  }

  // Función principal para limpiar caracteres especiales
  cleanSpecialChars(content) {
    let cleanContent = content;
    let hasChanges = false;

    for (const [badChar, goodChar] of Object.entries(CHAR_REPLACEMENTS)) {
      if (cleanContent.includes(badChar)) {
        cleanContent = cleanContent.replace(new RegExp(badChar, 'g'), goodChar);
        hasChanges = true;
      }
    }

    return { content: cleanContent, hasChanges };
  }

  // Procesar un archivo individual
  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: cleanContent, hasChanges } = this.cleanSpecialChars(content);

      if (hasChanges) {
        // Crear backup antes de modificar
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, content, 'utf8');
        
        // Escribir contenido limpio
        fs.writeFileSync(filePath, cleanContent, 'utf8');
        
        this.filesWithChanges++;
        console.log(`✅ Limpiado: ${filePath}`);
        
        // Eliminar backup si todo salió bien
        fs.unlinkSync(backupPath);
      }

      this.filesProcessed++;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error procesando ${filePath}: ${error.message}`);
    }
  }

  // Procesar directorio recursivamente
  async processDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Saltar node_modules y otras carpetas no necesarias
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            await this.processDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (EXTENSIONS_TO_PROCESS.includes(ext)) {
            await this.processFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error procesando directorio ${dirPath}: ${error.message}`);
    }
  }

  // Verificar caracteres problemáticos sin modificar archivos
  async scanForIssues(dirPath) {
    const issues = [];
    
    const scanFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileIssues = [];

        for (const [badChar, goodChar] of Object.entries(CHAR_REPLACEMENTS)) {
          const matches = content.match(new RegExp(badChar, 'g'));
          if (matches) {
            fileIssues.push({
              char: badChar,
              replacement: goodChar,
              count: matches.length
            });
          }
        }

        if (fileIssues.length > 0) {
          issues.push({ file: filePath, issues: fileIssues });
        }
      } catch (error) {
        console.error(`Error escaneando ${filePath}: ${error.message}`);
      }
    };

    const scanDirectory = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (EXTENSIONS_TO_PROCESS.includes(ext)) {
            scanFile(fullPath);
          }
        }
      }
    };

    scanDirectory(dirPath);
    return issues;
  }

  // Generar reporte de limpieza
  generateReport() {
    console.log('\n📊 REPORTE DE LIMPIEZA');
    console.log('========================');
    console.log(`📁 Archivos procesados: ${this.filesProcessed}`);
    console.log(`✅ Archivos modificados: ${this.filesWithChanges}`);
    console.log(`❌ Errores: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORES ENCONTRADOS:');
      this.errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }

    console.log('\n✨ Limpieza completada!');
  }
}

// Función de uso principal
async function cleanProject(projectPath, scanOnly = false) {
  console.log(`🧹 ${scanOnly ? 'Escaneando' : 'Limpiando'} proyecto: ${projectPath}`);
  
  const cleaner = new SpecialCharCleaner(projectPath);

  if (scanOnly) {
    const issues = await cleaner.scanForIssues(projectPath);
    
    if (issues.length === 0) {
      console.log('✅ No se encontraron caracteres especiales problemáticos.');
    } else {
      console.log('🔍 CARACTERES PROBLEMÁTICOS ENCONTRADOS:');
      issues.forEach(({ file, issues }) => {
        console.log(`\n📄 ${file}:`);
        issues.forEach(({ char, replacement, count }) => {
          console.log(`   "${char}" → "${replacement}" (${count} veces)`);
        });
      });
    }
  } else {
    await cleaner.processDirectory(projectPath);
    cleaner.generateReport();
  }
}

// Script ejecutable
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();
  const scanOnly = args.includes('--scan');

  cleanProject(projectPath, scanOnly).catch(console.error);
}

module.exports = { SpecialCharCleaner, cleanProject };

// Ejemplos de uso:
// node clean-special-chars.js --scan                    // Solo escanear
// node clean-special-chars.js                          // Limpiar automáticamente
// node clean-special-chars.js /ruta/al/proyecto        // Limpiar proyecto específico