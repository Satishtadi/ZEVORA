$ErrorActionPreference = "SilentlyContinue"
$connections = Get-NetTCPConnection -LocalPort 8080 -State Listen
foreach ($connection in $connections) {
    Write-Host "Stopping backend process $($connection.OwningProcess)..."
    Stop-Process -Id $connection.OwningProcess -Force
}
Write-Host "Backend stopped."
