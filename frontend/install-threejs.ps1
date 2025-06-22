# Instalar Three.js en InterTravel Frontend
Write-Host "=========================================="
Write-Host "  INTERTRAVEL - INSTALACION THREEJS"
Write-Host "=========================================="
Write-Host ""

# Verificar directorio actual
$currentDir = Get-Location
Write-Host "Directorio actual: $currentDir"

# Verificar archivos clave
if (Test-Path "package.json") {
    Write-Host "✅ package.json encontrado"
} else {
    Write-Host "❌ package.json NO encontrado"
    Write-Host "❌ No estas en el directorio correcto"
    pause
    exit
}

if (Test-Path "src") {
    Write-Host "✅ Directorio src/ encontrado"
} else {
    Write-Host "❌ Directorio src/ NO encontrado"
    pause
    exit
}

Write-Host ""
Write-Host "Instalando Three.js..."
Write-Host ""

# Instalar Three.js
npm install three @types/three --legacy-peer-deps

Write-Host ""
Write-Host "Verificando instalacion..."

if (Test-Path "node_modules\three") {
    Write-Host "✅ Three.js instalado correctamente"
    Write-Host "✅ Listo para usar en tu proyecto"
} else {
    Write-Host "❌ Error en la instalacion"
    Write-Host "Intenta manualmente: npm install three @types/three --force"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  INSTALACION COMPLETADA"
Write-Host "=========================================="
Write-Host ""
Write-Host "Ahora puedes usar:"
Write-Host "import * as THREE from 'three';"
Write-Host ""
pause
