const fs = require('fs');
const path = require('path');

// Configuración de caracteres problemáticos y sus reemplazos
const CHAR_REPLACEMENTS = {
  // Comillas problemáticas - usando códigos Unicode para evitar problemas
  '\u201C': '"',  // "
  '\u201D': '"',  // "
  '\u2018': "'",  // '
  '\u2019': "'",  // '
  
  // Guiones problemáticos
  '\u2013': '-',  // –
  '\u2014': '-',  // —
  '\u2015': '-',  // ―
  
  // Espacios problemáticos
  '\u00A0': ' ',  // Non-breaking space
  '\u2003': ' ',  // Em space
  '\u2002': ' ',  // En space
  
  // Otros caracteres problemáticos
  '\u2026': '...',  // …
  '\u2022': '*',    // •
  '\u00B0': 'deg',  // °
  '\u2122': 'TM',   // ™
  '\u00AE': '(R)',  // ®
  '\u00A9': '(C)',  // ©
};

// Extensiones de archivos a procesar
const EXTENSIONS_TO_PROCESS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html'];

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
          if (!['node_modules', '.git', 'dist', 'build', '.next', '_archive', 'backup'].includes(item)) {
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
              charCode: badChar.charCodeAt(0).toString(16),
              replacement: goodChar,
              count: matches.length
            });
          }
        }

        // Buscar emojis genéricos
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const emojiMatches = content.match(emojiRegex);
        if (emojiMatches) {
          fileIssues.push({
            char: 'EMOJIS_VARIOS',
            replacement: 'texto_descriptivo',
            count: emojiMatches.length,
            emojis: [...new Set(emojiMatches)]
          });
        }

        if (fileIssues.length > 0) {
          issues.push({ file: filePath, issues: fileIssues });
        }
      } catch (error) {
        console.error(`Error escaneando ${filePath}: ${error.message}`);
      }
    };

    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next', '_archive', 'backup'].includes(item)) {
            scanDirectory(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(fullPath);
            if (EXTENSIONS_TO_PROCESS.includes(ext)) {
              scanFile(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error escaneando directorio ${dirPath}: ${error.message}`);
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
      console.log('\n🔍 CARACTERES PROBLEMÁTICOS ENCONTRADOS:');
      console.log('==========================================');
      issues.forEach(({ file, issues }) => {
        console.log(`\n📄 ${file}:`);
        issues.forEach(({ char, charCode, replacement, count, emojis }) => {
          if (emojis) {
            console.log(`   EMOJIS: ${emojis.join(' ')} (${count} veces)`);
          } else {
            console.log(`   "${char}" (U+${charCode}) → "${replacement}" (${count} veces)`);
          }
        });
      });
      
      console.log(`\n💡 Para limpiar automáticamente, ejecuta:`);
      console.log(`   node clean-special-chars-fixed.js`);
    }
  } else {
    await cleaner.processDirectory(projectPath);
    cleaner.generateReport();
  }
}

// Script ejecutable
if (require.main === module) {
  const args = process.argv.slice(2);
  const scanOnly = args.includes('--scan');
  
  // Si incluye --scan, usar directorio actual
  const projectPath = scanOnly ? process.cwd() : (args[0] || process.cwd());

  cleanProject(projectPath, scanOnly).catch(console.error);
}

module.exports = { SpecialCharCleaner, cleanProject };