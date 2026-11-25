param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgData = Join-Path $root ".local\pgdata"
$logDir = Join-Path $root ".local"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

& "$pgBin\pg_isready.exe" -h 127.0.0.1 -p 5433 *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting local PostgreSQL cluster on port 5433..."
    & "$pgBin\pg_ctl.exe" -D $pgData -l (Join-Path $logDir "postgres.log") -o "-p 5433" start
    Start-Sleep -Seconds 2
}

if (-not $SkipBuild) {
    Write-Host "Building backend..."
    Push-Location (Join-Path $root "backend")
    & mvn.cmd -B -q -DskipTests package
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Backend build failed" }
    Pop-Location
}

$jar = Get-ChildItem (Join-Path $root "backend\target") -Filter "zevora-backend-*.jar" |
    Where-Object { $_.Name -notlike "*.original" } | Select-Object -First 1
if (-not $jar) { throw "Backend jar not found. Run without -SkipBuild." }

$existing = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Backend already listening on port 8080 (PID $($existing.OwningProcess))."
    exit 0
}

Write-Host "Starting ZEVORA backend..."
Start-Process -FilePath "java.exe" `
    -ArgumentList "-jar", "`"$($jar.FullName)`"" `
    -WorkingDirectory (Join-Path $root "backend") `
    -RedirectStandardOutput (Join-Path $logDir "backend.out.log") `
    -RedirectStandardError (Join-Path $logDir "backend.err.log") `
    -WindowStyle Hidden

for ($i = 1; $i -le 90; $i++) {
    Start-Sleep -Seconds 1
    try {
        $health = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8080/actuator/health" -TimeoutSec 2
        if ($health.StatusCode -eq 200) {
            Write-Host "Backend ready: http://localhost:8080"
            Write-Host "Swagger UI:    http://localhost:8080/swagger-ui.html"
            exit 0
        }
    } catch { }
}
throw "Backend did not become healthy. Check .local\backend.err.log and .local\backend.out.log"
