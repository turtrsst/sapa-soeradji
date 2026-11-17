#Requires -RunAsAdministrator
#Requires -Version 5.1
<#
.SYNOPSIS
  Backup SQLite SOERA AI (harian) + retensi. Aman saat aplikasi aktif (WAL).
.EXAMPLE
  .\Backup-SoeraAI.ps1
  .\Backup-SoeraAI.ps1 -SourcePath 'C:\xampp\htdocs\soera-ai\data' -BackupRoot 'E:\backup' -KeepDays 30
#>
[CmdletBinding()]
param(
  [string]$SourcePath = 'C:\xampp\htdocs\soera-ai\data',
  [string]$BackupRoot = 'D:\backup-soera-ai',
  [int]$KeepDays      = 30
)
$ErrorActionPreference = 'Stop'
try {
  if (-not (Test-Path $SourcePath)) { throw ('Sumber data tidak ada: ' + $SourcePath) }
  $dest = Join-Path $BackupRoot (Get-Date -Format 'yyyy-MM-dd_HHmm')
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $files = Get-ChildItem -Path $SourcePath -Filter '*.sqlite*' -File
  if (-not $files) { throw ('Tidak ada file *.sqlite* di ' + $SourcePath) }
  Copy-Item $files.FullName -Destination $dest -Force
  $lines = @('Backup SOERA AI - ' + (Get-Date -Format o), ('Sumber: ' + $SourcePath), '')
  foreach ($f in (Get-ChildItem $dest -File | Where-Object { $_.Name -ne 'MANIFEST.txt' })) {
    $lines += ('{0}  {1:N0} bytes' -f $f.Name, $f.Length)
  }
  [IO.File]::WriteAllLines((Join-Path $dest 'MANIFEST.txt'), $lines)
  Get-ChildItem -Path $BackupRoot -Directory | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } | Remove-Item -Recurse -Force
  Write-Host ('[OK] Backup selesai -> ' + $dest + ' (' + $files.Count + ' file). Retensi ' + $KeepDays + ' hari.') -ForegroundColor Green
  exit 0
} catch {
  Write-Host ('[GAGAL] ' + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
