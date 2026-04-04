# scripts/dev-ip.ps1

function Get-LocalIP {
    # Try Wi-Fi first, then Ethernet, then any other IPv4
    $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet*' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
    }
    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "127.0.0.1" } | Select-Object -First 1).IPAddress
    }
    return $ip
}

$currentIP = Get-LocalIP

if ($currentIP) {
    Write-Host "`n🚀 Detected Local IP: $currentIP" -ForegroundColor Cyan
    Write-Host "--------------------------------------" -ForegroundColor Gray
    
    # Update .env if it exists and has an old IP
    if (Test-Path ".env") {
        $envFile = Get-Content ".env" -Raw
        # Look for existing IP-like strings in LARAVEL_API_URL or NEXT_PUBLIC_API_URL
        $oldIPRegex = "\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"
        if ($envFile -match $oldIPRegex) {
            $updatedEnv = $envFile -replace $oldIPRegex, $currentIP
            if ($envFile -ne $updatedEnv) {
                $updatedEnv | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
                Write-Host "✅ Updated .env with current IP: $currentIP" -ForegroundColor Green
            }
        }
    }

    # Run Next.js dev server on 0.0.0.0 so localhost AND dynamic IP both work
    # We use a small trick to replace the 0.0.0.0 display in the console with the real IP
    Write-Host "Starting Next.js..." -ForegroundColor Gray
    
    # We run next dev on 0.0.0.0 (all interfaces)
    # This ensures both http://localhost:3000 and http://192.168.x.x:3000 work
    npx next dev --hostname 0.0.0.0 --port 3000 | ForEach-Object { 
        $_ -replace "0.0.0.0", $currentIP 
    }
} else {
    Write-Error "Could not detect a local IP address. Please check your network connection."
    exit 1
}
