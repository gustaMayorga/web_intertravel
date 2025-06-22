Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   INSTALANDO THREE.JS PARA INTERTRAVEL" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Instalando Three.js y dependencias..." -ForegroundColor Yellow
npm install three@^0.169.0 @types/three@^0.169.0

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Three.js instalado correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Reinicia el servidor de desarrollo:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "El globo 3D estara disponible despues del reinicio" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Error en la instalacion. Intenta manualmente:" -ForegroundColor Red
    Write-Host "   npm install three @types/three" -ForegroundColor White
}

Write-Host ""
Read-Host "Presiona Enter para continuar"