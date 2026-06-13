$ErrorActionPreference = "Stop"

$summaryPath = Join-Path (Join-Path $PSScriptRoot "..") "docs\chatgpt-summary.md"
$summaryPath = [System.IO.Path]::GetFullPath($summaryPath)

if (-not (Test-Path $summaryPath)) {
  Write-Error "Not found: $summaryPath"
}

$content = [System.IO.File]::ReadAllText($summaryPath, [System.Text.UTF8Encoding]::new($false))
Set-Clipboard -Value $content.TrimEnd()
Write-Host "Copied docs/chatgpt-summary.md to clipboard."
