#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Instalasi/otomatisasi SOERA AI di Windows Server + XAMPP (path: C:\xampp\htdocs\soera-ai).

.DESCRIPTION
  Fresh install : clone repo (atau pakai folder yang ada), npm ci, build, pasang
                  Windows Service via NSSM (start otomatis, auto-restart, log),
                  verifikasi /api/health.
  Update        : -Update  -> git pull, npm ci, npm run build, restart service, verifikasi.

  Contoh:
    # Install fresh (password admin dibuat acak & ditampilkan SEKALI di akhir)
    .\Install-SoeraAI.ps1 -PublicUrl "https://soera.rsupsoeradji.id"

    # Install fresh dengan password admin tertentu
    .\Install-SoeraAI.ps1 -PublicUrl "https://soera.rsupsoeradji.id" -AdminPassword (Read-Host -AsSecureString "Password admin")

    # Update aplikasi
    .\Install-SoeraAI.ps1 -Update

  CATATAN: skrip ini dibuat hati-hati namun BELUM diuji di semua varian Windows Server.
  Uji dulu di VM/PC staging. Lihat docs/PANDUAN-INSTALL-WINDOWS-SERVER.md.
#>
[CmdletBinding()]
param(
  [string]$InstallPath = 'C:\xampp\htdocs\soera-ai',
  [string]$RepoUrl     = 'https://github.com/turtrsst/sapa-soeradji.git',
  [string]$BindHost    = '127.0.0.1',
  [int]   $Port        = 3000,
  [string]$PublicUrl   = 'https://soera.rsupsoeradji.id',
  [string]$ServiceName = 'SoeraAI',
  [string]$AdminUser   = 'admin',
  [SecureString]$AdminPassword,
  [string]$BackupRoot  = 'D:\backup-soera-ai',
  [switch]$Update,
  [switch]$RegisterBackupTask   # pasang juga backup harian 02:00 via Task Scheduler
)

$ErrorActionPreference = 'Stop'
$logDir = Join-Path $InstallPath 'logs'
Start-Transcript -Path (Join-Path $env:TEMP ("soera-ai-install-{0}.log" -f (Get-Date -Format yyyyMMdd-HHmmss))) -Append | Out-Null
function Info($m) { Write-Host "[SOERA] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "[OK] $m"   -ForegroundColor Green }
function Warn($m) { Write-Host "[!!] $m"   -ForegroundColor Yellow }
function Die($m)  { Write-Host "[GAGAL] $m" -ForegroundColor Red; Stop-Transcript | Out-Null; exit 1 }

try {
  Info "=== SOERA AI — installer Windows Server (path: $InstallPath) ==="

  # 1) Prasyarat: Node.js & npm
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { Die "Node.js tidak ditemukan. Install Node.js 22 LTS dari https://nodejs.org lalu ulangi." }
  $nodeVer = (& node -v).TrimStart('v')
  $nodeMajor = [int]($nodeVer.Split('.')[0])
  if ($nodeMajor -lt 20) { Die "Node.js $nodeVer terlalu lama — dibutuhkan minimal Node 20 (disarankan 22 LTS)." }
  Info "Node.js $nodeVer terdeteksi di $($node.Source)"
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npm) { Die "npm tidak ditemukan." }

  # 2) Kode sumber
  if ($Update) {
    Info "Mode UPDATE — mendelegasikan ke scripts/Update-SoeraAI.ps1 (backup otomatis + rollback)"
    Stop-Transcript | Out-Null
    & (Join-Path $PSScriptRoot 'Update-SoeraAI.ps1') -InstallPath $InstallPath -ServiceName $ServiceName -BindHost $BindHost -Port $Port -BackupRoot $BackupRoot
    exit $LASTEXITCODE
  }

  if (Test-Path (Join-Path $InstallPath '.git')) {
    Info "Folder sudah berisi repo git — menarik perubahan terbaru (git pull)"
    Push-Location $InstallPath; & git pull --ff-only; Pop-Location
  } elseif (Test-Path $InstallPath) {
    Die "$InstallPath sudah ada tetapi bukan repo git. Pindahkan/backup folder itu dulu, atau hapus jika kosong."
  } else {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) { Die "git tidak ditemukan. Install Git for Windows (https://git-scm.com/download/win)." }
    Info "Clone $RepoUrl → $InstallPath"
    & git clone $RepoUrl $InstallPath; if ($LASTEXITCODE -ne 0) { Die "git clone gagal." }
  }

  Push-Location $InstallPath
  Info "npm ci (sekali, butuh internet)…"
  & npm ci --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { Die "npm ci gagal." }
  Info "npm run build…"
  & npm run build; if ($LASTEXITCODE -ne 0) { Die "npm run build gagal — lihat log di atas." }
  Pop-Location

  # 3) Kredensial admin & secret
  $plainPass = $null
  if ($AdminPassword) {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($AdminPassword)
    try { $plainPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  } else {
    # buat password acak 20 karakter (huruf+angka)
    $chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    $plainPass = -join (1..20 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    $generated = $true
  }
  $env:SOERA_TMP_PW = $plainPass
  Push-Location $InstallPath
  $hash = (& node -e "console.log(require('bcryptjs').hashSync(process.env.SOERA_TMP_PW, 12))").Trim()
  Pop-Location
  Remove-Item Env:SOERA_TMP_PW
  if (-not $hash) { Die "Gagal membuat hash bcrypt password admin." }

  $secretBytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
  $secret = ($secretBytes | ForEach-Object { $_.ToString('x2') }) -join ''

  # 4) NSSM (auto-download bila perlu)
  if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
    Info "NSSM belum ada — mengunduh nssm 2.24 (nssm.cc)…"
    $zip = Join-Path $env:TEMP 'nssm-2.24.zip'
    try { Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile $zip -UseBasicParsing } catch { Die "Unduh NSSM gagal. Unduh manual dari https://nssm.cc/download, salin win64\nssm.exe ke C:\Windows\System32, lalu ulangi." }
    Expand-Archive -Path $zip -DestinationPath (Join-Path $env:TEMP 'nssm') -Force
    Copy-Item (Join-Path $env:TEMP 'nssm\nssm-2.24\win64\nssm.exe') 'C:\Windows\System32\nssm.exe' -Force
    Ok "NSSM terpasang di C:\Windows\System32\nssm.exe"
  }

  # 5) Service SoeraAI (idempoten: reinstall bila sudah ada)
  Info "Memasang Windows Service '$ServiceName'…"
  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    & nssm stop $ServiceName | Out-Null
    & nssm remove $ServiceName confirm | Out-Null
  }
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $nodeExe = $node.Source
  & nssm install $ServiceName $nodeExe 'node_modules\next\dist\bin\next start -H 127.0.0.1 -p 3000' | Out-Null
  & nssm set $ServiceName AppDirectory $InstallPath | Out-Null
  & nssm set $ServiceName AppEnvironmentExtra "SOERA_ADMIN_SECRET=$secret" "SOERA_ADMIN_PASSWORD_HASH=$hash" "SAPA_DATA_DIR=$InstallPath\data" "SOERA_PUBLIC_URL=$PublicUrl" "NODE_ENV=production" | Out-Null
  & nssm set $ServiceName AppStdout "$logDir\stdout.log" | Out-Null
  & nssm set $ServiceName AppStderr "$logDir\stderr.log" | Out-Null
  & nssm set $ServiceName AppRotateFiles 1 | Out-Null
  & nssm set $ServiceName AppRotateBytes 10485760 | Out-Null
  & nssm set $ServiceName AppRestartDelay 5000 | Out-Null
  & nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null
  & nssm start $ServiceName | Out-Null
  Ok "Service '$ServiceName' terpasang & berjalan (auto-start, auto-restart 5 dtk)"

  # 6) Verifikasi kesehatan
  & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $Port -ServiceName $ServiceName -PublicUrl $PublicUrl
  $verifyExit = $LASTEXITCODE

  # 7) Backup terjadwal (opsional)
  if ($RegisterBackupTask) {
    Info "Mendaftarkan tugas backup harian 02:00 → $BackupRoot"
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -File `"$InstallPath\scripts\Backup-SoeraAI.ps1`" -SourcePath `"$InstallPath\data`" -BackupRoot `"$BackupRoot`""
    $trigger = New-ScheduledTaskTrigger -Daily -At '02:00'
    Register-ScheduledTask -TaskName 'SoeraAI Backup SQLite' -Action $action -Trigger $trigger -RunLevel Highest -Force | Out-Null
    Ok "Tugas backup 'SoeraAI Backup SQLite' terdaftar (harian 02:00)"
  }

  Write-Host ""
  Write-Host "================ RINGKASAN INSTALASI ================" -ForegroundColor Magenta
  Write-Host "Path      : $InstallPath"
  Write-Host "Service   : $ServiceName (nssm) — start otomatis saat boot"
  Write-Host "Bind      : http://${BindHost}:$Port (loopback; publik via proxy/Tunnel)"
  Write-Host "Health    : http://${BindHost}:$Port/api/health"
  Write-Host "Admin     : http://$PublicUrl/admin  (user: $AdminUser)"
  if ($generated) {
    Write-Host ""
    Write-Host ">>> PASSWORD ADMIN (ditampilkan SEKALI — simpan sekarang): $plainPass" -ForegroundColor Yellow
    Write-Host ">>> Password tersimpan sebagai hash bcrypt di environment service; tidak ada salinan plain-text di disk." -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "Langkah berikutnya: (1) HTTPS & domain — docs/PANDUAN-INSTALL-WINDOWS-SERVER.md langkah 7 (Cloudflare Tunnel atau win-acme); (2) kunci folder htdocs (Require all denied); (3) checklist go-live."
  Stop-Transcript | Out-Null
  exit $verifyExit
} catch {
  Die "Error tak terduga: $($_.Exception.Message)"
}
