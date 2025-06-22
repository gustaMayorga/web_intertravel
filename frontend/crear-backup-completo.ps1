# BACKUP COMPLETO - INTERTRAVEL WEB
# Creado: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Estado: Sistema con problemas de superposición de mapas

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  CREANDO BACKUP COMPLETO INTERTRAVEL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "D:\Inter\intertravel-website\BACKUP-ANTES-REGENERACION-$timestamp"

Write-Host "Creando directorio de backup: $backupDir" -ForegroundColor Yellow

# Crear directorio de backup
New-Item -ItemType Directory -Path $backupDir -Force

# Copiar todo el proyecto WEB-FINAL-UNIFICADA
Write-Host "Copiando proyecto completo..." -ForegroundColor Yellow
Copy-Item -Path "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA" -Destination "$backupDir\WEB-FINAL-UNIFICADA" -Recurse -Force

# Crear archivo de estado
$estadoActual = @"
# ESTADO DEL SISTEMA ANTES DE REGENERACIÓN
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## PROBLEMAS IDENTIFICADOS:
- Superposición de mapas/componentes
- Mapa 3D no funciona correctamente
- Buscadores duplicados
- Layout desorganizado

## ESTRUCTURA ACTUAL:
- Frontend: Next.js 14 (puerto 3005)
- Backend: Express.js (puerto 3002)
- Componentes: Shadcn UI + Tailwind

## OBJETIVO DE REGENERACIÓN:
1. Mapa/visualización de destinos funcional
2. Buscador inteligente organizado
3. Layout limpio sin superposiciones
4. Experiencia mobile optimizada

## ARCHIVOS CLAVE A REGENERAR:
- /src/app/(public)/page.tsx (página principal)
- /src/components/globe/* (componentes de mapa)
- /src/components/destinations/* (visualización destinos)
- /src/components/search/* (buscadores)
"@

$estadoActual | Out-File -FilePath "$backupDir\ESTADO-SISTEMA.md" -Encoding UTF8

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ BACKUP COMPLETADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Backup guardado en: $backupDir" -ForegroundColor White
Write-Host "📋 Estado documentado en: ESTADO-SISTEMA.md" -ForegroundColor White
Write-Host ""
Write-Host "SIGUIENTE PASO: Regeneración completa del sistema" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para continuar con la regeneración"
