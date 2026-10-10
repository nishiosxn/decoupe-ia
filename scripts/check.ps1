$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & npm run check
    if ($LASTEXITCODE -ne 0) { throw 'Validation failed.' }
} finally { Pop-Location }
