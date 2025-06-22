# BACKUP ESPECIFICO - SOLO LANDING Y COMPONENTES WEB
# Backup ligero de archivos clave para regeneración

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  BACKUP LANDING + COMPONENTES WEB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "D:\Inter\intertravel-website\BACKUP-LANDING-$timestamp"

Write-Host "Creando backup específico: $backupDir" -ForegroundColor Yellow

# Crear directorio de backup
New-Item -ItemType Directory -Path $backupDir -Force

# Estructura de carpetas
New-Item -ItemType Directory -Path "$backupDir\app\(public)" -Force
New-Item -ItemType Directory -Path "$backupDir\components\globe" -Force
New-Item -ItemType Directory -Path "$backupDir\components\destinations" -Force
New-Item -ItemType Directory -Path "$backupDir\components\search" -Force
New-Item -ItemType Directory -Path "$backupDir\components\quiz" -Force

Write-Host "Copiando archivos específicos..." -ForegroundColor Yellow

# Página principal
Copy-Item -Path "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\app\(public)\page.tsx" -Destination "$backupDir\app\(public)\page.tsx" -Force

# Componentes de globo/mapa
$globeDir = "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\components\globe"
if (Test-Path $globeDir) {
    Copy-Item -Path "$globeDir\*" -Destination "$backupDir\components\globe\" -Recurse -Force
}

# Componentes de destinos
$destDir = "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\components\destinations"
if (Test-Path $destDir) {
    Copy-Item -Path "$destDir\*" -Destination "$backupDir\components\destinations\" -Recurse -Force
}

# Componentes de búsqueda
$searchDir = "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\components\search"
if (Test-Path $searchDir) {
    Copy-Item -Path "$searchDir\*" -Destination "$backupDir\components\search\" -Recurse -Force
}

# Componentes de quiz
$quizDir = "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\components\quiz"
if (Test-Path $quizDir) {
    Copy-Item -Path "$quizDir\*" -Destination "$backupDir\components\quiz\" -Recurse -Force
}

# Layout principal
$layoutFile = "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\app\layout.tsx"
if (Test-Path $layoutFile) {
    Copy-Item -Path $layoutFile -Destination "$backupDir\layout.tsx" -Force
}

# Globals CSS
$globalsFile = "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend\src\app\globals.css"
if (Test-Path $globalsFile) {
    Copy-Item -Path $globalsFile -Destination "$backupDir\globals.css" -Force
}

# Crear inventario de archivos
$inventario = @"
# INVENTARIO DE BACKUP LANDING - $timestamp

## ARCHIVOS RESPALDADOS:
- ✅ app/(public)/page.tsx - Página principal
- ✅ components/globe/* - Componentes de mapa/globo  
- ✅ components/destinations/* - Componentes de destinos
- ✅ components/search/* - Componentes de búsqueda
- ✅ components/quiz/* - Quiz inteligente
- ✅ layout.tsx - Layout principal
- ✅ globals.css - Estilos globales

## ESTADO ACTUAL:
- Problemas: Superposición de mapas, layout desorganizado
- Objetivo: Regenerar landing limpia y funcional
- Tamaño: Backup ligero (~500KB)

## PARA RESTAURAR:
Copiar archivos desde este backup a sus ubicaciones originales en:
/src/app/(public)/
/src/components/
"@

$inventario | Out-File -FilePath "$backupDir\INVENTARIO.md" -Encoding UTF8

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ BACKUP LIGERO COMPLETADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Backup en: $backupDir" -ForegroundColor White
Write-Host "📋 Solo archivos de landing y componentes web" -ForegroundColor White
Write-Host "💾 Tamaño: Ligero (~500KB)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Listo para regeneración completa" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para continuar"
