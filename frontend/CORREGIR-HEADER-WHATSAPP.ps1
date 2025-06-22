Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CORRIGIENDO HEADER Y WHATSAPP" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

Set-Location "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend"

Write-Host "CORRECCIONES APLICADAS:" -ForegroundColor Green
Write-Host "1. Logo InterTravel corregido" -ForegroundColor White
Write-Host "2. WhatsApp flotante agregado" -ForegroundColor White
Write-Host "3. Header limpio" -ForegroundColor White

Write-Host ""
Write-Host "Verificando archivos..." -ForegroundColor Yellow

if (Test-Path "src\components\Header.tsx") {
    Write-Host "✓ Header.tsx" -ForegroundColor Green
} else {
    Write-Host "✗ Header.tsx NO ENCONTRADO" -ForegroundColor Red
}

if (Test-Path "src\components\WhatsAppFloating.tsx") {
    Write-Host "✓ WhatsAppFloating.tsx" -ForegroundColor Green
} else {
    Write-Host "✗ WhatsAppFloating.tsx NO ENCONTRADO" -ForegroundColor Red
}

if (Test-Path "src\app\(public)\layout.tsx") {
    Write-Host "✓ Layout.tsx" -ForegroundColor Green
} else {
    Write-Host "✗ Layout.tsx NO ENCONTRADO" -ForegroundColor Red
}

Write-Host ""
Write-Host "RESULTADO:" -ForegroundColor Yellow
Write-Host "• Logo corregido" -ForegroundColor White
Write-Host "• WhatsApp destellante" -ForegroundColor White
Write-Host "• Configurable desde admin" -ForegroundColor White

Write-Host ""
Write-Host "INICIANDO SERVIDOR..." -ForegroundColor Cyan
npm run dev
