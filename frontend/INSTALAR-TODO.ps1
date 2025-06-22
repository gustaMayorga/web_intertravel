# SCRIPT COMPLETO - INSTALAR TODAS LAS DEPENDENCIAS UI

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALANDO TODAS LAS DEPENDENCIAS UI" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (!(Test-Path "package.json")) {
    Write-Host "ERROR: Ejecutar desde la carpeta frontend" -ForegroundColor Red
    exit 1
}

Write-Host "Instalando dependencias de UI..." -ForegroundColor Blue

# Radix UI dependencies (para los componentes ui)
Write-Host "1. Instalando Radix UI..." -ForegroundColor Yellow
npm install @radix-ui/react-slot
npm install @radix-ui/react-tabs
npm install @radix-ui/react-alert-dialog
npm install @radix-ui/react-label

# Class variance authority (para estilos)
Write-Host "2. Instalando class-variance-authority..." -ForegroundColor Yellow
npm install class-variance-authority

# clsx y tailwind-merge (para utils)
Write-Host "3. Instalando clsx y tailwind-merge..." -ForegroundColor Yellow
npm install clsx tailwind-merge

# Recharts para graficos
Write-Host "4. Instalando recharts..." -ForegroundColor Yellow
npm install recharts

# Lucide React para iconos
Write-Host "5. Instalando lucide-react..." -ForegroundColor Yellow
npm install lucide-react

Write-Host ""
Write-Host "Verificando instalaciones..." -ForegroundColor Blue

$dependencies = @(
    "@radix-ui/react-slot",
    "@radix-ui/react-tabs", 
    "@radix-ui/react-label",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    "recharts",
    "lucide-react"
)

$allInstalled = $true
foreach ($dep in $dependencies) {
    $path = "node_modules\$($dep.Replace('/', '\'))"
    if (Test-Path $path) {
        Write-Host "   OK: $dep" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: $dep" -ForegroundColor Red
        $allInstalled = $false
    }
}

if ($allInstalled) {
    Write-Host ""
    Write-Host "TODAS LAS DEPENDENCIAS INSTALADAS!" -ForegroundColor Green
    Write-Host "Ahora ejecuta: npm run dev" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "ALGUNAS DEPENDENCIAS FALLARON" -ForegroundColor Red
    Write-Host "Intenta instalar manualmente las faltantes" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Presiona Enter para continuar"