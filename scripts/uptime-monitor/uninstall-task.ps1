$ErrorActionPreference = 'Stop'

$taskName = 'UmbrelSatoshiUptimeMonitor'

schtasks /end /tn $taskName 2>$null
schtasks /delete /tn $taskName /f

Write-Host "Tarea '$taskName' eliminada."
