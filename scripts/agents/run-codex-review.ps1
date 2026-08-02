#requires -Version 5.1
<#
.SYNOPSIS
  Forge Codex independent-review runner (practical gate).

.DESCRIPTION
  Exit: 0 PASS / 10 FAIL_FIXABLE / 20 NEEDS_OWNER_DECISION / 30 BLOCKED / 40 dry-run / 2 usage

  Official PS 5.1 invocation (call operator + array for VerifyLog):

  & .\scripts\agents\run-codex-review.ps1 `
    -TaskFile .agent\tasks\<task>.md `
    -BaseSha <40-char-sha> `
    -VerifyNoteFile .agent\runtime\verify-note.txt `
    -VerifyLog @('.agent\runtime\tsc.log', '.agent\runtime\build.log')
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$TaskFile,
  [string]$BaseSha = '',
  [int]$Round = 0,
  [switch]$DryRun,
  [string]$VerifyNoteFile = '',
  [string[]]$VerifyLog = @(),
  [string]$PreviousReview = '',
  [int]$TimeoutSec = 1200
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false) } catch { }
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$PromptTemplatePath = Join-Path $PSScriptRoot 'codex-review-prompt.md'
$SchemaPath = Join-Path $PSScriptRoot 'codex-review-schema.json'
$ValidatorPath = Join-Path $PSScriptRoot 'validate-codex-review.mjs'
$OutputDir = Join-Path $RepoRoot '.agent\reviews'
$RuntimeDir = Join-Path $RepoRoot '.agent\runtime'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$DiffExcludes = @('--', '.', ':(exclude).env', ':(exclude).env.*', ':(exclude)**/.env', ':(exclude)**/.env.*')
$KnownPlaceholders = @('TASK_BODY', 'ROUND', 'DIFF_CONTEXT', 'VERIFY_SECTION', 'PREVIOUS_REVIEW')
$script:AttemptMarkerPath = $null
$script:AttemptStatus = ''
$script:AttemptMeta = $null

function Write-Utf8File([string]$Path, [string]$Content) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8)
}

function Read-Utf8File([string]$Path) { [System.IO.File]::ReadAllText($Path, $Utf8) }

function Fail-Blocked([string]$Message) {
  if ($script:AttemptMarkerPath -and $script:AttemptStatus -eq 'started') {
    Write-AttemptMarker -Status 'blocked' -Reason $Message
  }
  Write-Host "BLOCKED: $Message" -ForegroundColor Red
  exit 30
}

function Fail-Usage([string]$Message) {
  Write-Host "USAGE: $Message" -ForegroundColor Yellow
  exit 2
}

function Format-CmdArg([string]$Value) {
  if ($null -eq $Value) { return '""' }
  if ($Value -notmatch '[\s"]') { return $Value }
  '"' + ($Value -replace '"', '\"') + '"'
}

function Test-IsUnderDirectory([string]$CandidatePath, [string]$ParentPath) {
  $child = [System.IO.Path]::GetFullPath($CandidatePath)
  $parent = [System.IO.Path]::GetFullPath($ParentPath)
  if ($child.Length -gt 1) { $child = $child.TrimEnd('\', '/') }
  if ($parent.Length -gt 1) { $parent = $parent.TrimEnd('\', '/') }
  if ([string]::Equals($child, $parent, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  $prefix = $parent + [System.IO.Path]::DirectorySeparatorChar
  return $child.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
}

function Invoke-Git {
  param([string[]]$GitArgs, [switch]$AsBytes)
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'git'
  $psi.Arguments = ($GitArgs | ForEach-Object { Format-CmdArg $_ }) -join ' '
  $psi.WorkingDirectory = $RepoRoot
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.StandardErrorEncoding = $Utf8
  if (-not $AsBytes) { $psi.StandardOutputEncoding = $Utf8 }
  $p = [System.Diagnostics.Process]::Start($psi)
  if ($AsBytes) {
    $ms = New-Object System.IO.MemoryStream
    $p.StandardOutput.BaseStream.CopyTo($ms)
    $stdoutBytes = $ms.ToArray()
  } else {
    $stdoutText = $p.StandardOutput.ReadToEnd()
  }
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) { throw "git $($GitArgs -join ' ') failed ($($p.ExitCode)): $stderr" }
  if ($AsBytes) { return $stdoutBytes }
  return $stdoutText
}

function Split-GitNulPaths([byte[]]$Bytes) {
  if ($null -eq $Bytes -or $Bytes.Length -eq 0) { return @() }
  $paths = New-Object System.Collections.Generic.List[string]
  $start = 0
  for ($i = 0; $i -lt $Bytes.Length; $i++) {
    if ($Bytes[$i] -eq 0) {
      if ($i -gt $start) { $paths.Add($Utf8.GetString($Bytes, $start, $i - $start)) }
      $start = $i + 1
    }
  }
  if ($start -lt $Bytes.Length) { $paths.Add($Utf8.GetString($Bytes, $start, $Bytes.Length - $start)) }
  return @($paths)
}

function Remove-SecretLikeText([string]$Text) {
  if ([string]::IsNullOrEmpty($Text)) { return $Text }
  $out = $Text
  $out = [regex]::Replace($out, '(?i)\b(postgres(?:ql)?|mysql|mongodb|redis|amqp):\/\/[^\/\s@]+@', '$1://[REDACTED]@')
  foreach ($p in @(
      '(?im)\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._\-+=\/]{8,}',
      '(?im)\bBearer\s+[A-Za-z0-9._\-+=\/]{8,}',
      '(?im)(?:(?<![A-Za-z0-9_])|`n|`r`n)sk-proj-[A-Za-z0-9_\-]{8,}',
      '(?im)(?:(?<![A-Za-z0-9_])|`n|`r`n)sk-[A-Za-z0-9_\-]{8,}',
      '(?im)\b(sb_secret_|sb_publishable_)[A-Za-z0-9_\-]+',
      '(?im)\bAKIA[0-9A-Z]{16}\b',
      '(?im)eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',
      '(?im)[A-Za-z0-9_]*(?:api[_-]?key|access[_-]?key|private[_-]?key|secret(?:_key)?|password|token|authorization|service[_-]?role(?:_key)?)\s*[=:]\s*\S+',
      '(?im)-----BEGIN[^-]+PRIVATE KEY-----[\s\S]*?-----END[^-]+PRIVATE KEY-----'
    )) {
    $out = [regex]::Replace($out, $p, '[REDACTED]')
  }
  return $out
}

function Test-IsEnvPath([string]$RelPath) {
  $name = Split-Path -Leaf $RelPath
  return ($name -eq '.env' -or $name -like '.env.*')
}

function Assert-SafeInputPath([string]$Path, [string]$Kind, [string]$UnderRel) {
  if (-not $Path) { return }
  $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $RepoRoot $Path }
  if (-not (Test-Path -LiteralPath $full)) { Fail-Usage "$Kind not found: $Path" }
  if (Test-IsEnvPath (Split-Path -Leaf $full)) { Fail-Blocked "$Kind rejects .env* paths: $Path" }
  $norm = [System.IO.Path]::GetFullPath($full)
  $under = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $UnderRel))
  if (-not (Test-IsUnderDirectory -CandidatePath $norm -ParentPath $under)) {
    Fail-Blocked "$Kind must live under $UnderRel : $Path"
  }
  if (-not (Test-Path -LiteralPath $norm -PathType Leaf)) {
    Fail-Blocked "$Kind must be a regular file: $Path"
  }
  return $norm
}

function Get-AttemptPath([string]$TaskStem, [int]$RoundNumber) {
  return (Join-Path $OutputDir ("{0}-round-{1}.attempt.json" -f $TaskStem, $RoundNumber))
}

function Get-ReviewPath([string]$TaskStem, [int]$RoundNumber) {
  return (Join-Path $OutputDir ("{0}-round-{1}.json" -f $TaskStem, $RoundNumber))
}

function Read-AttemptStatus([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  try {
    $obj = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
    return [string]$obj.status
  } catch {
    return 'blocked'
  }
}

function Write-AttemptMarker([string]$Status, [string]$Reason = '') {
  if (-not $script:AttemptMarkerPath -or -not $script:AttemptMeta) {
    throw 'Internal error: attempt marker context missing'
  }
  $meta = $script:AttemptMeta
  $now = (Get-Date).ToUniversalTime().ToString('o')
  $finished = ''
  if ($Status -ne 'started') { $finished = $now }
  $startedAt = [string]$meta.started_at
  if (-not $startedAt) { $startedAt = $now }
  $reasonJson = ($Reason -replace '\\', '\\' -replace '"', '\"' -replace "`r", '' -replace "`n", ' ')
  $json = @"
{
  "task": "$($meta.task)",
  "round": $($meta.round),
  "base_sha": "$($meta.base_sha)",
  "run_id": "$($meta.run_id)",
  "status": "$Status",
  "reason": "$reasonJson",
  "started_at": "$startedAt",
  "finished_at": "$finished"
}
"@
  $tmp = $script:AttemptMarkerPath + '.tmp'
  Write-Utf8File $tmp ($json.Trim() + "`n")
  if ($Status -eq 'started') {
    if (Test-Path -LiteralPath $script:AttemptMarkerPath) {
      Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
      Fail-Blocked "Attempt marker already exists (round already consumed): $($script:AttemptMarkerPath)"
    }
    Move-Item -LiteralPath $tmp -Destination $script:AttemptMarkerPath
  } else {
    Move-Item -LiteralPath $tmp -Destination $script:AttemptMarkerPath -Force
  }
  $script:AttemptStatus = $Status
}

function Assert-TaskRoundAllowed([string]$TaskStem, [int]$RoundNumber) {
  for ($i = 1; $i -le 3; $i++) {
    $att = Get-AttemptPath $TaskStem $i
    $st = Read-AttemptStatus $att
    if ($st -eq 'blocked' -or $st -eq 'started') {
      Fail-Blocked "Task '$TaskStem' is terminal: round $i attempt status='$st'. Start a new task id to continue."
    }
    $rev = Get-ReviewPath $TaskStem $i
    if (Test-Path -LiteralPath $rev) {
      if ((Invoke-ValidateReviewFile $rev) -ne 0) {
        Fail-Blocked "Task '$TaskStem' has invalid formal review at round ${i}: $rev"
      }
      $verdict = [string]((Get-Content -LiteralPath $rev -Raw -Encoding UTF8 | ConvertFrom-Json).verdict)
      if ($verdict -in @('PASS', 'NEEDS_OWNER_DECISION', 'BLOCKED')) {
        Fail-Blocked "Task '$TaskStem' is terminal: round $i verdict='$verdict'. Start a new task id to continue."
      }
    }
  }
  $attN = Get-AttemptPath $TaskStem $RoundNumber
  if (Test-Path -LiteralPath $attN) {
    Fail-Blocked "Round $RoundNumber attempt already exists (no retry): $attN"
  }
  $revN = Get-ReviewPath $TaskStem $RoundNumber
  if (Test-Path -LiteralPath $revN) {
    Fail-Blocked "Round $RoundNumber review already exists (no overwrite / reuse): $revN"
  }
  if ($RoundNumber -ge 4) {
    Fail-Blocked "Round $RoundNumber is not allowed. Maximum is 3. No exception grant path exists."
  }
  # Round 3 consumption blocks round 4 (also covered above); if round 3 attempt/review exists and auto-picked 4:
  if ((Test-Path -LiteralPath (Get-AttemptPath $TaskStem 3)) -or (Test-Path -LiteralPath (Get-ReviewPath $TaskStem 3))) {
    if ($RoundNumber -gt 3) {
      Fail-Blocked 'Round 3 already consumed; Round 4 is refused.'
    }
  }
}

function Expand-PromptTemplate([hashtable]$Values) {
  $template = Read-Utf8File $PromptTemplatePath
  $sentinels = @{}
  foreach ($name in $KnownPlaceholders) {
    $token = '{{' + $name + '}}'
    if ($template.IndexOf($token, [System.StringComparison]::Ordinal) -lt 0) {
      Fail-Blocked "Prompt template missing required placeholder $token"
    }
    if (-not $Values.ContainsKey($name)) {
      Fail-Blocked "Internal error: missing value for placeholder $token"
    }
    $sentinel = '<<<FORGE_PH_' + [guid]::NewGuid().ToString('N') + '>>>'
    $sentinels[$sentinel] = [string]$Values[$name]
    $template = $template.Replace($token, $sentinel)
  }
  if ($template -match '\{\{[A-Z][A-Z0-9_]*\}\}') {
    Fail-Blocked ("Prompt template has unresolved/unknown placeholder: " + $Matches[0])
  }
  foreach ($sentinel in @($sentinels.Keys)) {
    $template = $template.Replace($sentinel, $sentinels[$sentinel])
  }
  # Final assembled prompt (template body + inserted values) — single redaction pass; no further {{}} expansion.
  return (Remove-SecretLikeText $template)
}

function Get-TreeFingerprint {
  $status = (Invoke-Git -GitArgs @('status', '--porcelain=v1', '-uall')).TrimEnd() -split "`n" |
    Where-Object { $_ -and $_ -notmatch '(?i)(^.. |\?\? )\.agent/' }
  $staged = (Invoke-Git -GitArgs (@('diff', '--cached', '--stat') + $DiffExcludes)).TrimEnd()
  $unstaged = (Invoke-Git -GitArgs (@('diff', '--stat') + $DiffExcludes)).TrimEnd()
  "STATUS:`n$($status -join "`n")`nSTAGED:`n$staged`nUNSTAGED:`n$unstaged"
}

function Get-ReviewContext([string]$FixedBaseSha, [string]$HeadSha) {
  $parts = New-Object System.Collections.Generic.List[string]
  $parts.Add("## HEAD`n$HeadSha")
  $parts.Add("## Immutable review base SHA`n$FixedBaseSha")
  $parts.Add("## committed: git diff ${FixedBaseSha}...HEAD`n" + (Invoke-Git -GitArgs (@('diff', "$FixedBaseSha...HEAD") + $DiffExcludes)).TrimEnd())
  $parts.Add("## git status --porcelain=v1 -uall`n" + (Invoke-Git -GitArgs @('status', '--porcelain=v1', '-uall')).TrimEnd())
  $parts.Add("## staged: git diff --cached`n" + (Invoke-Git -GitArgs (@('diff', '--cached') + $DiffExcludes)).TrimEnd())
  $parts.Add("## unstaged: git diff`n" + (Invoke-Git -GitArgs (@('diff') + $DiffExcludes)).TrimEnd())

  $untrackedBytes = Invoke-Git -AsBytes -GitArgs @('-c', 'core.quotepath=false', 'ls-files', '-z', '--others', '--exclude-standard')
  $untracked = @(
    Split-GitNulPaths -Bytes $untrackedBytes | Where-Object {
      $_ -and -not (Test-IsEnvPath $_) -and $_ -notmatch '^(?i)\.agent/'
    }
  )
  if ($untracked.Count -eq 0) {
    $parts.Add("## untracked`n(none, or only .env*/.agent excluded)")
  } else {
    $ub = New-Object System.Collections.Generic.List[string]
    foreach ($rel in $untracked) {
      $full = Join-Path $RepoRoot ($rel -replace '/', '\')
      if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
      try { $body = Read-Utf8File $full } catch { $body = "[unreadable: $($_.Exception.Message)]" }
      $ub.Add("### untracked: $rel`n$body")
    }
    $parts.Add("## untracked bodies`n" + ($ub -join "`n`n"))
  }
  return (($parts -join "`n`n") + "`n")
}

function Build-ReviewPrompt {
  param(
    [string]$TaskPath, [int]$RoundNumber, [string]$ContextText,
    [string]$VerifyNotePath, [string[]]$VerifyLogPaths, [string]$PreviousReviewPath
  )
  $taskBody = Read-Utf8File $TaskPath
  $verifyBits = New-Object System.Collections.Generic.List[string]
  if ($VerifyNotePath) {
    $verifyBits.Add("### Verify note`n" + (Read-Utf8File $VerifyNotePath))
  }
  foreach ($log in @($VerifyLogPaths)) {
    if (-not $log) { continue }
    $resolved = Assert-SafeInputPath $log 'VerifyLog' '.agent\runtime'
    $verifyBits.Add("### Verify log: $log`n" + (Read-Utf8File $resolved))
  }
  $verifySection = if ($verifyBits.Count -gt 0) { $verifyBits -join "`n`n" } else { '(none provided)' }
  $prev = '(none)'
  if ($PreviousReviewPath) {
    $prev = Read-Utf8File $PreviousReviewPath
  }
  return Expand-PromptTemplate @{
    TASK_BODY        = $taskBody
    ROUND            = [string]$RoundNumber
    DIFF_CONTEXT     = $ContextText
    VERIFY_SECTION   = $verifySection
    PREVIOUS_REVIEW  = $prev
  }
}

function Resolve-CodexNodeEntry {
  $cmd = Get-Command codex.cmd -ErrorAction SilentlyContinue
  if (-not $cmd) { $cmd = Get-Command codex -ErrorAction SilentlyContinue }
  if (-not $cmd) { return $null }
  $js = Join-Path (Split-Path -Parent $cmd.Source) 'node_modules\@openai\codex\bin\codex.js'
  if (Test-Path -LiteralPath $js) { return $js }
  try {
    $root = (& npm root -g 2>$null | Select-Object -First 1)
    if ($root) {
      $alt = Join-Path $root '@openai\codex\bin\codex.js'
      if (Test-Path -LiteralPath $alt) { return $alt }
    }
  } catch { }
  return $null
}

function Invoke-CodexReview([string]$PromptText, [string]$LastMessagePath, [string]$DiagnosticsPath, [string]$StdoutPath, [string]$StderrPath, [string]$PromptArchivePath) {
  $codexJs = Resolve-CodexNodeEntry
  if (-not $codexJs) { Fail-Blocked 'Codex CLI not found (expected npm @openai/codex bin/codex.js via PATH).' }

  Write-Utf8File $PromptArchivePath $PromptText
  Remove-Item -LiteralPath $LastMessagePath, $StdoutPath, $StderrPath -Force -ErrorAction SilentlyContinue

  $argList = @(
    $codexJs, 'exec', '--sandbox', 'read-only',
    '--ignore-user-config', '--ignore-rules', '--ephemeral', '--strict-config',
    '--cd', $RepoRoot, '--output-schema', $SchemaPath, '-o', $LastMessagePath,
    '--disable', 'browser_use', '--disable', 'hooks', '--disable', 'apps',
    '-c', 'model_reasoning_effort=high',
    '-c', 'shell_environment_policy.inherit=core',
    '-'
  )

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'node'
  $psi.Arguments = ($argList | ForEach-Object { Format-CmdArg $_ }) -join ' '
  $psi.WorkingDirectory = $RepoRoot
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.StandardOutputEncoding = $Utf8
  $psi.StandardErrorEncoding = $Utf8

  $envMap = $psi.EnvironmentVariables
  $envMap.Clear()
  foreach ($name in @(
      'PATH', 'Pathext', 'PATHEXT', 'SystemRoot', 'windir', 'WINDIR', 'SystemDrive',
      'ComSpec', 'COMSPEC', 'TEMP', 'TMP', 'USERPROFILE', 'HOME', 'USERNAME', 'USERDOMAIN',
      'APPDATA', 'LOCALAPPDATA', 'ProgramData', 'ProgramFiles', 'ProgramFiles(x86)',
      'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'OS', 'CODEX_HOME'
    )) {
    $val = [Environment]::GetEnvironmentVariable($name)
    if ($val) { $envMap[$name] = $val }
  }

  $started = Get-Date
  $p = [System.Diagnostics.Process]::Start($psi)
  $outFile = [System.IO.File]::Create($StdoutPath)
  $errFile = [System.IO.File]::Create($StderrPath)
  $outCopy = $p.StandardOutput.BaseStream.CopyToAsync($outFile)
  $errCopy = $p.StandardError.BaseStream.CopyToAsync($errFile)
  try {
    $utf8Bytes = $Utf8.GetBytes($PromptText)
    $p.StandardInput.BaseStream.Write($utf8Bytes, 0, $utf8Bytes.Length)
    $p.StandardInput.BaseStream.Flush()
    $p.StandardInput.Close()
  } catch { }

  if (-not $p.WaitForExit([Math]::Max(1000, $TimeoutSec * 1000))) {
    try { $p.Kill() } catch { }
    Fail-Blocked "Codex exec timed out after $TimeoutSec seconds."
  }
  try { $outCopy.Wait() } catch { }
  try { $errCopy.Wait() } catch { }
  $outFile.Close(); $errFile.Close()

  $stdout = if (Test-Path -LiteralPath $StdoutPath) { Read-Utf8File $StdoutPath } else { '' }
  $stderr = if (Test-Path -LiteralPath $StderrPath) { Read-Utf8File $StderrPath } else { '' }
  Write-Utf8File $DiagnosticsPath "exit_code=$($p.ExitCode)`ncodex_js=$codexJs`nargs=$($argList -join ' ')`nelapsed_sec=$((New-TimeSpan -Start $started -End (Get-Date)).TotalSeconds)`n--- stdout ---`n$stdout`n--- stderr ---`n$stderr`n"
  if ($p.ExitCode -ne 0) { Fail-Blocked "Codex exec failed with exit $($p.ExitCode). See $DiagnosticsPath" }
  if (-not (Test-Path -LiteralPath $LastMessagePath)) { Fail-Blocked "Codex did not write last-message file: $LastMessagePath" }
  $info = Get-Item -LiteralPath $LastMessagePath
  if ($info.Length -le 0 -or $info.LastWriteTime -lt $started) {
    Fail-Blocked "Codex last-message is missing, empty, or stale: $LastMessagePath"
  }
  return (Read-Utf8File $LastMessagePath)
}

function Save-And-ValidateReview([string]$RawText, [string]$ReviewPath, [string]$RawStagingPath) {
  Write-Utf8File $RawStagingPath ($RawText.Trim() + "`n")
  $normalized = [System.IO.Path]::ChangeExtension($RawStagingPath, '.normalized.json')
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'node'
  $psi.Arguments = ((@($ValidatorPath, $RawStagingPath, '--normalized-out', $normalized) | ForEach-Object { Format-CmdArg $_ }) -join ' ')
  $psi.WorkingDirectory = $RepoRoot
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.StandardOutputEncoding = $Utf8
  $psi.StandardErrorEncoding = $Utf8
  $p = [System.Diagnostics.Process]::Start($psi)
  $vout = $p.StandardOutput.ReadToEnd()
  $verr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  Write-Host $vout
  if ($verr) { Write-Host $verr }
  if ($p.ExitCode -ne 0) {
    Fail-Blocked "Review JSON failed validation (exit $($p.ExitCode)). Raw kept at $RawStagingPath (not a formal round file)."
  }
  Write-Utf8File $ReviewPath (Read-Utf8File $RawStagingPath)
  $finalNorm = [System.IO.Path]::ChangeExtension($ReviewPath, '.normalized.json')
  if (Test-Path -LiteralPath $normalized) {
    Write-Utf8File $finalNorm (Read-Utf8File $normalized)
  }
  return [string]((Get-Content -LiteralPath $finalNorm -Raw -Encoding UTF8 | ConvertFrom-Json).verdict)
}

function Invoke-ValidateReviewFile([string]$ReviewJsonPath) {
  $norm = Join-Path $RuntimeDir ('validate-prev-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '.normalized.json')
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'node'
  $psi.Arguments = ((@($ValidatorPath, $ReviewJsonPath, '--normalized-out', $norm, '--quiet') | ForEach-Object { Format-CmdArg $_ }) -join ' ')
  $psi.WorkingDirectory = $RepoRoot
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.StandardOutputEncoding = $Utf8
  $psi.StandardErrorEncoding = $Utf8
  $p = [System.Diagnostics.Process]::Start($psi)
  [void]$p.StandardOutput.ReadToEnd()
  [void]$p.StandardError.ReadToEnd()
  $p.WaitForExit()
  Remove-Item -LiteralPath $norm -Force -ErrorAction SilentlyContinue
  return $p.ExitCode
}

function Resolve-ImmutableBaseSha([string]$TaskStem, [string]$Requested) {
  $metaPath = Join-Path $RuntimeDir ($TaskStem + '.review-base-sha')
  $hasMeta = Test-Path -LiteralPath $metaPath
  $candidate = $Requested.Trim()
  if (-not $candidate -and $hasMeta) {
    $candidate = (Read-Utf8File $metaPath).Trim()
  }
  if (-not $candidate) {
    Fail-Blocked 'First review for this task requires explicit -BaseSha <40-char-sha>. Refusing to default to current HEAD.'
  }
  if ($candidate -notmatch '^[0-9a-fA-F]{40}$') {
    Fail-Blocked "BaseSha must be exactly a 40-char commit SHA (symbolic refs / short SHAs / branch names are rejected). Got: $candidate"
  }
  try { [void](Invoke-Git -GitArgs @('cat-file', '-e', ($candidate + '^{commit}'))) } catch {
    Fail-Blocked "BaseSha is not a commit in this repository: $candidate"
  }
  if ($hasMeta) {
    $existing = (Read-Utf8File $metaPath).Trim()
    if (-not [string]::Equals($existing, $candidate, [System.StringComparison]::OrdinalIgnoreCase)) {
      Fail-Blocked "Immutable base SHA for this task was rewritten ($existing -> $candidate). Refusing PASS path."
    }
  } else {
    Write-Utf8File $metaPath ($candidate + "`n")
  }
  return $candidate.ToLowerInvariant()
}

function Resolve-PreviousReviewForRound([string]$TaskStem, [int]$RoundNumber, [string]$ExplicitPrevious) {
  if ($RoundNumber -le 1) {
    if ($ExplicitPrevious) { return (Assert-SafeInputPath $ExplicitPrevious 'PreviousReview' '.agent\reviews') }
    return ''
  }
  for ($i = 1; $i -lt $RoundNumber; $i++) {
    $att = Get-AttemptPath $TaskStem $i
    $st = Read-AttemptStatus $att
    if ($st -ne 'reviewed') {
      Fail-Blocked "Round $RoundNumber requires prior round $i attempt status=reviewed (got '$st')."
    }
    $p = Get-ReviewPath $TaskStem $i
    if (-not (Test-Path -LiteralPath $p)) {
      Fail-Blocked "Round $RoundNumber skipped or missing prior review: $p"
    }
    if ((Invoke-ValidateReviewFile $p) -ne 0) {
      Fail-Blocked "Prior review failed schema/validator contract (not usable for continuation): $p"
    }
  }
  $prevPath = Get-ReviewPath $TaskStem ($RoundNumber - 1)
  $prevObj = $null
  try {
    $prevObj = Get-Content -LiteralPath $prevPath -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    Fail-Blocked "Previous review is not valid JSON: $prevPath"
  }
  $prevVerdict = [string]$prevObj.verdict
  if ($prevVerdict -ne 'FAIL_FIXABLE') {
    Fail-Blocked "Round $RoundNumber refused: previous verdict was '$prevVerdict' (only FAIL_FIXABLE may continue)."
  }
  if ($ExplicitPrevious) {
    $explicit = Assert-SafeInputPath $ExplicitPrevious 'PreviousReview' '.agent\reviews'
    $want = [System.IO.Path]::GetFullPath($prevPath)
    $got = [System.IO.Path]::GetFullPath($explicit)
    if (-not [string]::Equals($want, $got, [System.StringComparison]::OrdinalIgnoreCase)) {
      Fail-Blocked "PreviousReview must be the immediate prior round file: $prevPath"
    }
    return $explicit
  }
  return $prevPath
}

function Normalize-VerifyLogArgs([string[]]$Logs) {
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($entry in @($Logs)) {
    if (-not $entry) { continue }
    if ($entry.Contains(',')) {
      Fail-Usage "VerifyLog entries must be separate array elements (PS 5.1: -VerifyLog @('a','b')). Comma-separated single strings are not split. Got: $entry"
    }
    [void]$out.Add($entry)
  }
  return @($out)
}

# --- main ---
$TaskFile = Assert-SafeInputPath $TaskFile 'TaskFile' '.agent\tasks'
foreach ($req in @($PromptTemplatePath, $SchemaPath, $ValidatorPath)) {
  if (-not (Test-Path -LiteralPath $req)) { Fail-Blocked "Missing required file: $req" }
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null

$VerifyLog = @(Normalize-VerifyLogArgs $VerifyLog)
$taskStem = [System.IO.Path]::GetFileNameWithoutExtension($TaskFile)

if ($Round -gt 0) {
  $script:ResolvedRound = $Round
} else {
  $n = 1
  while (
    (Test-Path -LiteralPath (Get-ReviewPath $taskStem $n)) -or
    (Test-Path -LiteralPath (Get-AttemptPath $taskStem $n))
  ) { $n++ }
  $script:ResolvedRound = $n
}
if ($script:ResolvedRound -lt 1) { Fail-Usage 'Round must be >= 1' }
if ($script:ResolvedRound -ge 4) {
  Fail-Blocked "Round $($script:ResolvedRound) is not allowed. Maximum is 3. No exception grant path exists."
}

Assert-TaskRoundAllowed -TaskStem $taskStem -RoundNumber $script:ResolvedRound

$runId = '{0}-r{1}-p{2}-{3}' -f $taskStem, $script:ResolvedRound, $PID, ([guid]::NewGuid().ToString('N').Substring(0, 8))
$reviewPath = Get-ReviewPath $taskStem $script:ResolvedRound

$VerifyNotePath = if ($VerifyNoteFile) { Assert-SafeInputPath $VerifyNoteFile 'VerifyNoteFile' '.agent\runtime' } else { '' }
$PreviousReviewPath = Resolve-PreviousReviewForRound -TaskStem $taskStem -RoundNumber $script:ResolvedRound -ExplicitPrevious $PreviousReview
$FixedBaseSha = Resolve-ImmutableBaseSha -TaskStem $taskStem -Requested $BaseSha
$HeadSha = (Invoke-Git -GitArgs @('rev-parse', 'HEAD')).Trim()

Write-Host "Codex independent review — round $($script:ResolvedRound) (max 3) base=$FixedBaseSha run=$runId" -ForegroundColor Cyan

$fpBefore = Get-TreeFingerprint
$context = Get-ReviewContext $FixedBaseSha $HeadSha
$prompt = Build-ReviewPrompt -TaskPath $TaskFile -RoundNumber $script:ResolvedRound -ContextText $context `
  -VerifyNotePath $VerifyNotePath -VerifyLogPaths $VerifyLog -PreviousReviewPath $PreviousReviewPath

$promptOut = Join-Path $RuntimeDir ($runId + '-prompt.md')
$lastMsg = Join-Path $RuntimeDir ($runId + '-last-message.txt')
$diagPath = Join-Path $RuntimeDir ($runId + '-diagnostics.txt')
$stdoutPath = Join-Path $RuntimeDir ($runId + '-stdout.txt')
$stderrPath = Join-Path $RuntimeDir ($runId + '-stderr.txt')
Write-Utf8File $promptOut $prompt
Write-Host "Prompt written: $promptOut"

if ($DryRun) {
  Write-Host "DRY_RUN=1 — Codex not executed. This is never PASS. No attempt marker written." -ForegroundColor Yellow
  Write-Host "Would write review to: $reviewPath"
  Write-Host "Prompt size: $($prompt.Length) chars"
  Write-Host ("VerifyLog count: " + @($VerifyLog).Count)
  exit 40
}

# Codex is about to run — consume this round via attempt marker (started).
$script:AttemptMarkerPath = Get-AttemptPath $taskStem $script:ResolvedRound
$script:AttemptMeta = @{
  task       = $taskStem
  round      = $script:ResolvedRound
  base_sha   = $FixedBaseSha
  run_id     = $runId
  started_at = (Get-Date).ToUniversalTime().ToString('o')
}
Write-AttemptMarker -Status 'started'
Write-Host "Attempt started: $($script:AttemptMarkerPath)"

$raw = Invoke-CodexReview $prompt $lastMsg $diagPath $stdoutPath $stderrPath (Join-Path $RuntimeDir ($runId + '-codex-prompt.md'))
$fpAfter = Get-TreeFingerprint
if ($fpBefore -ne $fpAfter) {
  Write-Host "NOTE: non-.agent working tree fingerprint changed during review (informational)." -ForegroundColor Yellow
  Write-Utf8File (Join-Path $RuntimeDir ($runId + '-tree-fingerprint-changed.txt')) "BEFORE:`n$fpBefore`n`nAFTER:`n$fpAfter`n"
}

$rawStaging = Join-Path $RuntimeDir ($runId + '-review-raw.json')
$verdict = Save-And-ValidateReview $raw $reviewPath $rawStaging
Write-AttemptMarker -Status 'reviewed' -Reason ("verdict=" + $verdict)
Write-Host "Review saved: $reviewPath"
Write-Host "VERDICT=$verdict"
switch ($verdict) {
  'PASS' { exit 0 }
  'FAIL_FIXABLE' { exit 10 }
  'NEEDS_OWNER_DECISION' { exit 20 }
  'BLOCKED' { exit 30 }
  default { Fail-Blocked "Unexpected verdict after validation: $verdict" }
}
