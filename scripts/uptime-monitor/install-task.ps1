$ErrorActionPreference = 'Stop'

$taskName = 'UmbrelSatoshiUptimeMonitor'
$scriptDir = $PSScriptRoot
$scriptPath = Join-Path $scriptDir 'monitor.mjs'

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "No se encontró 'node' en el PATH. Instalá Node.js o agregalo al PATH antes de continuar."
    exit 1
}
$nodePath = $nodeCmd.Source

# Wrapper .cmd para evitar el bug de re-escaping de PowerShell con comillas anidadas en /tr.
$wrapperPath = Join-Path $scriptDir 'run-monitor.cmd'
$wrapperContent = "@echo off`r`n`"$nodePath`" `"$scriptPath`"`r`n"
Set-Content -Path $wrapperPath -Value $wrapperContent -NoNewline -Encoding ASCII

# Wrapper .vbs para lanzar el .cmd sin ventana visible (wscript.exe corre .vbs sin consola).
$vbsPath = Join-Path $scriptDir 'run-monitor-hidden.vbs'
$quote = [char]34
$runLine = 'WshShell.Run ' + $quote + $quote + $quote + $wrapperPath + $quote + $quote + $quote + ', 0, False'
$vbsLines = @(
    'Set WshShell = CreateObject("WScript.Shell")'
    $runLine
)
Set-Content -Path $vbsPath -Value $vbsLines -Encoding ASCII

schtasks /create /tn $taskName /tr "`"$vbsPath`"" /sc onlogon /rl limited /f

Write-Host ""
Write-Host "Tarea '$taskName' creada. Corre en tu sesión cada vez que iniciás Windows."
Write-Host "Para arrancarla ahora sin reiniciar sesión: schtasks /run /tn `"$taskName`""
Write-Host "Log en: $(Join-Path $scriptDir 'monitor.log')"
