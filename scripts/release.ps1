# Read-only release gate. Does not merge, tag, push or deploy.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & npm run check
    if ($LASTEXITCODE -ne 0) { throw 'Validation failed.' }
    & npm run check:release
    if ($LASTEXITCODE -ne 0) { throw 'Stable/candidate documentation must be synchronized after user approval.' }
} finally { Pop-Location }
