#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Update SOERA AI di server Windows (git pull → build → restart → verifikasi) dengan
  BACKUP otomatis sebelum update dan ROLLBACK OTOMATIS bila build/verifikasi gagal.

.EXAMPLE
  .\Update-SoeraAI.ps1                        # update dari origin/main
  .\Update-SoeraAI.ps1 -Branch main           # eksplisit
  .\Update-SoeraAI.ps1 -SkipBackup            # lewati backup (TIDAK disarankan)
#>
[CmdletBinding()]
param(
  [string]$InstallPath = 'C:\xampp\htdocs\soera-ai',
  [string]$ServiceName = 'SoeraAI',
  [string]$BindHost    = '127.0.0.1',
  [int]   $Port        = 3000,
  [string]$Branch      = 'main',
  [string]$BackupRoot  = 'D:\backup-soera-ai',
  [switch]$SkipBackup
)
$ErrorActionPreference = 'Stop'
function Info($m) { Write-Host "[UPDATE] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[!!] $m" -ForegroundColor Yellow }

try {
  if (-not (Test-Path (Join-Path $InstallPath '.git'))) { throw "$InstallPath bukan repo git. Jalankan Install-SoeraAI.ps1 dulu (instalasi fresh)." }
  Push-Location $InstallPath

  # 1) Pastikan tree bersih — jangan timpa editan lokal
  $dirty = & git status --porcelain --untracked-files=no
  if ($dirty) { throw "Ada perubahan lokal yang belum di-commit di server:`n$dirty`nSelesaikan/stash dulu, atau backup & hapus perubahan itu." }

  $oldCommit = (& git rev-parse HEAD).Trim()
  Info "Commit saat ini: $oldCommit"

  # 2) Backup database SEBELUM update
  if (-not $SkipBackup) {
    Info "Backup SQLite sebelum update…"
    & (Join-Path $PSScriptRoot 'Backup-SoeraAI.ps1') -SourcePath (Join-Path $InstallPath 'data') -BackupRoot $BackupRoot
    if ($LASTEXITCODE -ne 0) { throw "Backup gagal — update dibatalkan (jalankan dengan -SkipBackup bila yakin)." }
  } else { Warn "Backup dilewati (-SkipBackup)." }

  # 3) Ambil versi terbaru (fast-forward saja)
  Info "git fetch origin $Branch…"
  & git fetch origin $Branch; if ($LASTEXITCODE -ne 0) { throw "git fetch gagal." }
  & git merge --ff-only "origin/$Branch"; if ($LASTEXITCODE -ne 0) { throw "Branch lokal dan origin/$Branch tidak fast-forwardable — selesaikan divergensi manual." }
  $newCommit = (& git rev-parse HEAD).Trim()
  if ($newCommit -eq $oldCommit) { Ok "Sudah versi terbaru ($newCommit). Tidak ada yang perlu dilakukan."; Pop-Location; exit 0 }
  Info "Update: $oldCommit → $newCommit"

  # 4) Dependensi & build
  Info "npm ci…"; & npm ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "npm ci gagal." }
  Info "npm run build…"; & npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build gagal." }

  # 5) Restart service & verifikasi
  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) { & nssm restart $ServiceName } else { Warn "Service '$ServiceName' tidak ada — start manual diperlukan." }
  Info "Menunggu aplikasi siap…"; Start-Sleep -Seconds 5
  & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $Port -ServiceName $ServiceName
  if ($LASTEXITCODE -ne 0) { throw "Verifikasi setelah update GAGAL." }

  Ok "UPDATE SUKSES → versi $newCommit"
  Pop-Location; exit 0

} catch {
  Warn "UPDATE GAGAL: $($_.Exception.Message)"
  if ($oldCommit) {
    Warn "ROLLBACK OTOMATIS ke $oldCommit…"
    Push-Location $InstallPath
    & git reset --hard $oldCommit | Out-Null
    & npm ci --no-audit --no-fund | Out-Null
    & npm run build | Out-Null
    if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) { & nssm restart $ServiceName }
    Start-Sleep -Seconds 5
    & (Join-Path $PSScriptRoot 'Verify-SoeraAI.ps1') -BindHost $BindHost -Port $Port -ServiceName $ServiceName
    if ($LASTEXITCODE -eq 0) { Warn "ROLLBACK BERHASIL — aplikasi kembali ke versi $oldCommit. Investigasi penyebab kegagalan update sebelum mencoba lagi."; Pop-Location; exit 1 }
    Write-Host "[KRITIS] ROLLBACK JUGA GAGAL — aplikasi mungkin down. Pulihkan manual: git reset --hard $oldCommit; npm ci; npm run build; nssm restart $ServiceName. Restore data dari backup $BackupRoot bila perlu." -ForegroundColor Red
    Pop-Location; exit 2
  }
  exit 1
}
