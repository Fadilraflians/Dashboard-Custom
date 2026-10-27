$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$logDirectory = Join-Path $env:LOCALAPPDATA "AiGovtech\logs"
$stdoutLog = Join-Path $logDirectory "api.stdout.log"
$stderrLog = Join-Path $logDirectory "api.stderr.log"

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

while ($true) {
  try {
    $apiProcess = Start-Process `
      -FilePath $nodePath `
      -ArgumentList "src/api/index.cjs" `
      -WorkingDirectory $projectRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutLog `
      -RedirectStandardError $stderrLog `
      -PassThru `
      -Wait

    Add-Content -Path (Join-Path $logDirectory "supervisor.log") `
      -Value "$(Get-Date -Format o) API exited with code $($apiProcess.ExitCode); restarting in 5 seconds."
  } catch {
    Add-Content -Path (Join-Path $logDirectory "supervisor.log") `
      -Value "$(Get-Date -Format o) API launch failed: $($_.Exception.Message); retrying in 5 seconds."
  }

  Start-Sleep -Seconds 5
}
