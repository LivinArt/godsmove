$pages = @(
    @{ url = "http://localhost:3000/"; name = "Homepage"; patterns = @("GODSMOVE","hero","drops","countdown","pre-book","exclusive") },
    @{ url = "http://localhost:3000/drops"; name = "Drops"; patterns = @("product-card","price","discount","filter","search","hasMemberDiscount") },
    @{ url = "http://localhost:3000/exclusive-rack"; name = "Exclusive Rack"; patterns = @("product","price","exclusive","rack") },
    @{ url = "http://localhost:3000/profile?tab=prebookings"; name = "Profile Pre-Bookings"; patterns = @("pre-book","prebooking","PAID","countdown","RELEASED","AWAITING") },
    @{ url = "http://localhost:3000/membership"; name = "Membership"; patterns = @("membership","VIP","benefit","GODSMOVE") },
    @{ url = "http://localhost:3000/admin/pre-bookings"; name = "Admin Pre-Bookings"; patterns = @("pre-book","insight","KPI","orders","notify") }
)

Write-Host "=== GODSMOVE PAGE CONTENT AUDIT ==="
Write-Host ""

foreach ($page in $pages) {
    Write-Host "--- $($page.name) ($($page.url)) ---"
    try {
        $content = (Invoke-WebRequest -Uri $page.url -UseBasicParsing -TimeoutSec 15).Content
        $lower = $content.ToLower()
        
        foreach ($pattern in $page.patterns) {
            $count = ([regex]::Matches($lower, $pattern.ToLower())).Count
            if ($count -gt 0) {
                Write-Host "  FOUND: '$pattern' ($count occurrences)"
            } else {
                Write-Host "  MISSING: '$pattern'"
            }
        }
        Write-Host "  Total HTML size: $($content.Length) bytes"
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)"
    }
    Write-Host ""
}
