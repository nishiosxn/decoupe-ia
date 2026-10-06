param([Parameter(Mandatory = $true)][ValidatePattern('^\d+\.\d+\.\d+$')][string]$Version)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$package = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
if ($package.version -ne $Version) { throw 'La version demandée ne correspond pas à package.json.' }
$target = Join-Path $root "outputs/versions/v$Version"
if (Test-Path -LiteralPath $target) { throw "Archive v$Version existante : elle ne sera pas écrasée." }
& (Join-Path $PSScriptRoot 'check.ps1')
New-Item -ItemType Directory -Path $target | Out-Null
Copy-Item -Path (Join-Path $root 'dist/*') -Destination $target -Recurse
Write-Host "Archive statique v$Version créée. Aucun tag, push ou déploiement automatique."
