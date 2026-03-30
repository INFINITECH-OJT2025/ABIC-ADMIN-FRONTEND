# scripts/dev-ip.ps1

function Get-LocalIP {
    # Try Wi-Fi first, then Ethernet, then any other IPv4
    $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet*' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
    }
    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '127.0.0.1' } | Select-Object -First 1).IPAddress
    }
    return $ip
}

$currentIP = Get-LocalIP

if ($currentIP) {
    Write-Host "`nDetected Local IP: $currentIP" -ForegroundColor Cyan
    Write-Host '--------------------------------------' -ForegroundColor Gray

    # Update .env with key-specific replacements.
    # Keep BACKEND_URL loopback for server-side calls,
    # and update client-facing URLs for LAN testing.
    if (Test-Path '.env') {
        $envFile = Get-Content '.env' -Raw
        $updatedEnv = $envFile

        if ($updatedEnv -match '(?m)^BACKEND_URL=') {
            $updatedEnv = [regex]::Replace($updatedEnv, '(?m)^BACKEND_URL=.*$', 'BACKEND_URL=http://127.0.0.1:8000')
        } else {
            $updatedEnv = "BACKEND_URL=http://127.0.0.1:8000`r`n$updatedEnv"
        }

        if ($updatedEnv -match '(?m)^NEXT_PUBLIC_API_URL=') {
            $updatedEnv = [regex]::Replace($updatedEnv, '(?m)^NEXT_PUBLIC_API_URL=.*$', "NEXT_PUBLIC_API_URL=http://$currentIP:8000")
        } else {
            $updatedEnv = "$updatedEnv`r`nNEXT_PUBLIC_API_URL=http://$currentIP:8000"
        }

        if ($updatedEnv -match '(?m)^LARAVEL_API_URL=') {
            $updatedEnv = [regex]::Replace($updatedEnv, '(?m)^LARAVEL_API_URL=.*$', "LARAVEL_API_URL=http://$currentIP:8000/api")
        }

        if ($envFile -ne $updatedEnv) {
            $updatedEnv | Out-File -FilePath '.env' -Encoding utf8 -NoNewline
            Write-Host "Updated .env safely for local backend + LAN client access: $currentIP" -ForegroundColor Green
        }
    }

    # Run Next.js dev server on 0.0.0.0 so localhost and LAN IP both work
    Write-Host 'Starting Next.js...' -ForegroundColor Gray

    npx next dev --hostname 0.0.0.0 --port 3000 | ForEach-Object {
        $_ -replace '0.0.0.0', $currentIP
    }
} else {
    Write-Error 'Could not detect a local IP address. Please check your network connection.'
    exit 1
}