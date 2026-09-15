param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$active = Join-Path $root 'outputs/decoupe.html'
$favicon = Join-Path $root 'outputs/favicon.svg'
$distribution = Join-Path $root 'dist/index.html'
$distributionIcon = Join-Path $root 'dist/favicon.svg'
$target = Join-Path $root "outputs/versions/v$Version"

if (Test-Path -LiteralPath $target) { throw "La version v$Version existe déjà. Une archive ne doit jamais être écrasée." }

$html = Get-Content -LiteralPath $active -Raw
if ($html -notmatch "<span class=`"version`">v$([regex]::Escape($Version))</span>") {
    throw "Le numéro visible dans outputs/decoupe.html n’est pas v$Version."
}

Copy-Item -LiteralPath $active -Destination $distribution
Copy-Item -LiteralPath $favicon -Destination $distributionIcon
New-Item -ItemType Directory -Path $target | Out-Null
Copy-Item -LiteralPath $active -Destination (Join-Path $target 'decoupe.html')
Copy-Item -LiteralPath $favicon -Destination (Join-Path $target 'favicon.svg')

& (Join-Path $PSScriptRoot 'check.ps1')
Write-Host "Archive v$Version créée dans outputs/versions/v$Version." -ForegroundColor Green

