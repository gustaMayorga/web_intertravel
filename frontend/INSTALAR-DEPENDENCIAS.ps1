# SCRIPT DE INSTALACION DE DEPENDENCIAS FALTANTES

Write-Host "INSTALANDO DEPENDENCIAS FALTANTES..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (!(Test-Path "package.json")) {
    Write-Host "ERROR: Ejecutar desde la carpeta frontend" -ForegroundColor Red
    exit 1
}

Write-Host "Instalando recharts para graficos..." -ForegroundColor Yellow
npm install recharts

Write-Host "Instalando lucide-react para iconos..." -ForegroundColor Yellow
npm install lucide-react

Write-Host "Verificando instalacion..." -ForegroundColor Blue
if (Test-Path "node_modules\recharts") {
    Write-Host "OK: recharts instalado" -ForegroundColor Green
} else {
    Write-Host "ERROR: recharts no instalado" -ForegroundColor Red
}

if (Test-Path "node_modules\lucide-react") {
    Write-Host "OK: lucide-react instalado" -ForegroundColor Green
} else {
    Write-Host "ERROR: lucide-react no instalado" -ForegroundColor Red
}

Write-Host ""
Write-Host "DEPENDENCIAS INSTALADAS!" -ForegroundColor Green
Write-Host "Ahora puedes ejecutar: npm run dev" -ForegroundColor Yellow

Read-Host "Presiona Enter para continuar"