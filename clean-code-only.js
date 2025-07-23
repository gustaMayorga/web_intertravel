const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPIEZA CONSERVADORA DE ARCHIVOS DE CÓDIGO');
console.log('===============================================');
console.log('📋 Solo limpia archivos: .ts .tsx .js .jsx');
console.log('🛡️ Preserva archivos: .md .html .json');
console.log('💾 Crea backups automáticos');

// Caracteres problemáticos usando códigos Unicode seguros
const CHAR_REPLACEMENTS = {
  '\u201C': '"',  // "
  '\u201D': '"',  // "
  '\u2018': "'",  // '
  '\u2019': "'",  // '
  '\u2013': '-',  // –
  '\u2014': '-',  // —
  '\u2015': '-',  // ―
  '\u2026': '...',  // …
  '\u2022': '*',    // •
  '\u00B0': 'deg',  // °
  '\u00A0': ' ',    // Non-breaking space
};

// Solo archivos de código críticos
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

class CodeCleaner {
  constructor() {
    this.filesProcessed = 0;
    this.filesWithChanges = 0;
    this.emojisRemoved = 0;
    this.charsReplaced = 0;
    this.errors = [];
    this.backupDir = path.join(process.cwd(), '_backup_char_cleaning');
  }

  // Crear directorio de backup
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Directorio de backup creado: ${this.backupDir}`);
    }
  }

  // Limpiar caracteres especiales y emojis
  cleanContent(content) {
    let cleanContent = content;
    let changes = {
      chars: 0,
      emojis: 0,
      details: []
    };

    // Limpiar caracteres especiales
    for (const [badChar, goodChar] of Object.entries(CHAR_REPLACEMENTS)) {
      if (cleanContent.includes(badChar)) {
        const count = (cleanContent.match(new RegExp(badChar, 'g')) || []).length;
        cleanContent = cleanContent.replace(new RegExp(badChar, 'g'), goodChar);
        changes.chars += count;
        changes.details.push(`"${badChar}" → "${goodChar}" (${count}x)`);
      }
    }

    // Limpiar emojis (más agresivo para archivos de código)
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiMatches = cleanContent.match(emojiRegex);
    
    if (emojiMatches) {
      const uniqueEmojis = [...new Set(emojiMatches)];
      // Reemplazar emojis con comentarios descriptivos
      cleanContent = cleanContent.replace(emojiRegex, '');
      changes.emojis = emojiMatches.length;
      changes.details.push(`EMOJIS removidos: ${uniqueEmojis.join(' ')} (${emojiMatches.length}x)`);
    }

    return { content: cleanContent, changes };
  }

  // Procesar un archivo individual
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: cleanContent, changes } = this.cleanContent(content);

      if (changes.chars > 0 || changes.emojis > 0) {
        // Crear backup
        const relativePath = path.relative(process.cwd(), filePath);
        const backupPath = path.join(this.backupDir, relativePath);
        const backupDirPath = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        
        fs.writeFileSync(backupPath, content, 'utf8');
        
        // Escribir archivo limpio
        fs.writeFileSync(filePath, cleanContent, 'utf8');
        
        // Estadísticas
        this.filesWithChanges++;
        this.charsReplaced += changes.chars;
        this.emojisRemoved += changes.emojis;
        
        console.log(`✅ LIMPIADO: ${relativePath}`);
        changes.details.forEach(detail => console.log(`   ${detail}`));
      }

      this.filesProcessed++;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ ERROR: ${filePath} - ${error.message}`);
    }
  }

  // Procesar directorio recursivamente
  processDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Saltar carpetas no necesarias
          if (!['node_modules', '.git', 'dist', 'build', '.next', '_archive', '_backup', 'backup'].includes(item)) {
            this.processDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (CODE_EXTENSIONS.includes(ext)) {
            this.processFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error procesando directorio ${dirPath}: ${error.message}`);
    }
  }

  // Generar reporte final
  generateReport() {
    console.log('\n📊 REPORTE DE LIMPIEZA CONSERVADORA');
    console.log('====================================');
    console.log(`📁 Archivos procesados: ${this.filesProcessed}`);
    console.log(`✅ Archivos modificados: ${this.filesWithChanges}`);
    console.log(`🔤 Caracteres especiales reemplazados: ${this.charsReplaced}`);
    console.log(`😀 Emojis removidos: ${this.emojisRemoved}`);
    console.log(`❌ Errores: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORES ENCONTRADOS:');
      this.errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }

    if (this.filesWithChanges > 0) {
      console.log(`\n💾 Backups guardados en: ${this.backupDir}`);
      console.log('\n🎯 PRÓXIMOS PASOS:');
      console.log('   1. Ejecuta: npm run build');
      console.log('   2. Si hay errores, revisa los cambios');
      console.log('   3. Si todo está bien, continúa con deployment');
    }

    console.log('\n✨ Limpieza conservadora completada!');
  }

  // Ejecutar limpieza completa
  async clean() {
    console.log(`\n🚀 Iniciando limpieza en: ${process.cwd()}`);
    
    this.ensureBackupDir();
    this.processDirectory(process.cwd());
    this.generateReport();
  }
}

// Ejecutar
if (require.main === module) {
  const cleaner = new CodeCleaner();
  cleaner.clean().catch(console.error);
}

module.exports = CodeCleaner;