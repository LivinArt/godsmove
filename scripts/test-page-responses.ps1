$pages = @(
    @{ url = "http://localhost:3000/"; name = "Homepage" },
    @{ url = "http://localhost:3000/drops"; name = "Drops" },
    @{ url = "http://localhost:3000/exclusive-rack"; name = "Exclusive Rack" },
    @{ url = "http://localhost:3000/profile"; name = "Profile" },
    @{ url = "http://localhost:3000/admin/pre-bookings"; name = "Admin Pre-Bookings" },
    @{ url = "http://localhost:3000/admin/orders"; name = "Admin Orders" },
    @{ url = "http://localhost:3000/membership"; name = "Membership Page" }
)

foreach ($page in $pages) {
    $start = Get-Date
    try {
        $resp = Invoke-WebRequest -Uri $page.url -UseBasicParsing -TimeoutSec 15
        $elapsed = (Get-Date) - $start
        $status = $resp.StatusCode
        $bytes = $resp.Content.Length
        $secs = [math]::Round($elapsed.TotalSeconds, 2)
        Write-Host "$($page.name): HTTP $status | ${secs}s | ${bytes} bytes"
    } catch {
        $elapsed = (Get-Date) - $start
        $secs = [math]::Round($elapsed.TotalSeconds, 2)
        Write-Host "$($page.name): ERROR - $($_.Exception.Message) | ${secs}s"
    }
}
