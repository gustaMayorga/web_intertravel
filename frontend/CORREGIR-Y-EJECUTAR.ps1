# SOLUCION useOptimizations - PowerShell
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CORRIGIENDO ERROR useOptimizations" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

# Navegar al directorio
Set-Location "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend"

# Limpiar cache
Write-Host "Limpiando cache..." -ForegroundColor Green
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Green
npm install

# Verificar archivos corregidos
Write-Host "Verificando correcciones..." -ForegroundColor Green
if (Test-Path "src\components\ClientOptimizations.tsx") { 
    Write-Host "✓ ClientOptimizations.tsx" -ForegroundColor Green 
} else { 
    Write-Host "✗ Falta ClientOptimizations.tsx" -ForegroundColor Red 
}

if (Test-Path "src\types\global.d.ts") { 
    Write-Host "✓ Tipos globales" -ForegroundColor Green 
} else { 
    Write-Host "✗ Faltan tipos globales" -ForegroundColor Red 
}

# Iniciar servidor
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "INICIANDO SERVIDOR EN PUERTO 3005" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

npm run dev
