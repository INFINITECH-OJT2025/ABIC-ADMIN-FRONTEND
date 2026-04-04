# ABIC Accounting System - Complete Setup Script for Windows

$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host "`n======================================" -ForegroundColor Green
    Write-Host "$text" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
}

function Write-Step($text) {
    Write-Host "`n🚀 $text" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "✅ $text" -ForegroundColor Green
}

function Write-Warning($text) {
    Write-Host "⚠️ $text" -ForegroundColor Yellow
}

function Write-Error-Msg($text) {
    Write-Host "❌ $text" -ForegroundColor Red
}

Write-Header "ABIC Accounting System - Setup"

# --- 1. PRE-REQUISITES CHECK ---
Write-Step "Checking Pre-requisites..."

$dependencies = @(
    @{ Name = "PHP"; Command = "php -v" },
    @{ Name = "Composer"; Command = "composer -V" },
    @{ Name = "Node.js"; Command = "node -v" },
    @{ Name = "NPM"; Command = "npm -v" },
    @{ Name = "MySQL"; Command = "mysql --version" }
)

foreach ($dep in $dependencies) {
    try {
        Invoke-Expression $dep.Command | Out-Null
        Write-Success "$($dep.Name) is installed"
    } catch {
        Write-Error-Msg "$($dep.Name) is not installed. Please install it before proceeding."
        if ($dep.Name -eq "MySQL") { Write-Warning "MySQL CLI is optional but recommended for database setup." }
        else { exit 1 }
    }
}

# --- 2. ENVIRONMENT SETUP ---
Write-Step "Setting up Environment Files..."

# Root .env (Next.js)
if (-not (Test-Path ".env")) {
    Write-Warning "Root .env missing. Creating from existing .env if possible..."
    # Next.js doesn't usually have an .env.example but we can check if it exists
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Created root .env from .env.example"
    } else {
        # Create a basic .env if both are missing
        "DATABASE_URL=mysql://root:@localhost:3306/abic_accounting" | Out-File -FilePath ".env" -Encoding utf8
        Write-Success "Created basic root .env"
    }
} else {
    Write-Success "Root .env already exists"
}

# Backend .env (Laravel)
if (-not (Test-Path "backend/.env")) {
    if (Test-Path "backend/.env.example") {
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Success "Created backend/.env from .env.example"
    } else {
        Write-Error-Msg "backend/.env.example missing. Cannot create backend environment file."
    }
} else {
    Write-Success "Backend .env already exists"
}

# --- 3. FRONTEND SETUP ---
Write-Step "Setting up Frontend (Next.js)..."
if (Test-Path "node_modules") {
    Write-Success "Frontend dependencies already installed"
} else {
    Write-Host "Installing npm packages (this may take a while)..."
    npm install
    Write-Success "Frontend dependencies installed"
}

# --- 4. BACKEND SETUP ---
Write-Step "Setting up Backend (Laravel)..."
$originalDir = Get-Location
Set-Location "backend"

if (Test-Path "vendor") {
    Write-Success "Backend dependencies already installed"
} else {
    Write-Host "Installing composer packages..."
    composer install
    Write-Success "Backend dependencies installed"
}

# Generate APP_KEY if not set
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "APP_KEY=base64:") {
    Write-Host "Generating application key..." -ForegroundColor Yellow
    php artisan key:generate --force
} else {
    Write-Success "Backend APP_KEY already set"
}

Set-Location $originalDir

# --- 5. FINISH ---
Write-Header "Setup Complete!"

Write-Host "Next Steps to run the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create the Database:" -ForegroundColor White
Write-Host "   Open your MySQL tool and run:"
Write-Host "   CREATE DATABASE IF NOT EXISTS abic_accounting;" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Run Migrations (Backend):" -ForegroundColor White
Write-Host "   cd backend"
Write-Host "   php artisan migrate" -ForegroundColor Yellow
Write-Host "   cd .."
Write-Host ""
Write-Host "3. Start the Servers:" -ForegroundColor White
Write-Host "   Terminal A: cd backend && php artisan serve --host=0.0.0.0 --port=8000" -ForegroundColor Yellow
Write-Host "   Terminal B: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Access the Application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000 (or http://YOUR_LAN_IP:3000 for network access)"
Write-Host "   Backend:  http://localhost:8000 (or http://YOUR_LAN_IP:8000 for network access)" -ForegroundColor Green
Write-Host ""
Write-Host "   (Run 'ipconfig' in PowerShell to find YOUR_LAN_IP)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""
