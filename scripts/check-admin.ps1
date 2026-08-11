$resp = Invoke-WebRequest -Uri 'http://localhost:3000/admin/pre-bookings' -UseBasicParsing -TimeoutSec 15
Write-Host "Status: $($resp.StatusCode)"
Write-Host "Content-Length: $($resp.Content.Length)"
Write-Host "First 800 chars:"
Write-Host $resp.Content.Substring(0, [Math]::Min(800, $resp.Content.Length))
