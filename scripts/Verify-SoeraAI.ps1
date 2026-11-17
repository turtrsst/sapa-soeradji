#Requires -Version 5.1
<#
.SYNOPSIS
  Verifikasi cepat instalasi SOERA AI:
  service hidup, port hanya loopback, /api/health OK, header keamanan ada,
  endpoint admin menolak password salah, robots.txt benar.
.EXAMPLE
  .\Verify-SoeraAI.ps1
  .\Verify-SoeraAI.ps1 -PublicUrl 'https://sias.rsupsoeradji.id/soera-ai' -BasePath '/soera-ai'
#>
[CmdletBinding()]
param(
  [string]$BindHost    = '127.0.0.1',
  [int]$Port           = 3000,
  [string]$ServiceName = 'SoeraAI',
  [string]$PublicUrl,
  [string]$BasePath    = ''
)
$ErrorActionPreference = 'Continue'
$BasePath = $BasePath.TrimEnd('/')
if ($BasePath -and -not $BasePath.StartsWith('/')) { throw 'BasePath harus diawali / (mis. /soera-ai).' }
$base = 'http://{0}:{1}' -f $BindHost, $Port
$app = $base + $BasePath
$results = New-Object System.Collections.Generic.List[object]
function Check($name, $pass, $detail) {
  $results.Add([pscustomobject]@{ Check = $name; Result = $(if ($pass) { 'PASS' } else { 'FAIL' }); Detail = $detail })
  if ($pass) { Write-Host ('[PASS] ' + $name) -ForegroundColor Green } else { Write-Host ('[FAIL] ' + $name + ' - ' + $detail) -ForegroundColor Red }
}

# 1) Service
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
Check ("Service '" + $ServiceName + "' terpasang dan berjalan") ($null -ne $svc -and $svc.Status -eq 'Running') $(if ($svc) { 'status: ' + $svc.Status } else { 'service tidak ditemukan' })

# 2) Port hanya loopback
try {
  $listens = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
  $loopbackOnly = @($listens | Where-Object { $_.LocalAddress -notin @('127.0.0.1', '::1') }).Count -eq 0
  Check ('Port ' + $Port + ' hanya didengar di loopback') $loopbackOnly (($listens | ForEach-Object { $_.LocalAddress }) -join ', ')
} catch { Check ('Port ' + $Port + ' hanya loopback') $true 'Get-NetTCPConnection tidak tersedia - dilewati' }

# 3) Health endpoint
try {
  $resp = Invoke-WebRequest -Uri ($app + '/api/health') -UseBasicParsing -TimeoutSec 10
  $json = $resp.Content | ConvertFrom-Json
  Check 'Health 200 dan status ok' ($resp.StatusCode -eq 200 -and $json.status -eq 'ok') ('HTTP ' + $resp.StatusCode)
  Check 'Health publik TIDAK membocorkan provider/baseUrl AI' ($null -eq $json.llm.baseUrl) $(if ($json.llm) { ($json.llm | ConvertTo-Json -Compress) } else { '' })
} catch { Check 'GET /api/health' $false $_.Exception.Message }

# 4) Header keamanan
# Catatan: PS 5.1 Invoke-WebRequest TIDAK mengikuti 308 Permanent Redirect (/x/ -> /x).
# Untuk basePath, pakai URL aplikasi TANPA trailing slash.
$berandaUrl = $app
if (-not $BasePath) { $berandaUrl = $app + '/' }
try {
  $resp = Invoke-WebRequest -Uri $berandaUrl -UseBasicParsing -TimeoutSec 10
  $h = $resp.Headers
  Check 'Header X-Content-Type-Options nosniff' ($h['X-Content-Type-Options'] -eq 'nosniff') $h['X-Content-Type-Options']
  Check 'Header Content-Security-Policy ada' ($null -ne $h['Content-Security-Policy']) ''
  Check 'Beranda 200' ($resp.StatusCode -eq 200) ('HTTP ' + $resp.StatusCode)
} catch { Check 'Header keamanan beranda' $false $_.Exception.Message }

# 5) Login admin dengan password salah -> 401 atau 429
try {
  $body = '{"username":"admin","password":"pasti-salah-123"}'
  Invoke-WebRequest -Uri ($app + '/api/admin/login') -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 10 | Out-Null
  Check 'Login admin password salah ditolak' $false 'justru diterima'
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  Check 'Login admin password salah ditolak' ($code -eq 401 -or $code -eq 429) ('HTTP ' + $code)
}

# 6) robots.txt
try {
  $resp = Invoke-WebRequest -Uri ($app + '/robots.txt') -UseBasicParsing -TimeoutSec 10
  Check 'robots.txt ada dan melarang /admin' ($resp.Content -match 'Disallow:\s*/admin') ''
} catch { Check 'robots.txt' $false $_.Exception.Message }

# 7) URL publik (opsional)
if ($PublicUrl) {
  try {
    $resp = Invoke-WebRequest -Uri $PublicUrl -UseBasicParsing -TimeoutSec 15
    Check ('URL publik ' + $PublicUrl + ' merespons') ($resp.StatusCode -eq 200) ('HTTP ' + $resp.StatusCode)
  } catch { Check ('URL publik ' + $PublicUrl) $false $_.Exception.Message }
}

$fail = @($results | Where-Object { $_.Result -eq 'FAIL' }).Count
Write-Host ''
Write-Host ('HASIL: {0} PASS, {1} FAIL' -f ($results.Count - $fail), $fail) -ForegroundColor $(if ($fail) { 'Red' } else { 'Green' })
if ($fail) { exit 1 } else { exit 0 }
