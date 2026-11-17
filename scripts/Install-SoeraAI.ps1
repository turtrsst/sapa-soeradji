#Requires -RunAsAdministrator
#Requires -Version 5.1
<#
.SYNOPSIS
  Instalasi otomatis SOERA AI di Windows Server + XAMPP (path: C:\xampp\htdocs\soera-ai).

.DESCRIPTION
  Fresh install : clone repo (atau pakai folder yang ada), npm ci, build, pasang
                  Windows Service via NSSM (start otomatis, auto-restart, log),
                  verifikasi /api/health.
  Update        : -Update  -> memanggil scripts\Update-SoeraAI.ps1
                  (backup dulu, git pull origin/main, build, restart, rollback otomatis).

  Contoh:
    .\Install-SoeraAI.ps1 -PublicUrl "https://sias.rsupsoeradji.id/soera-ai" -BasePath '/soera-ai'
    .\Install-SoeraAI.ps1 -PublicUrl "https://sias.rsupsoeradji.id" -AdminPassword (Read-Host -AsSecureString "Password admin")
    .\Install-SoeraAI.ps1 -Update

  CATATAN: belum diuji di semua varian Windows Server - uji di PC/VM staging dulu.
  Lihat docs/PANDUAN-INSTALL-WINDOWS-SERVER.md.
#>
[CmdletBinding()]
param(
  [string]$InstallPath = 'C:\xampp\htdocs\soera-ai',
  [string]$RepoUrl     = 'https://github.com/turtrsst/sapa-soeradji.git',
  [string]$BindHost    = '127.0.0.1',
  [int]$Port           = 3000,
  [string]$PublicUrl   = 'https://sias.rsupsoeradji.id/soera-ai',
  [string]$BasePath    = '',
  [string]$ServiceName = 'SoeraAI',
  [string]$AdminUser   = 'admin',
  [SecureString]$AdminPassword,
  [string]$BackupRoot  = 'D:\backup-soera-ai',
  [switch]$Update,
  [switch]$RegisterBackupTask
)

$ErrorActionPreference = 'Stop'
$logDir = Join-Path $InstallPath 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$transcript = Join-Path $env:TEMP ('soera-ai-install-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
Start-Transcript -Path $transcript -Append | Out-Null
function Info($m) { Write-Host ('[SOERA] ' + $m) -ForegroundColor Cyan }
function Ok($m)   { Write-Host ('[OK] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[!!] ' + $m) -ForegroundColor Yellow }
function Die($m)  {
  Write-Host ('[GAGAL] ' + $m) -ForegroundColor Red
  if ($script:svcStopped) {
    Warn 'Mencoba men-start ulang service SoeraAI (build gagal, kembali ke versi sebelumnya)...'
    try { & nssm start $ServiceName | Out-Null } catch { Warn ('Start ulang gagal: ' + $_.Exception.Message) }
  }
  try { Stop-Transcript | Out-Null } catch {}
  exit 1
}
$BasePath = $BasePath.TrimEnd('/')
if ($BasePath -and -not $BasePath.StartsWith('/')) { Die 'BasePath harus diawali / (mis. /soera-ai).' }
if ($BasePath) { Info ('Mode sub-path: aplikasi disajikan di ' + $BasePath + ' (SOERA_BASE_PATH=' + $BasePath + ')') }

try {
  Info ('=== SOERA AI - installer Windows Server (path: ' + $InstallPath + ') ===')

  # 1) Prasyarat: Node.js dan npm
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { Die 'Node.js tidak ditemukan. Install Node.js 22 LTS dari https://nodejs.org lalu ulangi.' }
  $nodeVer = (& node -v).TrimStart('v')
  $nodeMajor = [int]($nodeVer.Split('.')[0])
  if ($nodeMajor -lt 20) { Die ('Node.js ' + $nodeVer + ' terlalu lama - dibutuhkan minimal Node 20 (disarankan 22 LTS).') }
  Info ('Node.js ' + $nodeVer + ' terdeteksi di ' + $node.Source)
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npm) { Die 'npm tidak ditemukan.' }

  # 2) Mode update -> delegasi ke skrip update (lebih aman)
  if ($Update) {
    Info 'Mode UPDATE - mendelegasikan ke scripts\Update-SoeraAI.ps1'
    Stop-Transcript | Out-Null
    & (Join-Path $PSScriptRoot 'Update-SoeraAI.ps1') -InstallPath $InstallPath -ServiceName $ServiceName -BindHost $BindHost -Port $Port -BackupRoot $BackupRoot
    exit $LASTEXITCODE
  }

  # 3) Kode sumber
  if (Test-Path (Join-Path $InstallPath '.git')) {
    Info 'Folder sudah berisi repo git - menarik perubahan terbaru (git pull)'
    Push-Location $InstallPath; & git pull --ff-only; Pop-Location
  } elseif (Test-Path $InstallPath) {
    $isEmpty = @(Get-ChildItem -Force $InstallPath).Count -eq 0
    if ($isEmpty) {
      $git = Get-Command git -ErrorAction SilentlyContinue
      if (-not $git) { Die 'git tidak ditemukan. Install Git for Windows (https://git-scm.com/download/win).' }
      Info ('Clone ' + $RepoUrl + ' ke ' + $InstallPath)
      & git clone $RepoUrl $InstallPath; if ($LASTEXITCODE -ne 0) { Die 'git clone gagal.' }
    } else {
      Die ($InstallPath + ' sudah terisi tetapi bukan repo git. Backup dulu (robocopy), atau kosongkan folder itu, lalu ulangi.')
    }
  } else {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) { Die 'git tidak ditemukan. Install Git for Windows (https://git-scm.com/download/win).' }
    Info ('Clone ' + $RepoUrl + ' ke ' + $InstallPath)
    & git clone $RepoUrl $InstallPath; if ($LASTEXITCODE -ne 0) { Die 'git clone gagal.' }
  }

  # Service sedang berjalan me-load DLL (sharp) -> npm ci tidak bisa unlink (EPERM).
  # Hentikan dulu; dipasang ulang/start lagi di akhir (atau oleh Die bila gagal).
  $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -ne 'Stopped') {
    Info 'Menghentikan service SoeraAI sementara (build membutuhkan akses penuh ke node_modules)...'
    & nssm stop $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    $script:svcStopped = $true
  }
  Push-Location $InstallPath
  if ($BasePath) { $env:SOERA_BASE_PATH = $BasePath } else { Remove-Item Env:SOERA_BASE_PATH -ErrorAction SilentlyContinue }
  Info 'npm ci (sekali, butuh internet)...'
  & npm ci --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { Die 'npm ci gagal.' }
  Info 'npm run build...'
  & npm run build; if ($LASTEXITCODE -ne 0) { Die 'npm run build gagal - lihat log di atas.' }
  Pop-Location

  # 4) Kredensial admin dan secret
  $generated = $false
  $plainPass = $null
  if ($AdminPassword) {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($AdminPassword)
    try { $plainPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  } else {
    $chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    $plainPass = -join (1..20 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    $generated = $true
  }
  $env:SOERA_TMP_PW = $plainPass
  # Tulis JS sementara DI DALAM folder proyek agar require('bcryptjs') menemukan node_modules
  $tmpJs = Join-Path $InstallPath '.soera-hash.tmp.js'
  [IO.File]::WriteAllText($tmpJs, 'console.log(require("bcryptjs").hashSync(process.env.SOERA_TMP_PW, 12));', [Text.Encoding]::ASCII)
  try {
    $hashRaw = & node $tmpJs
  } finally {
    Remove-Item $tmpJs -Force -ErrorAction SilentlyContinue
    Remove-Item Env:SOERA_TMP_PW -ErrorAction SilentlyContinue
  }
  if (-not $hashRaw) { Die 'Gagal membuat hash bcrypt password admin (node tidak menghasilkan output). Jalankan "npm ci" dulu.' }
  $hash = $hashRaw.Trim()
  if (-not $hash) { Die 'Gagal membuat hash bcrypt password admin.' }

  $secretBytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
  $secret = ($secretBytes | ForEach-Object { $_.ToString('x2') }) -join ''

  # 5) NSSM (auto-download bila perlu)
  if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
    Info 'NSSM belum ada - mengunduh nssm 2.24 (nssm.cc)...'
    # PS 5.1 default: TLS 1.0 - nssm.cc hanya menerima TLS 1.2+
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
    $zip = Join-Path $env:TEMP 'nssm-2.24.zip'
    try {
      Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile $zip -UseBasicParsing -TimeoutSec 60
    } catch {
      Die 'Unduh NSSM gagal. Unduh manual dari https://nssm.cc/download, salin win64\nssm.exe ke C:\Windows\System32, lalu ulangi.'
    }
    Expand-Archive -Path $zip -DestinationPath (Join-Path $env:TEMP 'nssm') -Force
    Copy-Item (Join-Path $env:TEMP 'nssm\nssm-2.24\win64\nssm.exe') 'C:\Windows\System32\nssm.exe' -Force
    Ok 'NSSM terpasang di C:\Windows\System32\nssm.exe'
  }

  # 6) Port bebas? (server RS menjalankan aplikasi lain)
  $chosenPort = $Port
  $inUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($inUse) {
    Warn ('Port ' + $Port + ' sedang dipakai proses lain - mencari port bebas di 3100-3120...')
    foreach ($c in 3100..3120) {
      if (-not (Get-NetTCPConnection -LocalPort $c -State Listen -ErrorAction SilentlyContinue)) { $chosenPort = $c; break }
    }
    Warn ('Port ' + $Port + ' dipakai aplikasi lain - SOERA AI akan memakai port ' + $chosenPort)
  }

  # 7) Service SoeraAI (idempoten: reinstall bila sudah ada)
  Info ('Memasang Windows Service ' + $ServiceName + '...')
  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    & nssm stop $ServiceName | Out-Null
    & nssm remove $ServiceName confirm | Out-Null
  }
  $nodeExe = $node.Source
  & nssm install $ServiceName $nodeExe ('node_modules\next\dist\bin\next start -H 127.0.0.1 -p ' + $chosenPort) | Out-Null
  & nssm set $ServiceName AppDirectory $InstallPath | Out-Null
  $svcEnv = @(('SOERA_ADMIN_SECRET=' + $secret), ('SOERA_ADMIN_PASSWORD_HASH=' + $hash), ('SAPA_DATA_DIR=' + $InstallPath + '\data'), ('SOERA_PUBLIC_URL=' + $PublicUrl), 'NODE_ENV=production')
  if ($BasePath) { $svcEnv += ('SOERA_BASE_PATH=' + $BasePath) }
  & nssm set $ServiceName AppEnvironmentExtra $svcEnv | Out-Null
  & nssm set $ServiceName AppStdout ($logDir + '\stdout.log') | Out-Null
  & nssm set $ServiceName AppStderr ($logDir + '\stderr.log') | Out-Null
  & nssm set $ServiceName AppRotateFiles 1 | Out-Null
  & nssm set $ServiceName AppRotateBytes 10485760 | Out-Null
  & nssm set $ServiceName AppRestartDelay 5000 | Out-Null
  & nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null
  & nssm start $ServiceName | Out-Null
  Start-Sleep -Seconds 4
  $svcStatus = (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue).Status
  if ($svcStatus -ne 'Running') {
    Warn ('Service status: ' + $svcStatus + ' - 20 baris terakhir logs\stderr.log:')
    Get-Content ($logDir + '\stderr.log') -Tail 20 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ('    ' + $_) }
    Die 'Aplikasi gagal start - lihat log di atas.'
  }
  Ok ('Service ' + $ServiceName + ' berjalan di port ' + $chosenPort + ' (auto-start, auto-restart 5 detik)')

  # 7) Verifikasi kesehatan
  & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $chosenPort -ServiceName $ServiceName -PublicUrl $PublicUrl -BasePath $BasePath
  $verifyExit = $LASTEXITCODE

  # 8) Backup terjadwal (opsional)
  if ($RegisterBackupTask) {
    Info ('Mendaftarkan tugas backup harian 02:00 ke ' + $BackupRoot)
    $arg = '-ExecutionPolicy Bypass -File "' + $InstallPath + '\scripts\Backup-SoeraAI.ps1" -SourcePath "' + $InstallPath + '\data" -BackupRoot "' + $BackupRoot + '"'
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arg
    $trigger = New-ScheduledTaskTrigger -Daily -At '02:00'
    Register-ScheduledTask -TaskName 'SoeraAI Backup SQLite' -Action $action -Trigger $trigger -RunLevel Highest -Force | Out-Null
    Ok 'Tugas backup SoeraAI Backup SQLite terdaftar (harian 02:00)'
  }

  Write-Host ''
  Write-Host '================ RINGKASAN INSTALASI ================' -ForegroundColor Magenta
  Write-Host ('Path      : ' + $InstallPath)
  Write-Host ('Service   : ' + $ServiceName + ' (nssm) - start otomatis saat boot')
  Write-Host ('Bind      : http://{0}:{1} (loopback; publik via proxy/Tunnel)' -f $BindHost, $chosenPort)
  Write-Host ('Base path : {0}' -f $(if ($BasePath) { $BasePath } else { '/ (root)' }))
  Write-Host ('Health    : http://{0}:{1}{2}/api/health' -f $BindHost, $chosenPort, $BasePath)
  Write-Host ('Admin     : {0}/admin  (user: {1})' -f $PublicUrl, $AdminUser)
  if ($generated) {
    Write-Host ''
    Write-Host ('>>> PASSWORD ADMIN (ditampilkan SEKALI - simpan sekarang): ' + $plainPass) -ForegroundColor Yellow
    Write-Host '>>> Password tersimpan sebagai hash bcrypt di environment service; tidak ada salinan plain-text di disk.' -ForegroundColor Yellow
  }
  Write-Host ''
  Write-Host 'Langkah berikutnya: (1) HTTPS dan domain - docs/PANDUAN-INSTALL-WINDOWS-SERVER.md langkah 7 (Cloudflare Tunnel atau win-acme); (2) kunci folder htdocs (Require all denied); (3) checklist go-live.'
  Stop-Transcript | Out-Null
  exit $verifyExit
} catch {
  Die ('Error tak terduga: ' + $_.Exception.Message)
}
