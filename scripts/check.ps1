$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$active = Join-Path $root 'outputs/decoupe.html'
$distribution = Join-Path $root 'dist/index.html'

if (!(Test-Path -LiteralPath $active)) { throw 'Source outputs/decoupe.html absente.' }
if (!(Test-Path -LiteralPath $distribution)) { throw 'Distribution dist/index.html absente.' }

$activeHash = (Get-FileHash -LiteralPath $active -Algorithm SHA256).Hash
$distributionHash = (Get-FileHash -LiteralPath $distribution -Algorithm SHA256).Hash
if ($activeHash -ne $distributionHash) { throw 'outputs/decoupe.html et dist/index.html sont différents.' }

$html = Get-Content -LiteralPath $active -Raw
$match = [regex]::Match($html, '<span class="version">v(\d+\.\d+\.\d+)</span>')
if (!$match.Success) { throw 'Numéro de version visible introuvable.' }

& node -e 'const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");const m=h.match(/<script>([\s\S]*?)<\/script>/);if(!m)throw Error("Script introuvable");new Function(m[1]);' $active
if ($LASTEXITCODE -ne 0) { throw 'Syntaxe JavaScript invalide.' }

foreach ($directory in Get-ChildItem -LiteralPath (Join-Path $root 'outputs/versions') -Directory) {
    if (!(Test-Path -LiteralPath (Join-Path $directory.FullName 'decoupe.html'))) { throw "Archive incomplète : $($directory.Name)/decoupe.html" }
    if (!(Test-Path -LiteralPath (Join-Path $directory.FullName 'favicon.svg'))) { throw "Archive incomplète : $($directory.Name)/favicon.svg" }
}

Write-Host "Découpe v$($match.Groups[1].Value) : contrôles réussis." -ForegroundColor Green

