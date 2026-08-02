#requires -Version 5.1
<#
.SYNOPSIS
  Behavioral self-test for the Codex independent-review gate.
  Does NOT call the real Codex CLI. Exit 0 on all pass.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$Runner = Join-Path $PSScriptRoot 'run-codex-review.ps1'
$Validator = Join-Path $PSScriptRoot 'validate-codex-review.mjs'
$Prompt = Join-Path $PSScriptRoot 'codex-review-prompt.md'
$Schema = Join-Path $PSScriptRoot 'codex-review-schema.json'
$Utf8 = [System.Text.UTF8Encoding]::new($false)

$script:Failed = 0
$script:Passed = 0
$script:SelftestId = [guid]::NewGuid().ToString('n')
$script:TempRoot = Join-Path $env:TEMP ('forge-codex-selftest-' + $script:SelftestId)
$script:CreatedPaths = New-Object System.Collections.Generic.List[string]
New-Item -ItemType Directory -Force -Path $script:TempRoot | Out-Null

function Assert-True([string]$Name, [bool]$Condition, [string]$Detail = '') {
  if ($Condition) {
    $script:Passed++
    Write-Host "PASS  $Name"
  } else {
    $script:Failed++
    Write-Host "FAIL  $Name $(if ($Detail) { "- $Detail" })" -ForegroundColor Red
  }
}

function Track([string]$Path) {
  [void]$script:CreatedPaths.Add($Path)
  return $Path
}

function Write-TempFile([string]$Dir, [string]$Name, [string]$Content) {
  if (-not (Test-Path -LiteralPath $Dir)) {
    New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    [void]$script:CreatedPaths.Add($Dir)
  }
  $path = Join-Path $Dir $Name
  [System.IO.File]::WriteAllText($path, $Content, $Utf8)
  return (Track $path)
}

function Invoke-ValidatorExit([string]$Json, [string]$Label) {
  $path = Join-Path $script:TempRoot ("v-$Label.json")
  [System.IO.File]::WriteAllText($path, $Json, $Utf8)
  $norm = [System.IO.Path]::ChangeExtension($path, '.normalized.json')
  $out = Join-Path $script:TempRoot ("v-$Label-out.txt")
  $err = Join-Path $script:TempRoot ("v-$Label-err.txt")
  $p = Start-Process -FilePath 'node' -ArgumentList @($Validator, $path, '--normalized-out', $norm, '--quiet') `
    -WorkingDirectory $RepoRoot -Wait -PassThru -NoNewWindow `
    -RedirectStandardOutput $out -RedirectStandardError $err
  return $p.ExitCode
}

function Invoke-Runner([string[]]$ExtraArgs) {
  $out = Join-Path $script:TempRoot ('run-out-' + [guid]::NewGuid().ToString('n').Substring(0, 8) + '.txt')
  $err = Join-Path $script:TempRoot ('run-err-' + [guid]::NewGuid().ToString('n').Substring(0, 8) + '.txt')
  $args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $Runner) + $ExtraArgs
  $p = Start-Process -FilePath 'powershell.exe' -ArgumentList $args `
    -WorkingDirectory $RepoRoot -Wait -PassThru -NoNewWindow `
    -RedirectStandardOutput $out -RedirectStandardError $err
  return @{ ExitCode = $p.ExitCode; Out = $out; Err = $err }
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

function Remove-SecretLikeText-Local([string]$Text) {
  $out = $Text
  $out = [regex]::Replace($out, '(?i)\b(postgres(?:ql)?|mysql|mongodb|redis|amqp):\/\/[^\/\s@]+@', '$1://[REDACTED]@')
  foreach ($p in @(
      '(?im)\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._\-+=\/]{8,}',
      '(?im)\bBearer\s+[A-Za-z0-9._\-+=\/]{8,}',
      '(?im)(?:(?<![A-Za-z0-9_])|`n|`r`n)sk-proj-[A-Za-z0-9_\-]{8,}',
      '(?im)(?:(?<![A-Za-z0-9_])|`n|`r`n)sk-[A-Za-z0-9_\-]{8,}',
      '(?im)\b(sb_secret_|sb_publishable_)[A-Za-z0-9_\-]+',
      '(?im)[A-Za-z0-9_]*(?:api[_-]?key|access[_-]?key|private[_-]?key|secret(?:_key)?|password|token|authorization|service[_-]?role(?:_key)?)\s*[=:]\s*\S+'
    )) {
    $out = [regex]::Replace($out, $p, '[REDACTED]')
  }
  return $out
}

function Write-FakeAttempt([string]$TaskStem, [int]$RoundNumber, [string]$Status, [string]$BaseShaValue) {
  $reviews = Join-Path $RepoRoot '.agent\reviews'
  New-Item -ItemType Directory -Force -Path $reviews | Out-Null
  $path = Join-Path $reviews ("{0}-round-{1}.attempt.json" -f $TaskStem, $RoundNumber)
  $json = @"
{
  "task": "$TaskStem",
  "round": $RoundNumber,
  "base_sha": "$BaseShaValue",
  "run_id": "selftest-fake",
  "status": "$Status",
  "reason": "selftest",
  "started_at": "2026-01-01T00:00:00Z",
  "finished_at": "2026-01-01T00:00:01Z"
}
"@
  [System.IO.File]::WriteAllText($path, $json.Trim() + "`n", $Utf8)
  return (Track $path)
}

function Write-FakeReview([string]$TaskStem, [int]$RoundNumber, [string]$Verdict, [string]$BaseShaValue = '') {
  $reviews = Join-Path $RepoRoot '.agent\reviews'
  New-Item -ItemType Directory -Force -Path $reviews | Out-Null
  $path = Join-Path $reviews ("{0}-round-{1}.json" -f $TaskStem, $RoundNumber)
  $findings = '[]'
  $tests = '[]'
  if ($Verdict -eq 'FAIL_FIXABLE') {
    $findings = '[{"severity":"high","file":"x.ps1","line":"1","issue":"i","required_fix":"f"}]'
    $tests = '["t"]'
  }
  $json = '{"verdict":"' + $Verdict + '","summary":"selftest","findings":' + $findings + ',"tests_required":' + $tests + ',"owner_decisions":[]}'
  [System.IO.File]::WriteAllText($path, $json + "`n", $Utf8)
  [void](Track $path)
  if ($BaseShaValue) {
    [void](Write-FakeAttempt $TaskStem $RoundNumber 'reviewed' $BaseShaValue)
  }
  return $path
}

Write-Host "=== Codex review selftest (behavioral) ===" -ForegroundColor Cyan
Write-Host ("PSVersion=" + $PSVersionTable.PSVersion.ToString())
Write-Host ("SelftestId=" + $script:SelftestId)
Assert-True 'running under Windows PowerShell 5.x host for this script' ($PSVersionTable.PSVersion.Major -eq 5)

# --- validator contract ---
$passJson = '{"verdict":"PASS","summary":"ok","findings":[],"tests_required":[],"owner_decisions":[]}'
$failFix = '{"verdict":"FAIL_FIXABLE","summary":"x","findings":[{"severity":"high","file":"a.ps1","line":"1","issue":"i","required_fix":"f"}],"tests_required":["t"],"owner_decisions":[]}'
$needsOwner = '{"verdict":"NEEDS_OWNER_DECISION","summary":"x","findings":[],"tests_required":[],"owner_decisions":["q?"]}'
$blocked = '{"verdict":"BLOCKED","summary":"x","findings":[],"tests_required":[],"owner_decisions":[]}'
Assert-True 'validator accepts PASS' ((Invoke-ValidatorExit $passJson 'pass') -eq 0)
Assert-True 'validator accepts FAIL_FIXABLE' ((Invoke-ValidatorExit $failFix 'ff') -eq 0)
Assert-True 'validator accepts NEEDS_OWNER_DECISION' ((Invoke-ValidatorExit $needsOwner 'own') -eq 0)
Assert-True 'validator accepts BLOCKED' ((Invoke-ValidatorExit $blocked 'blk') -eq 0)
Assert-True 'validator rejects invalid JSON' ((Invoke-ValidatorExit '{ broken' 'bad') -ne 0)
Assert-True 'validator rejects fenced JSON' ((Invoke-ValidatorExit (('```json' + "`n" + $passJson + "`n" + '```')) 'fence') -ne 0)
Assert-True 'validator rejects prose+JSON' ((Invoke-ValidatorExit (("Here:" + "`n" + $passJson)) 'prose') -ne 0)
Assert-True 'validator rejects PASS with findings' ((Invoke-ValidatorExit '{"verdict":"PASS","summary":"x","findings":[{"severity":"low","file":"a","line":null,"issue":"i","required_fix":"f"}],"tests_required":[],"owner_decisions":[]}' 'pfind') -ne 0)
Assert-True 'validator rejects PASS with tests_required' ((Invoke-ValidatorExit '{"verdict":"PASS","summary":"x","findings":[],"tests_required":["x"],"owner_decisions":[]}' 'ptest') -ne 0)
Assert-True 'validator rejects unknown verdict' ((Invoke-ValidatorExit '{"verdict":"YES","summary":"x","findings":[],"tests_required":[],"owner_decisions":[]}' 'unk') -ne 0)

# --- path boundary ---
$root = 'C:\Forge\demo-repo'
Assert-True 'path: root equals parent' (Test-IsUnderDirectory $root $root)
Assert-True 'path: child under parent' (Test-IsUnderDirectory 'C:\Forge\demo-repo\a\b.txt' $root)
Assert-True 'path: sibling rejected' (-not (Test-IsUnderDirectory 'C:\Forge\demo-repo-other\x' $root))
Assert-True 'path: repo2 sibling rejected' (-not (Test-IsUnderDirectory 'C:\Forge\demo-repo2\x' $root))

# --- redaction ---
$sample = "Authorization: Bearer tok_LIVE_dummy_001`nsk-proj-ABCDEFGHIJKLMNOPQRST`nsk-abcdefghijklmnopqrstuvwxyz012345`nsk-ant-api03-DUMMYHYPHENVALUE001`nsk-live_dummy_underscore_token_001`nDATABASE_URL=postgresql://forge_user:dummyPass99@db.example.com:5432/forge`nSUPABASE_SERVICE_ROLE_KEY=sb_secret_dummy_role_value_001`npassword=plain-dummy`nnormal https://example.com/path should-stay`n"
$embedded = 'line: sk-proj-EMBEDPROJVALUE001234`nsk-ant-api03-EMBEDHYPHENVALUE001'
$red = Remove-SecretLikeText-Local ($sample + $embedded)
Assert-True 'redaction masks sk-proj' (($red.Contains('[REDACTED]')) -and (-not $red.Contains('sk-proj-ABCDEF')) -and (-not $red.Contains('sk-proj-EMBEDPROJ')))
Assert-True 'redaction masks sk-' (-not $red.Contains('sk-abcdefghijklmnopqrstuvwxyz'))
Assert-True 'redaction masks sk- with hyphen/underscore' ((-not $red.Contains('sk-ant-api03-DUMMY')) -and (-not $red.Contains('sk-live_dummy_underscore')) -and (-not $red.Contains('sk-ant-api03-EMBED')))
Assert-True 'redaction masks DB userinfo' (($red -match 'postgresql://\[REDACTED\]@db\.example\.com') -and (-not $red.Contains('dummyPass99')))
Assert-True 'redaction masks service role / bearer' ((-not $red.Contains('sb_secret_dummy')) -and (-not $red.Contains('tok_LIVE_dummy')))
Assert-True 'redaction keeps normal URL host' ($red.Contains('https://example.com/path'))
Assert-True 'redaction does not over-match ask-' ((Remove-SecretLikeText-Local 'ask-abcdefghijklmnop').Contains('ask-abcdefghijklmnop'))

# --- runner source gates ---
$runnerText = [System.IO.File]::ReadAllText($Runner, $Utf8)
Assert-True 'no Inject/OwnerApproved/ForceTree params' (
  ($runnerText -notmatch 'InjectReviewJson') -and
  ($runnerText -notmatch 'OwnerApprovedRound4') -and
  ($runnerText -notmatch 'ForceTreeChanged')
)
Assert-True 'runner does not commit/push' (
  ($runnerText -notmatch '(?i)git\s+commit') -and ($runnerText -notmatch '(?i)git\s+push')
)
Assert-True 'Codex flags present' (
  $runnerText -match 'read-only' -and $runnerText -match 'ignore-user-config' -and
  $runnerText -match 'ephemeral' -and $runnerText -match 'strict-config' -and
  $runnerText -match 'shell_environment_policy\.inherit=core'
)
Assert-True 'immutable base SHA metadata used' ($runnerText -match 'review-base-sha' -and $runnerText -match 'Resolve-ImmutableBaseSha')
Assert-True 'first round requires explicit BaseSha' ($runnerText -match 'requires explicit -BaseSha')
Assert-True 'BaseSha rejects symbolic refs' ($runnerText -match 'symbolic refs / short SHAs')
Assert-True 'round continuity gate present' ($runnerText -match 'Resolve-PreviousReviewForRound' -and $runnerText -match 'only FAIL_FIXABLE may continue')
Assert-True 'prior review validated via schema' ($runnerText -match 'Invoke-ValidateReviewFile')
Assert-True 'invalid raw not formal round file' ($runnerText -match 'review-raw\.json' -and $runnerText -match 'not a formal round file')
Assert-True 'attempt marker lifecycle present' (
  ($runnerText -match 'Write-AttemptMarker') -and ($runnerText -match "-Status 'started'")
)
Assert-True 'final prompt redaction after expand' ($runnerText -match 'Remove-SecretLikeText \$template' -or $runnerText -match 'Final assembled prompt')
Assert-True 'VerifyLog rejects comma-separated' ($runnerText -match 'Comma-separated single strings are not split')
Assert-True 'runtime runId includes task+round+pid' ($runnerText -match 'runId' -and $runnerText -match '\$PID')
Assert-True 'sentinel placeholder expansion' ($runnerText -match 'FORGE_PH_' -and $runnerText -match 'Expand-PromptTemplate')
Assert-True 'test-only dir absent' (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'test-only')))
Assert-True 'docs require BaseSha + array VerifyLog' (
  ((Get-Content -LiteralPath (Join-Path $RepoRoot 'docs\agent-context\cursor-codex-review-flow.md') -Raw) -match '-BaseSha') -and
  ((Get-Content -LiteralPath (Join-Path $RepoRoot 'docs\agent-context\cursor-codex-review-flow.md') -Raw) -match '-VerifyLog @\(') -and
  ((Get-Content -LiteralPath (Join-Path $RepoRoot '.cursor\rules\codex-independent-review.mdc') -Raw) -match '-BaseSha') -and
  ((Get-Content -LiteralPath (Join-Path $RepoRoot '.cursor\rules\codex-independent-review.mdc') -Raw) -match '-VerifyLog @\(')
)
Assert-True 'README documents attempt markers' (
  ((Get-Content -LiteralPath (Join-Path $RepoRoot '.agent\README.md') -Raw) -match 'attempt\.json') -and
  ((Get-Content -LiteralPath (Join-Path $RepoRoot '.agent\README.md') -Raw) -match 'p<pid>')
)

# --- dry-run behavioral (real runner, no Codex) ---
$taskDir = Join-Path $RepoRoot '.agent\tasks'
$runtimeDir = Join-Path $RepoRoot '.agent\runtime'
$reviewsDir = Join-Path $RepoRoot '.agent\reviews'
New-Item -ItemType Directory -Force -Path $taskDir, $runtimeDir, $reviewsDir | Out-Null

$taskA = 'selftest-gate-a-' + $script:SelftestId.Substring(0, 8)
$taskB = 'selftest-gate-b-' + $script:SelftestId.Substring(0, 8)
$taskC = 'selftest-gate-c-' + $script:SelftestId.Substring(0, 8)
$baseSha = (& git -C $RepoRoot rev-parse HEAD).Trim()

$taskABody = "# $taskA`nbody contains {{VERIFY_SECTION}} and {{PREVIOUS_REVIEW}} literals that must survive.`nsecret demo: sk-proj-THISISADUMMYVALUE00123456789`nsk-ant-api03-DUMMYHYPHENVALUEZZZ`nsk-live_dummy_underscore_token_zzz`nOPENAI_API_KEY=dummy_openai_key_value_001`nSUPABASE_SERVICE_ROLE_KEY=dummy_service_role_value_001`nDATABASE_PASSWORD=dummy_db_pass_001`nGITHUB_TOKEN=dummy_github_token_001`nAuthorization: Bearer dummy_bearer_token_001`nDATABASE_URL=postgresql://forge_user:dummyPass99@db.example.com:5432/forge`n"
$taskAPath = Write-TempFile $taskDir ($taskA + '.md') $taskABody
$taskBPath = Write-TempFile $taskDir ($taskB + '.md') "# $taskB`n"
$taskCPath = Write-TempFile $taskDir ($taskC + '.md') "# $taskC`n"

Assert-True 'missing first-round BaseSha BLOCKED' (
  (Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '1', '-DryRun')).ExitCode -eq 30
)
Assert-True 'symbolic BaseSha BLOCKED' (
  (Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '1', '-DryRun', '-BaseSha', 'origin/preview/landing-01')).ExitCode -eq 30
)
Assert-True 'short BaseSha BLOCKED' (
  (Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha.Substring(0, 7))).ExitCode -eq 30
)

$r1 = Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)
Assert-True 'dry-run exit 40 (never PASS)' ($r1.ExitCode -eq 40)

$baseMeta = Join-Path $runtimeDir ($taskA + '.review-base-sha')
[void]$script:CreatedPaths.Add($baseMeta)
Assert-True 'base SHA metadata written' ((Test-Path -LiteralPath $baseMeta) -and ((Get-Content -LiteralPath $baseMeta -Raw).Trim() -eq $baseSha))

$promptFiles = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($taskA + '-r1-*-prompt.md') -ErrorAction SilentlyContinue)
Assert-True 'dry-run wrote task+round runtime prompt' ($promptFiles.Count -ge 1)
foreach ($pf in $promptFiles) { [void]$script:CreatedPaths.Add($pf.FullName) }
$promptText = [System.IO.File]::ReadAllText($promptFiles[0].FullName, $Utf8)
Assert-True 'placeholder literals in task survive' (
  $promptText.Contains('{{VERIFY_SECTION}}') -and $promptText.Contains('{{PREVIOUS_REVIEW}}')
)
Assert-True 'prompt redacts dummy sk-proj' (-not $promptText.Contains('sk-proj-THISISADUMMYVALUE'))
Assert-True 'prompt redacts hyphen/underscore sk-' (
  (-not $promptText.Contains('sk-ant-api03-DUMMYHYPHENVALUEZZZ')) -and
  (-not $promptText.Contains('sk-live_dummy_underscore_token_zzz'))
)
$nOpenAi = 'OPENAI_API_KEY=' + 'dummy_openai_key_value_001'
$nService = 'SUPABASE_SERVICE_ROLE_KEY=' + 'dummy_service_role_value_001'
$nDbPass = 'DATABASE_PASSWORD=' + 'dummy_db_pass_001'
$nGh = 'GITHUB_TOKEN=' + 'dummy_github_token_001'
$nBearer = 'Bearer ' + 'dummy_bearer_token_001'
$nDbUrl = 'dummyPass99' + '@'
Assert-True 'prompt redacts prefixed env secrets' (
  (-not $promptText.Contains($nOpenAi)) -and
  (-not $promptText.Contains($nService)) -and
  (-not $promptText.Contains($nDbPass)) -and
  (-not $promptText.Contains($nGh)) -and
  (-not $promptText.Contains($nBearer)) -and
  (-not $promptText.Contains($nDbUrl))
)
Assert-True 'prompt includes immutable base sha' ($promptText -match [regex]::Escape($baseSha))

# Round 2 without prior FAIL_FIXABLE review must BLOCK
Assert-True 'round 2 without prior review BLOCKED' (
  (Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '2', '-DryRun')).ExitCode -eq 30
)

# Plant FAIL_FIXABLE round 1 + reviewed attempt, then Round 2 may continue and must keep base
[void](Write-FakeReview $taskA 1 'FAIL_FIXABLE' $baseSha)
$r2 = Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '2', '-DryRun')
Assert-True 'round 2 after FAIL_FIXABLE allowed' ($r2.ExitCode -eq 40)
Assert-True 'base SHA unchanged across rounds' ((Get-Content -LiteralPath $baseMeta -Raw).Trim() -eq $baseSha)
$prompt2Files = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($taskA + '-r2-*-prompt.md'))
Assert-True 'round 2 prompt written' ($prompt2Files.Count -ge 1)
foreach ($pf in $prompt2Files) { [void]$script:CreatedPaths.Add($pf.FullName) }
$p2text = [System.IO.File]::ReadAllText($prompt2Files[0].FullName, $Utf8)
Assert-True 'round 2 prompt still uses locked base' ($p2text -match [regex]::Escape($baseSha))
Assert-True 'round 2 prompt includes previous review' ($p2text -match 'FAIL_FIXABLE')

# Attempt rewrite with a different valid commit on an allowed continuation round -> BLOCKED
$otherSha = (& git -C $RepoRoot rev-parse origin/main).Trim()
$rBad = Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '2', '-DryRun', '-BaseSha', $otherSha)
Assert-True 'base SHA rewrite refused (BLOCKED)' ($rBad.ExitCode -eq 30)

Assert-True 'round 4 BLOCKED' ((Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '4', '-DryRun')).ExitCode -eq 30)

# Continuation after non-FAIL_FIXABLE is refused
[void](Write-FakeReview $taskC 1 'BLOCKED' $baseSha)
$taskCMeta = Join-Path $runtimeDir ($taskC + '.review-base-sha')
[System.IO.File]::WriteAllText($taskCMeta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($taskCMeta)
Assert-True 'round 2 after BLOCKED refused' (
  (Invoke-Runner @('-TaskFile', $taskCPath, '-Round', '2', '-DryRun')).ExitCode -eq 30
)
Remove-Item -LiteralPath (Join-Path $reviewsDir ($taskC + '-round-1.json')) -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $reviewsDir ($taskC + '-round-1.attempt.json')) -Force -ErrorAction SilentlyContinue
[void](Write-FakeReview $taskC 1 'NEEDS_OWNER_DECISION' $baseSha)
Assert-True 'round 2 after NEEDS_OWNER_DECISION refused' (
  (Invoke-Runner @('-TaskFile', $taskCPath, '-Round', '2', '-DryRun')).ExitCode -eq 30
)
Remove-Item -LiteralPath (Join-Path $reviewsDir ($taskC + '-round-1.json')) -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $reviewsDir ($taskC + '-round-1.attempt.json')) -Force -ErrorAction SilentlyContinue
[void](Write-FakeReview $taskC 1 'PASS' $baseSha)
Assert-True 'round 2 after PASS refused' (
  (Invoke-Runner @('-TaskFile', $taskCPath, '-Round', '2', '-DryRun')).ExitCode -eq 30
)

# Contract-invalid prior "FAIL_FIXABLE" must not allow continuation
$taskD = 'selftest-gate-d-' + $script:SelftestId.Substring(0, 8)
$taskDPath = Write-TempFile $taskDir ($taskD + '.md') "# $taskD`n"
$taskDMeta = Join-Path $runtimeDir ($taskD + '.review-base-sha')
[System.IO.File]::WriteAllText($taskDMeta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($taskDMeta)
$badReview = Join-Path $reviewsDir ($taskD + '-round-1.json')
[System.IO.File]::WriteAllText($badReview, '{"verdict":"FAIL_FIXABLE"}' + "`n", $Utf8)
[void]$script:CreatedPaths.Add($badReview)
Assert-True 'invalid prior FAIL_FIXABLE JSON cannot continue' (
  (Invoke-Runner @('-TaskFile', $taskDPath, '-Round', '2', '-DryRun')).ExitCode -eq 30
)

# Concurrent task paths
$rb = Invoke-Runner @('-TaskFile', $taskBPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)
Assert-True 'task B dry-run ok' ($rb.ExitCode -eq 40)
$pa = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($taskA + '-r1-*-prompt.md') | ForEach-Object { $_.FullName })
$pb = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($taskB + '-r1-*-prompt.md') | ForEach-Object { $_.FullName })
Assert-True 'task A/B runtime paths differ' (($pa.Count -ge 1) -and ($pb.Count -ge 1) -and ($pa[0] -ne $pb[0]))
foreach ($p in ($pa + $pb)) { [void]$script:CreatedPaths.Add($p) }
$baseMetaB = Join-Path $runtimeDir ($taskB + '.review-base-sha')
[void]$script:CreatedPaths.Add($baseMetaB)

# Sibling path rejection for VerifyNoteFile (unique dir owned by this run)
$badDir = Join-Path $RepoRoot ('.agent\st-sib-' + $script:SelftestId)
New-Item -ItemType Directory -Force -Path $badDir | Out-Null
[void]$script:CreatedPaths.Add($badDir)
$badNote = Write-TempFile $badDir 'note.txt' 'should-not-load'

# VerifyLog / template tests need a clean task (no prior review/attempt)
$taskG = 'selftest-gate-g-' + $script:SelftestId.Substring(0, 8)
$taskGPath = Write-TempFile $taskDir ($taskG + '.md') "# $taskG`n body {{EXAMPLE}} must survive`n"

$comma = Invoke-Runner @('-TaskFile', $taskGPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha, '-VerifyLog', '.agent/runtime/a.log,.agent/runtime/b.log')
Assert-True 'comma-separated VerifyLog USAGE reject' ($comma.ExitCode -eq 2)

$log1 = Write-TempFile $runtimeDir ('vlog1-' + $script:SelftestId.Substring(0, 8) + '.log') 'VERIFY_LOG_ONE_MARKER'
$log2 = Write-TempFile $runtimeDir ('vlog2-' + $script:SelftestId.Substring(0, 8) + '.log') 'VERIFY_LOG_TWO_MARKER'
$callOut = Join-Path $script:TempRoot 'call-out.txt'
$callErr = Join-Path $script:TempRoot 'call-err.txt'
$callScript = @"
`$ErrorActionPreference = 'Continue'
& '$Runner' -TaskFile '$taskGPath' -Round 1 -DryRun -BaseSha '$baseSha' -VerifyLog @('$log1', '$log2')
exit `$LASTEXITCODE
"@
$callPath = Join-Path $script:TempRoot 'call-op.ps1'
[System.IO.File]::WriteAllText($callPath, $callScript, $Utf8)
$callProc = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $callPath) `
  -WorkingDirectory $RepoRoot -Wait -PassThru -NoNewWindow `
  -RedirectStandardOutput $callOut -RedirectStandardError $callErr
$callText = [System.IO.File]::ReadAllText($callOut, $Utf8)
Assert-True 'official call-operator VerifyLog array exit 40' ($callProc.ExitCode -eq 40)
Assert-True 'official call-operator reports VerifyLog count 2' ($callText -match 'VerifyLog count: 2')
$promptG = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($taskG + '-r1-*-prompt.md') | Sort-Object LastWriteTime -Descending)[0]
$pgText = [System.IO.File]::ReadAllText($promptG.FullName, $Utf8)
Assert-True 'both verify logs appear in prompt' (
  $pgText.Contains('VERIFY_LOG_ONE_MARKER') -and $pgText.Contains('VERIFY_LOG_TWO_MARKER')
)
Assert-True 'diff-like {{EXAMPLE}} survives in task body' ($pgText.Contains('{{EXAMPLE}}'))
[void]$script:CreatedPaths.Add((Join-Path $runtimeDir ($taskG + '.review-base-sha')))

[void](Write-FakeReview $taskB 1 'FAIL_FIXABLE' $baseSha)
$rSib = Invoke-Runner @('-TaskFile', $taskBPath, '-Round', '2', '-DryRun', '-VerifyNoteFile', $badNote)
Assert-True 'sibling VerifyNote path rejected' ($rSib.ExitCode -eq 30)

# --- attempt consumption / task terminal ---
$taskE = 'selftest-gate-e-' + $script:SelftestId.Substring(0, 8)
$taskEPath = Write-TempFile $taskDir ($taskE + '.md') "# $taskE`n"
$taskEMeta = Join-Path $runtimeDir ($taskE + '.review-base-sha')
[System.IO.File]::WriteAllText($taskEMeta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($taskEMeta)
[void](Write-FakeAttempt $taskE 1 'blocked' $baseSha)
Assert-True 'blocked attempt refuses Round 1 retry' (
  (Invoke-Runner @('-TaskFile', $taskEPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)
Assert-True 'blocked attempt refuses Round 2 on same task' (
  (Invoke-Runner @('-TaskFile', $taskEPath, '-Round', '2', '-DryRun')).ExitCode -eq 30
)
Assert-True 'blocked attempt leaves no formal review JSON' (
  -not (Test-Path -LiteralPath (Join-Path $reviewsDir ($taskE + '-round-1.json')))
)

$taskF = 'selftest-gate-f-' + $script:SelftestId.Substring(0, 8)
$taskFPath = Write-TempFile $taskDir ($taskF + '.md') "# $taskF`n"
$taskFMeta = Join-Path $runtimeDir ($taskF + '.review-base-sha')
[System.IO.File]::WriteAllText($taskFMeta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($taskFMeta)
[void](Write-FakeAttempt $taskF 1 'started' $baseSha)
Assert-True 'started attempt refuses retry (consumed)' (
  (Invoke-Runner @('-TaskFile', $taskFPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

[void](Write-FakeAttempt $taskA 3 'reviewed' $baseSha)
Assert-True 'round 4 after round 3 attempt BLOCKED' (
  (Invoke-Runner @('-TaskFile', $taskAPath, '-Round', '4', '-DryRun')).ExitCode -eq 30
)

# template-body redaction (temporary append, always restore)
$tplBackup = [System.IO.File]::ReadAllText($Prompt, $Utf8)
try {
  $inject = "`n<!-- selftest-secret sk-proj-TEMPLATEBODYDUMMYVALUE001234 -->`n<!-- postgresql://tmpl_user:tmplPass99@db.example.com/forge -->`n<!-- Authorization: Bearer tmpl_bearer_token_001 -->`n"
  [System.IO.File]::WriteAllText($Prompt, ($tplBackup + $inject), $Utf8)
  $rt = Invoke-Runner @('-TaskFile', $taskGPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)
  Assert-True 'template-inject dry-run ok' ($rt.ExitCode -eq 40)
  $tp = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($taskG + '-r1-*-prompt.md') | Sort-Object LastWriteTime -Descending)[0]
  $tt = [System.IO.File]::ReadAllText($tp.FullName, $Utf8)
  Assert-True 'template sk-proj redacted' (-not $tt.Contains('sk-proj-TEMPLATEBODYDUMMYVALUE001234'))
  $tmplPass = 'tmpl' + 'Pass99'
  $tmplBearer = 'tmpl_bearer' + '_token_001'
  Assert-True 'template postgres userinfo redacted' (-not $tt.Contains($tmplPass))
  Assert-True 'template bearer redacted' (-not $tt.Contains($tmplBearer))
  Assert-True 'template still has review structure' ($tt.Contains($baseSha))
} finally {
  [System.IO.File]::WriteAllText($Prompt, $tplBackup, $Utf8)
}

# dry-run does not create attempt marker
Assert-True 'dry-run leaves no attempt marker' (
  -not (Test-Path -LiteralPath (Join-Path $reviewsDir ($taskG + '-round-1.attempt.json')))
)

$promptTpl = [System.IO.File]::ReadAllText($Prompt, $Utf8)
Assert-True 'prompt template has required tokens' (
  $promptTpl.Contains('{{TASK_BODY}}') -and $promptTpl.Contains('{{DIFF_CONTEXT}}') -and
  $promptTpl.Contains('{{VERIFY_SECTION}}') -and $promptTpl.Contains('{{PREVIOUS_REVIEW}}') -and
  $promptTpl.Contains('{{ROUND}}')
)
Assert-True 'prompt forbids fenced output / raw JSON only' ($promptTpl -match 'raw JSON' -and $promptTpl -match 'No markdown fences')
Assert-True 'prompt PASS requires empty findings' ($promptTpl -match 'findings must be' -or $promptTpl -match 'findings.*empty')
Assert-True 'schema exists' (Test-Path -LiteralPath $Schema)

$runnerLines = @(Get-Content -LiteralPath $Runner).Count
Assert-True ("runner stays lean (actual $runnerLines max 700)") ($runnerLines -le 700)

# cleanup only this invocation's tracked paths (newest first)
for ($i = $script:CreatedPaths.Count - 1; $i -ge 0; $i--) {
  $p = $script:CreatedPaths[$i]
  if (Test-Path -LiteralPath $p) {
    Remove-Item -LiteralPath $p -Force -Recurse -ErrorAction SilentlyContinue
  }
}
# runtime prompts for this selftest id prefix
Get-ChildItem -LiteralPath $runtimeDir -Filter ('selftest-gate-*-' + $script:SelftestId.Substring(0, 8) + '*') -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath $script:TempRoot -Force -Recurse -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "cases: $($script:Passed) passed, $($script:Failed) failed"
if ($script:Failed -gt 0) { exit 1 }
exit 0
