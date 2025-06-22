# Restart Simple desde Backend
# ============================

Clear-Host
Write-Host "REINICIANDO SERVIDOR..." -ForegroundColor Cyan

# Detener procesos Node.js existentes
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "Procesos detenidos" -ForegroundColor Green
} catch {
    Write-Host "No habia procesos corriendo" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "===== INICIANDO CON ARCHIVOS ESTATICOS =====" -ForegroundColor Green
Write-Host ""
Write-Host "Portal Agencias: http://localhost:3002/agency-portal.html" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:3002/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Los estilos ahora deberian cargar correctamente!" -ForegroundColor Green
Write-Host ""

# Iniciar servidor
node server.js
