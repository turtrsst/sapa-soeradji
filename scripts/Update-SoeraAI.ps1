#Requires -RunAsAdministrator
#Requires -Version 5.1
<#
.SYNOPSIS
  Update SOERA AI di server Windows.
  Urutan: cek tree bersih -> BACKUP SQLite -> git fetch + merge --ff-only origin/main
  -> npm ci -> npm run build -> nssm restart -> Verify-SoeraAI.ps1.
  Bila build/verifikasi GAGAL: ROLLBACK OTOMATIS ke commit sebelumnya.

.EXAMPLE
  .\Update-SoeraAI.ps1                      # update dari origin/main
  .\Update-SoeraAI.ps1 -SkipBackup          # lewati backup (tidak disarankan)
#>
[CmdletBinding()]
param(
  [string]$InstallPath = 'C:\xampp\htdocs\soera-ai',
  [string]$ServiceName = 'SoeraAI',
  [string]$BindHost    = '127.0.0.1',
  [int]$Port           = 0,  # 0 = auto-detect dari service (NSSM AppParameters -p)
  [string]$Branch      = 'main',
  [string]$BackupRoot  = 'D:\backup-soera-ai',
  [switch]$SkipBackup,
  [string]$BasePath    = ''
)
$ErrorActionPreference = 'Stop'
function Info($m) { Write-Host ('[UPDATE] ' + $m) -ForegroundColor Cyan }
function Ok($m)   { Write-Host ('[OK] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[!!] ' + $m) -ForegroundColor Yellow }

$oldCommit = $null
# Hentikan service SEJAK AWAL (DLL sharp terkunci saat service jalan).
$svcEarly = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svcEarly -and $svcEarly.Status -ne 'Stopped') {
  Info 'Menghentikan service SoeraAI sementara (backup + build butuh akses penuh)...'
  & nssm stop $ServiceName | Out-Null
  Start-Sleep -Seconds 2
}
# BasePath: bila tidak diberikan, baca dari environment service yang sedang berjalan
# (build HARUS memakai nilai yang sama dengan saat install).
$BasePath = $BasePath.TrimEnd('/')
if (-not $BasePath) {
  try {
    $svcEnv = (& nssm get $ServiceName AppEnvironmentExtra) -join ' '
    $m = [regex]::Match($svcEnv, 'SOERA_BASE_PATH=([^\s"]+)')
    if ($m.Success) { $BasePath = $m.Groups[1].Value.TrimEnd('/'); Info ('BasePath terdeteksi dari service env: ' + $BasePath) }
  } catch { Warn 'Tidak bisa membaca env service - build mode root.' }
}
if ($BasePath) { $env:SOERA_BASE_PATH = $BasePath; Info ('Build dengan SOERA_BASE_PATH=' + $BasePath) }
if (-not $PSBoundParameters.ContainsKey('Port')) {
  try {
    $svcParams = (& nssm get $ServiceName AppParameters) -join ' '
    $pm = [regex]::Match($svcParams, '-p\s*(\d+)')
    if (-not $pm.Success) {
      try {
        $reg = Get-ItemProperty -Path ('HKLM:\SYSTEM\CurrentControlSet\Services\' + $ServiceName + '\Parameters') -ErrorAction Stop
        if ($reg.AppParameters) { $svcParams = ($svcParams + ' ' + $reg.AppParameters); $pm = [regex]::Match($svcParams, '-p\s*(\d+)') }
      } catch {}
    }
    if ($pm.Success) { $Port = [int]$pm.Groups[1].Value; Info ('Port terdeteksi dari service: ' + $Port) }
  } catch {}
  if ($Port -le 0) { $Port = 3100; Warn 'Tidak bisa deteksi port service - pakai 3100.' }
}
try {
  if (-not (Test-Path (Join-Path $InstallPath '.git'))) { throw ($InstallPath + ' bukan repo git. Jalankan Install-SoeraAI.ps1 dulu.') }
  Push-Location $InstallPath

  # 1) Pastikan tidak ada perubahan lokal yang belum di-commit
  $dirty = & git status --porcelain --untracked-files=no
  if ($dirty) { throw ('Ada perubahan lokal yang belum di-commit di server:' + [Environment]::NewLine + ($dirty -join [Environment]::NewLine) + [Environment]::NewLine + 'Selesaikan/stash dulu.') }

  $oldCommit = (& git rev-parse HEAD).Trim()
  Info ('Commit saat ini: ' + $oldCommit)

  # 2) Backup database SEBELUM update
  if (-not $SkipBackup) {
    Info 'Backup SQLite sebelum update...'
    & (Join-Path $PSScriptRoot 'Backup-SoeraAI.ps1') -SourcePath (Join-Path $InstallPath 'data') -BackupRoot $BackupRoot
    if ($LASTEXITCODE -ne 0) { throw ('Backup gagal ke ' + $BackupRoot + ' - update dibatalkan. Periksa akses/disk folder itu (atau pakai -BackupRoot ke folder lain, mis. C:\soera-ai-backup), atau -SkipBackup bila yakin.') }
  } else { Warn 'Backup dilewati (-SkipBackup).' }

  # 3) Ambil versi terbaru (fast-forward saja)
  Info ('git fetch origin ' + $Branch)
  & git fetch origin $Branch; if ($LASTEXITCODE -ne 0) { throw 'git fetch gagal.' }
  & git merge --ff-only ('origin/' + $Branch); if ($LASTEXITCODE -ne 0) { throw 'Branch lokal dan origin/' + $Branch + ' tidak fast-forwardable - selesaikan divergensi manual.' }
  $newCommit = (& git rev-parse HEAD).Trim()
  if ($newCommit -eq $oldCommit) {
    if ($svcEarly -and $svcEarly.Status -ne 'Stopped') {
      Warn 'Sudah versi terbaru, tetapi service dihentikan lebih-dulu oleh updater - membangun ulang + men-start service...'
      & npm ci --no-audit --no-fund
      if ($LASTEXITCODE -ne 0) { throw 'npm ci gagal.' }
      & npm run build
      if ($LASTEXITCODE -ne 0) { throw 'npm run build gagal.' }
      & nssm start $ServiceName | Out-Null
      Start-Sleep -Seconds 5
      & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $Port -ServiceName $ServiceName -BasePath $BasePath
      if ($LASTEXITCODE -ne 0) { throw 'Verifikasi setelah rebuild GAGAL - service sudah di-start; periksa log aplikasi.' }
      Ok 'Aplikasi dibangun ulang dan berjalan.'
    } else { Ok ('Sudah versi terbaru (' + $newCommit + ').') }
    Pop-Location; exit 0
  }
  Info ('Update: ' + $oldCommit + ' -> ' + $newCommit)

  # 4) Dependensi dan build (service sudah dihentikan di awal)
  Info 'npm ci...'; & npm ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'npm ci gagal.' }
  Info 'npm run build...'; & npm run build
  if ($LASTEXITCODE -ne 0) { throw 'npm run build gagal.' }

  # 5) Restart service dan verifikasi
  $svcNow = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($svcNow) { if ($svcNow.Status -eq 'Running') { & nssm restart $ServiceName } else { & nssm start $ServiceName } } else { Warn ('Service ' + $ServiceName + ' tidak ada - start manual.') }
  Info 'Menunggu aplikasi siap...'; Start-Sleep -Seconds 5
  & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $Port -ServiceName $ServiceName -BasePath $BasePath
  if ($LASTEXITCODE -ne 0) { throw 'Verifikasi setelah update GAGAL.' }

  Ok ('UPDATE SUKSES -> versi ' + $newCommit)
  Pop-Location; exit 0

} catch {
  Warn ('UPDATE GAGAL: ' + $_.Exception.Message)
  if ($oldCommit) {
    Warn ('ROLLBACK OTOMATIS ke ' + $oldCommit + '...')
    $svcRb0 = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($svcRb0 -and $svcRb0.Status -ne 'Stopped') { & nssm stop $ServiceName | Out-Null; Start-Sleep -Seconds 2 }
    Push-Location $InstallPath
    & git reset --hard $oldCommit | Out-Null
    & npm ci --no-audit --no-fund | Out-Null
    & npm run build | Out-Null
    $svcRb = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($svcRb) { if ($svcRb.Status -eq 'Running') { & nssm restart $ServiceName } else { & nssm start $ServiceName } }
    Start-Sleep -Seconds 5
    & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $Port -ServiceName $ServiceName -BasePath $BasePath
    if ($LASTEXITCODE -eq 0) { Warn ('ROLLBACK BERHASIL - aplikasi kembali ke ' + $oldCommit + '.'); Pop-Location; exit 1 }
    Write-Host '[KRITIS] ROLLBACK JUGA GAGAL - aplikasi mungkin down. Pulihkan manual: git reset --hard <commit>; npm ci; npm run build; nssm restart SoeraAI. Restore data dari backup di ' $BackupRoot -ForegroundColor Red
    Pop-Location; exit 2
  }
  exit 1
}
