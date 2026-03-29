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
    @{ Name = "Node.js"; Command = "node -v" },
    @{ Name = "NPM"; Command = "npm -v" }
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


# --- 3. FRONTEND SETUP ---
Write-Step "Setting up Frontend (Next.js)..."
if (Test-Path "node_modules") {
    Write-Success "Frontend dependencies already installed"
} else {
    Write-Host "Installing npm packages (this may take a while)..."
    npm install
    Write-Success "Frontend dependencies installed"
}


# --- 5. FINISH ---
Write-Header "Setup Complete!"

Write-Host "Next Steps to run the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the Server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Access the Application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000 (or http://YOUR_LAN_IP:3000 for network access)"
Write-Host ""
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""
