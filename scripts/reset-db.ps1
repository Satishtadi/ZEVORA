param(
    [switch]$NoStart
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

Write-Host "Stopping backend..."
& (Join-Path $PSScriptRoot "stop-backend.ps1")

Write-Host "Dropping and recreating ZEVORA schema..."
& $psql -w -h 127.0.0.1 -p 5433 -U zevora -d zevora -v ON_ERROR_STOP=1 `
    -c "drop schema public cascade; create schema public;"
if ($LASTEXITCODE -ne 0) { throw "Database reset failed" }

Write-Host "Schema reset. Flyway will recreate tables and demo data on next backend start."

if (-not $NoStart) {
    & (Join-Path $PSScriptRoot "start-backend.ps1")
}
