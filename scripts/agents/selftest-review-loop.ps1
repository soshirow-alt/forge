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
  $promptTpl.Contains('{{ROUND}}') -and $promptTpl.Contains('{{REVIEW_KIND}}') -and
  $promptTpl.Contains('{{PARENT_REVIEW_HISTORY}}')
)
Assert-True 'prompt documents remediation vs Round4' (
  $promptTpl -match 'remediation' -and $promptTpl -match 'not.*Round 4'
)
Assert-True 'prompt forbids fenced output / raw JSON only' ($promptTpl -match 'raw JSON' -and $promptTpl -match 'No markdown fences')
Assert-True 'prompt PASS requires empty findings' ($promptTpl -match 'findings must be' -or $promptTpl -match 'findings.*empty')
Assert-True 'schema exists' (Test-Path -LiteralPath $Schema)
Assert-True 'remediation contract module present' (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1'))
Assert-True 'docs mention remediation re-review' (
  ((Get-Content -LiteralPath (Join-Path $RepoRoot 'docs\agent-context\cursor-codex-review-flow.md') -Raw) -match 'remediation') -and
  ((Get-Content -LiteralPath (Join-Path $RepoRoot '.cursor\rules\codex-independent-review.mdc') -Raw) -match 'remediation')
)

$runnerLines = @(Get-Content -LiteralPath $Runner).Count
Assert-True ("runner stays lean (actual $runnerLines max 820)") ($runnerLines -le 820)

# --- remediation re-review contract (dry-run) ---
$parentR = 'selftest-rem-parent-' + $script:SelftestId.Substring(0, 8)
$childR = 'selftest-rem-child-' + $script:SelftestId.Substring(0, 8)
$childR2 = 'selftest-rem-child2-' + $script:SelftestId.Substring(0, 8)
$parentPath = Write-TempFile $taskDir ($parentR + '.md') "# $parentR`nnormal parent`n"
$parentMeta = Join-Path $runtimeDir ($parentR + '.review-base-sha')
[System.IO.File]::WriteAllText($parentMeta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($parentMeta)
[void](Write-FakeReview $parentR 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentR 2 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentR 3 'FAIL_FIXABLE' $baseSha)

# Capture terminal fingerprint, then mutate a non-.agent path so remediation sees a change
. (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1')
# Minimal stubs for sourced helpers when called outside runner 窶・use runner DryRun instead for fingerprint write via file
$scratch = Join-Path $RepoRoot ('scripts\agents\selftest-scratch-' + $script:SelftestId.Substring(0, 8) + '.txt')
# Write fingerprint BEFORE scratch exists: invoke a tiny inline hash of empty-ish status by calling runner helpers through dry-run plant
$fpFile = Join-Path $runtimeDir ($parentR + '.r3-terminal-fingerprint.txt')
# Build fingerprint text similarly to runner (status excluding .agent)
$statusLines = @(& git -C $RepoRoot status --porcelain=v1 -uall | Where-Object { $_ -and $_ -notmatch '(?i)(^.. |\?\? )\.agent/' })
$fpBody = "STATUS:`n$($statusLines -join "`n")`nSTAGED:`n`nUNSTAGED:`n"
$sha = [System.Security.Cryptography.SHA256]::Create()
$fpHash = ([BitConverter]::ToString($sha.ComputeHash($Utf8.GetBytes($fpBody))) -replace '-', '').ToLowerInvariant()
$sha.Dispose()
[System.IO.File]::WriteAllText($fpFile, "task=$parentR`nfingerprint_sha256=$fpHash`n`n$fpBody`n", $Utf8)
[void]$script:CreatedPaths.Add($fpFile)

# A: after fix (scratch file), remediation Round1 dry-run allowed
[System.IO.File]::WriteAllText($scratch, "remediation-fix-$($script:SelftestId)`n", $Utf8)
[void]$script:CreatedPaths.Add($scratch)

$childBody = @"
---
review_kind: remediation
parent_task_id: $parentR
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $childR
remediation child
"@
$childPath = Write-TempFile $taskDir ($childR + '.md') $childBody
$rRem1 = Invoke-Runner @('-TaskFile', $childPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)
Assert-True 'A: remediation Round1 after R3 FAIL + diff change allowed' ($rRem1.ExitCode -eq 40)
$remPrompt = @(Get-ChildItem -LiteralPath $runtimeDir -Filter ($childR + '-r1-*-prompt.md') | Sort-Object LastWriteTime -Descending)
Assert-True 'A: remediation prompt written' ($remPrompt.Count -ge 1)
if ($remPrompt.Count -ge 1) {
  [void]$script:CreatedPaths.Add($remPrompt[0].FullName)
  $rpText = [System.IO.File]::ReadAllText($remPrompt[0].FullName, $Utf8)
  Assert-True 'A: prompt includes parent FAIL_FIXABLE history' ($rpText -match 'FAIL_FIXABLE' -and $rpText -match [regex]::Escape($parentR))
  Assert-True 'A: prompt review_kind remediation' ($rpText -match 'remediation')
}
[void]$script:CreatedPaths.Add((Join-Path $runtimeDir ($childR + '.review-base-sha')))

# Simulate real Round1 claim (dry-run does not claim)
$slotPath = Join-Path $runtimeDir ($parentR + '.remediation-child')
[System.IO.File]::WriteAllText($slotPath, $childR + "`n", $Utf8)
[void]$script:CreatedPaths.Add($slotPath)

# B/C/D: continuity of remediation rounds (dry-run only proves gate allows R1竊坦2竊坦3 after FAIL_FIXABLE)
[void](Write-FakeReview $childR 1 'FAIL_FIXABLE' $baseSha)
$rRem2 = Invoke-Runner @('-TaskFile', $childPath, '-Round', '2', '-DryRun')
Assert-True 'B/C: remediation Round2 after child R1 FAIL_FIXABLE allowed' ($rRem2.ExitCode -eq 40)
[void](Write-FakeReview $childR 2 'FAIL_FIXABLE' $baseSha)
$rRem3 = Invoke-Runner @('-TaskFile', $childPath, '-Round', '3', '-DryRun')
Assert-True 'D: remediation Round3 after child R2 FAIL_FIXABLE allowed' ($rRem3.ExitCode -eq 40)
Get-ChildItem -LiteralPath $runtimeDir -Filter ($childR + '-r*-*prompt.md') -ErrorAction SilentlyContinue |
  ForEach-Object { [void]$script:CreatedPaths.Add($_.FullName) }

# E: Round4 blocked
Assert-True 'E: Round4 blocked' ((Invoke-Runner @('-TaskFile', $childPath, '-Round', '4', '-DryRun')).ExitCode -eq 30)

# F: unchanged diff cannot open remediation (legacy path: no terminal fp + paths not dirty vs HEAD)
$parent2 = 'selftest-rem-parent2-' + $script:SelftestId.Substring(0, 8)
$parent2Path = Write-TempFile $taskDir ($parent2 + '.md') "# $parent2`n"
$parent2Meta = Join-Path $runtimeDir ($parent2 + '.review-base-sha')
[System.IO.File]::WriteAllText($parent2Meta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($parent2Meta)
[void](Write-FakeReview $parent2 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parent2 2 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parent2 3 'FAIL_FIXABLE' $baseSha)
# Intentionally NO r3-terminal-fingerprint.txt 窶・require path diffs; list only clean tracked README which is unchanged vs HEAD for this purpose... use a known clean path
$childUnchanged = 'selftest-rem-unchanged-' + $script:SelftestId.Substring(0, 8)
$unchangedBody = @"
---
review_kind: remediation
parent_task_id: $parent2
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/definitely-absent-unchanged-$($script:SelftestId.Substring(0, 8)).txt
---
# $childUnchanged
"@
$unchangedPath = Write-TempFile $taskDir ($childUnchanged + '.md') $unchangedBody
Assert-True 'F: unchanged diff remediation BLOCKED' (
  (Invoke-Runner @('-TaskFile', $unchangedPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# G: remediation without parent_task_id
$noParent = 'selftest-rem-noparent-' + $script:SelftestId.Substring(0, 8)
$noParentPath = Write-TempFile $taskDir ($noParent + '.md') "---`nreview_kind: remediation`nremediation_depth: 1`n---`n# $noParent`n"
Assert-True 'G: remediation without parent_task_id BLOCKED' (
  (Invoke-Runner @('-TaskFile', $noParentPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# H: parent not terminal (only R2)
$parentH = 'selftest-rem-early-' + $script:SelftestId.Substring(0, 8)
$parentHPath = Write-TempFile $taskDir ($parentH + '.md') "# $parentH`n"
$parentHMeta = Join-Path $runtimeDir ($parentH + '.review-base-sha')
[System.IO.File]::WriteAllText($parentHMeta, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($parentHMeta)
[void](Write-FakeReview $parentH 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentH 2 'FAIL_FIXABLE' $baseSha)
$childH = 'selftest-rem-early-child-' + $script:SelftestId.Substring(0, 8)
# mutate scratch again so path-diff path could pass if R3 existed
[System.IO.File]::WriteAllText($scratch, "early-$($script:SelftestId)`n", $Utf8)
$childHBody = @"
---
review_kind: remediation
parent_task_id: $parentH
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $childH
"@
$childHPath = Write-TempFile $taskDir ($childH + '.md') $childHBody
Assert-True 'H: parent without Round3 terminal BLOCKED' (
  (Invoke-Runner @('-TaskFile', $childHPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# I: second remediation against same parent
$child2Body = @"
---
review_kind: remediation
parent_task_id: $parentR
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $childR2
"@
# Ensure parentR fingerprint differs again after scratch rewrite
$statusLines3 = @(& git -C $RepoRoot status --porcelain=v1 -uall | Where-Object { $_ -and $_ -notmatch '(?i)(^.. |\?\? )\.agent/' })
$fpBody3 = "STATUS:`n$($statusLines3 -join "`n")`nSTAGED:`n`nUNSTAGED:`n"
$sha3 = [System.Security.Cryptography.SHA256]::Create()
$fpHash3Old = $fpHash # keep old? Slot already claimed 窶・second child must block on slot even if FP differs
$sha3.Dispose()
# Keep slot pointing at childR; update fp so only slot blocks
[System.IO.File]::WriteAllText($fpFile, "task=$parentR`nfingerprint_sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`n`nOLD`n", $Utf8)
$child2Path = Write-TempFile $taskDir ($childR2 + '.md') $child2Body
Assert-True 'I: second remediation on same parent BLOCKED' (
  (Invoke-Runner @('-TaskFile', $child2Path, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# J: OwnerApprovedRound4 bypass still absent
Assert-True 'J: OwnerApprovedRound4 bypass absent' ($runnerText -notmatch 'OwnerApprovedRound4')

# K: Fail-Blocked parent review-kind metadata must not be swallowed (task file absent)
$parentMetaOnly = 'selftest-rem-metaonly-' + $script:SelftestId.Substring(0, 8)
$parentMetaOnlyKind = Join-Path $runtimeDir ($parentMetaOnly + '.review-kind.json')
[System.IO.File]::WriteAllText($parentMetaOnlyKind, "{`"task`":`"$parentMetaOnly`",`"review_kind`":`"remediation`",`"parent_task_id`":`"x`",`"remediation_depth`":1}`n", $Utf8)
[void]$script:CreatedPaths.Add($parentMetaOnlyKind)
$parentMetaOnlyBase = Join-Path $runtimeDir ($parentMetaOnly + '.review-base-sha')
[System.IO.File]::WriteAllText($parentMetaOnlyBase, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($parentMetaOnlyBase)
[void](Write-FakeReview $parentMetaOnly 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentMetaOnly 2 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentMetaOnly 3 'FAIL_FIXABLE' $baseSha)
$fpMetaOnly = Join-Path $runtimeDir ($parentMetaOnly + '.r3-terminal-fingerprint.txt')
[System.IO.File]::WriteAllText($fpMetaOnly, "task=$parentMetaOnly`nfingerprint_sha256=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`n`nSTATUS:`n`nSTAGED:`n`nUNSTAGED:`n", $Utf8)
[void]$script:CreatedPaths.Add($fpMetaOnly)
$childMetaOnly = 'selftest-rem-metaonly-child-' + $script:SelftestId.Substring(0, 8)
$childMetaOnlyBody = @"
---
review_kind: remediation
parent_task_id: $parentMetaOnly
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $childMetaOnly
"@
$childMetaOnlyPath = Write-TempFile $taskDir ($childMetaOnly + '.md') $childMetaOnlyBody
Assert-True 'K: remediation parent via review-kind metadata alone BLOCKED' (
  (Invoke-Runner @('-TaskFile', $childMetaOnlyPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# L: malformed parent review-kind metadata 竊・fail-closed BLOCKED
$parentBadJson = 'selftest-rem-badjson-' + $script:SelftestId.Substring(0, 8)
$parentBadJsonKind = Join-Path $runtimeDir ($parentBadJson + '.review-kind.json')
[System.IO.File]::WriteAllText($parentBadJsonKind, "{not-json", $Utf8)
[void]$script:CreatedPaths.Add($parentBadJsonKind)
$parentBadJsonBase = Join-Path $runtimeDir ($parentBadJson + '.review-base-sha')
[System.IO.File]::WriteAllText($parentBadJsonBase, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($parentBadJsonBase)
[void](Write-FakeReview $parentBadJson 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentBadJson 2 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $parentBadJson 3 'FAIL_FIXABLE' $baseSha)
$fpBad = Join-Path $runtimeDir ($parentBadJson + '.r3-terminal-fingerprint.txt')
[System.IO.File]::WriteAllText($fpBad, "task=$parentBadJson`nfingerprint_sha256=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc`n`nSTATUS:`n`nSTAGED:`n`nUNSTAGED:`n", $Utf8)
[void]$script:CreatedPaths.Add($fpBad)
$childBad = 'selftest-rem-badjson-child-' + $script:SelftestId.Substring(0, 8)
$childBadBody = @"
---
review_kind: remediation
parent_task_id: $parentBadJson
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $childBad
"@
$childBadPath = Write-TempFile $taskDir ($childBad + '.md') $childBadBody
Assert-True 'L: malformed parent review-kind metadata BLOCKED' (
  (Invoke-Runner @('-TaskFile', $childBadPath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# M: missing review_kind key in parent metadata file still allows normal parent (no false allow via catch)
# Covered by K (explicit remediation kind). Also assert catch {} swallow pattern is absent.
$contractText = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1') -Raw
Assert-True 'M: Assert-ParentNotRemediationTask has no empty catch swallow' (
  $contractText -notmatch 'catch\s*\{\s*\}'
)
Assert-True 'M: Fail-Blocked on unreadable parent kind metadata' (
  $contractText -match 'review-kind metadata is unreadable/invalid JSON'
)

# N: terminal_closure single-shot dry-run after remediation R3 FAIL_FIXABLE
$normN = 'selftest-tc-norm-' + $script:SelftestId.Substring(0, 8)
$remN = 'selftest-tc-rem-' + $script:SelftestId.Substring(0, 8)
$closeN = 'selftest-tc-close-' + $script:SelftestId.Substring(0, 8)
[void](Write-TempFile $taskDir ($normN + '.md') "# $normN`n")
$normNBase = Join-Path $runtimeDir ($normN + '.review-base-sha')
[System.IO.File]::WriteAllText($normNBase, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($normNBase)
[void](Write-FakeReview $normN 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $normN 2 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $normN 3 'FAIL_FIXABLE' $baseSha)
$remNBody = @"
---
review_kind: remediation
parent_task_id: $normN
remediation_depth: 1
remediation_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $remN
"@
[void](Write-TempFile $taskDir ($remN + '.md') $remNBody)
$remNBase = Join-Path $runtimeDir ($remN + '.review-base-sha')
[System.IO.File]::WriteAllText($remNBase, $baseSha + "`n", $Utf8)
[void]$script:CreatedPaths.Add($remNBase)
[void](Write-FakeReview $remN 1 'FAIL_FIXABLE' $baseSha)
[void](Write-FakeReview $remN 2 'FAIL_FIXABLE' $baseSha)
# Plant remediation R3 with finding file anchors used by closure_finding_ids
$remNFindings = @"
{"verdict":"FAIL_FIXABLE","summary":"residual","findings":[{"severity":"medium","file":"scripts/agents/$((Split-Path -Leaf $scratch))","line":"1","issue":"x","required_fix":"y"}],"tests_required":[],"owner_decisions":[]}
"@
$remNR3 = Join-Path $reviewsDir ($remN + '-round-3.json')
[System.IO.File]::WriteAllText($remNR3, $remNFindings + "`n", $Utf8)
[void]$script:CreatedPaths.Add($remNR3)
$remNR3Att = Join-Path $reviewsDir ($remN + '-round-3.attempt.json')
[System.IO.File]::WriteAllText($remNR3Att, "{`"task`":`"$remN`",`"round`":3,`"base_sha`":`"$baseSha`",`"run_id`":`"x`",`"status`":`"reviewed`",`"reason`":`"verdict=FAIL_FIXABLE`",`"started_at`":`"t`",`"finished_at`":`"t`"}`n", $Utf8)
[void]$script:CreatedPaths.Add($remNR3Att)
# Fingerprint baseline using the same porcelain parser the runner scope-lock uses
$RuntimeDir = $runtimeDir
function Fail-Blocked([string]$Message) { throw $Message }
function Invoke-Git { param([string[]]$GitArgs) & git -C $RepoRoot @GitArgs }
function Read-Utf8File([string]$Path) { [System.IO.File]::ReadAllText($Path, $Utf8) }
function Write-Utf8File([string]$Path, [string]$Content) {
  $d = Split-Path -Parent $Path
  if ($d -and -not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8)
}
. (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1')
$entsN = @(Get-PorcelainEntriesExcludingAgent)
$statusLines = New-Object System.Collections.Generic.List[string]
foreach ($e in $entsN) {
  if ($null -eq $e) { continue }
  [void]$statusLines.Add(('{0} {1}' -f [string]$e.xy, [string]$e.path))
}
$fpBodyN = "STATUS:`n$([string]::Join("`n", $statusLines.ToArray()))`nSTAGED:`n`nUNSTAGED:`n"
$shaN = [System.Security.Cryptography.SHA256]::Create()
$fpHashN = ([BitConverter]::ToString($shaN.ComputeHash($Utf8.GetBytes($fpBodyN))) -replace '-', '').ToLowerInvariant()
$shaN.Dispose()
$fpN = Join-Path $runtimeDir ($remN + '.r3-terminal-fingerprint.txt')
[System.IO.File]::WriteAllText($fpN, "task=$remN`nfingerprint_sha256=$fpHashN`n`n$fpBodyN`n", $Utf8)
[void]$script:CreatedPaths.Add($fpN)
$fpParsed = @(Get-FingerprintStatusPaths $fpN)
$curPaths = @($entsN | ForEach-Object { [string]$_.path })
$overlap = @($fpParsed | Where-Object { $curPaths -contains $_ })
Assert-True 'N preflight: fingerprint STATUS non-empty' ($fpParsed.Count -ge 1)
Assert-True 'N preflight: fingerprint overlaps porcelain' ($overlap.Count -ge 1)
# Mutate allowlisted scratch so closure_changed_paths differ from HEAD
[System.IO.File]::WriteAllText($scratch, "closure-$($script:SelftestId)`n", $Utf8)
$closeBody = @"
---
review_kind: terminal_closure
parent_task_id: $normN
remediation_parent_task_id: $remN
closure_depth: 1
closure_finding_ids:
  - scripts/agents/$((Split-Path -Leaf $scratch))
closure_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $closeN
terminal closure
"@
$closePath = Write-TempFile $taskDir ($closeN + '.md') $closeBody
$rClose = Invoke-Runner @('-TaskFile', $closePath, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)
if ($rClose.ExitCode -ne 40) {
  $errTxt = if (Test-Path -LiteralPath $rClose.Err) { [System.IO.File]::ReadAllText($rClose.Err, $Utf8) } else { '' }
  $outTxt = if (Test-Path -LiteralPath $rClose.Out) { [System.IO.File]::ReadAllText($rClose.Out, $Utf8) } else { '' }
  Write-Host ("N debug exit=" + $rClose.ExitCode)
  Write-Host ("N debug err=" + $errTxt)
  Write-Host ("N debug out=" + $outTxt)
}
Assert-True 'N: terminal_closure dry-run allowed after rem R3' ($rClose.ExitCode -eq 40)

# O: second terminal_closure on same remediation parent BLOCKED
$closeSlot = Join-Path $runtimeDir ($remN + '.terminal-closure-child')
[System.IO.File]::WriteAllText($closeSlot, $closeN + "`n", $Utf8)
[void]$script:CreatedPaths.Add($closeSlot)
$close2 = 'selftest-tc-close2-' + $script:SelftestId.Substring(0, 8)
$close2Body = @"
---
review_kind: terminal_closure
parent_task_id: $normN
remediation_parent_task_id: $remN
closure_depth: 1
closure_finding_ids:
  - scripts/agents/$((Split-Path -Leaf $scratch))
closure_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $close2
"@
$close2Path = Write-TempFile $taskDir ($close2 + '.md') $close2Body
Assert-True 'O: second terminal_closure BLOCKED' (
  (Invoke-Runner @('-TaskFile', $close2Path, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# P: terminal_closure Round 2 refused
Assert-True 'P: terminal_closure Round2 BLOCKED' (
  (Invoke-Runner @('-TaskFile', $closePath, '-Round', '2', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)

# Q: unrelated new path outside closure allowlist BLOCKED
$unrelated = Join-Path $RepoRoot ('scripts\agents\selftest-unrelated-' + $script:SelftestId.Substring(0, 8) + '.txt')
[System.IO.File]::WriteAllText($unrelated, "nope`n", $Utf8)
[void]$script:CreatedPaths.Add($unrelated)
# Clear closure slot so contract reaches scope lock
Remove-Item -LiteralPath $closeSlot -Force -ErrorAction SilentlyContinue
$close3 = 'selftest-tc-scope-' + $script:SelftestId.Substring(0, 8)
$close3Body = @"
---
review_kind: terminal_closure
parent_task_id: $normN
remediation_parent_task_id: $remN
closure_depth: 1
closure_finding_ids:
  - scripts/agents/$((Split-Path -Leaf $scratch))
closure_changed_paths:
  - scripts/agents/$((Split-Path -Leaf $scratch))
---
# $close3
"@
$close3Path = Write-TempFile $taskDir ($close3 + '.md') $close3Body
Assert-True 'Q: terminal_closure unrelated new path BLOCKED' (
  (Invoke-Runner @('-TaskFile', $close3Path, '-Round', '1', '-DryRun', '-BaseSha', $baseSha)).ExitCode -eq 30
)
Remove-Item -LiteralPath $unrelated -Force -ErrorAction SilentlyContinue

Assert-True 'prompt documents terminal_closure' ($promptTpl -match 'terminal_closure')
Assert-True 'runner claims terminal closure slot' ($runnerText -match 'Claim-TerminalClosureSlot')
Assert-True 'runner end-checks closure scope baseline' ($runnerText -match 'Assert-ClosureScopeBaselineHeld')
Assert-True 'contract content-hashes out-of-scope paths' (
  $contractText -match 'Build-OutOfScopeClosureSnapshot' -and $contractText -match 'Get-RelPathContentSha256'
)

# --- Scope-lock content-hash unit cases (A窶笛); synthetic snapshots + one real Build check ---
function Fail-Blocked([string]$Message) { throw $Message }
function Invoke-Git { param([string[]]$GitArgs) & git -C $RepoRoot @GitArgs }
function Read-Utf8File([string]$Path) { [System.IO.File]::ReadAllText($Path, $Utf8) }
function Write-Utf8File([string]$Path, [string]$Content) {
  $d = Split-Path -Parent $Path
  if ($d -and -not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8)
}
. (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1')

function New-ScopeEntry([string]$Path, [string]$Sha, [string]$Xy = '??') {
  return @{ path = $Path; xy = $Xy; sha256 = $Sha; rename_from = ''; rename_to = '' }
}

$baseOutside = 'components/games-provider.tsx'
$baseAllow = 'scripts/agents/codex-remediation-contract.ps1'
$snapClean = @{
  $baseOutside = (New-ScopeEntry $baseOutside 'aaa111' ' M')
  'scripts/staging-only/player-ia-staging-seed-cleanup.sql' = (New-ScopeEntry 'scripts/staging-only/player-ia-staging-seed-cleanup.sql' 'crlf000' ' M')
}

# B: unchanged content 竊・PASS
$blockedB = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapClean 'B' } catch { $blockedB = $true }
Assert-True 'B: unchanged out-of-scope content PASS' (-not $blockedB)

# A/F: already-dirty out-of-scope content change 竊・BLOCK
$snapDirty = @{
  $baseOutside = (New-ScopeEntry $baseOutside 'bbb222' ' M')
  'scripts/staging-only/player-ia-staging-seed-cleanup.sql' = (New-ScopeEntry 'scripts/staging-only/player-ia-staging-seed-cleanup.sql' 'crlf000' ' M')
}
$blockedA = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapDirty 'A' } catch { $blockedA = $true }
Assert-True 'A/F: dirty out-of-scope content change BLOCK' ($blockedA)

# C: out-of-scope path added 竊・BLOCK
$snapAdd = @{
  $baseOutside = (New-ScopeEntry $baseOutside 'aaa111' ' M')
  'scripts/staging-only/player-ia-staging-seed-cleanup.sql' = (New-ScopeEntry 'scripts/staging-only/player-ia-staging-seed-cleanup.sql' 'crlf000' ' M')
  'components/extra-out-of-scope.tsx' = (New-ScopeEntry 'components/extra-out-of-scope.tsx' 'ccc333' '??')
}
$blockedC = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapAdd 'C' } catch { $blockedC = $true }
Assert-True 'C: out-of-scope path added BLOCK' ($blockedC)

# D: out-of-scope path deleted 竊・BLOCK
$snapDel = @{
  'scripts/staging-only/player-ia-staging-seed-cleanup.sql' = (New-ScopeEntry 'scripts/staging-only/player-ia-staging-seed-cleanup.sql' 'crlf000' ' M')
}
$blockedD = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapDel 'D' } catch { $blockedD = $true }
Assert-True 'D: out-of-scope path deleted BLOCK' ($blockedD)

# E: out-of-scope rename 竊・BLOCK
$snapRen = @{
  'components/games-provider-renamed.tsx' = @{ path = 'components/games-provider-renamed.tsx'; xy = 'R '; sha256 = 'aaa111'; rename_from = $baseOutside; rename_to = '' }
  'scripts/staging-only/player-ia-staging-seed-cleanup.sql' = (New-ScopeEntry 'scripts/staging-only/player-ia-staging-seed-cleanup.sql' 'crlf000' ' M')
}
$blockedE = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapRen 'E' } catch { $blockedE = $true }
Assert-True 'E: out-of-scope rename/move BLOCK' ($blockedE)

# G: CRLF-known dirty unchanged 竊・PASS
$blockedG = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapClean 'G' } catch { $blockedG = $true }
Assert-True 'G: CRLF dirty unchanged PASS' (-not $blockedG)

# H: allowlisted-only change does not appear in out-of-scope snapshots 竊・PASS
# (modeled as identical out-of-scope maps while allow path would differ outside this snapshot)
$blockedH = $false
try { Assert-OutOfScopeSnapshotsEqual $snapClean $snapClean 'H' } catch { $blockedH = $true }
Assert-True 'H: allowlisted-only change keeps out-of-scope equal' (-not $blockedH)

# I: hash mismatch 竊・BLOCK
$blockedI = $false
try {
  $fakeBase = @{ 'scripts/agents/ghost.txt' = (New-ScopeEntry 'scripts/agents/ghost.txt' 'abc') }
  $fakeCur = @{ 'scripts/agents/ghost.txt' = (New-ScopeEntry 'scripts/agents/ghost.txt' 'MISSING') }
  Assert-OutOfScopeSnapshotsEqual $fakeBase $fakeCur 'I'
} catch { $blockedI = $true }
Assert-True 'I: hash/fingerprint mismatch or missing treated fail-closed BLOCK' ($blockedI)

# J: parser/IO exception fail-closed BLOCK
$badJson = Join-Path $runtimeDir ('selftest-scope-badjson-' + $script:SelftestId.Substring(0, 8) + '.json')
[System.IO.File]::WriteAllText($badJson, '{not-json', $Utf8)
[void]$script:CreatedPaths.Add($badJson)
$blockedJ = $false
try { [void](Read-ScopeSnapshotFromJson $badJson) } catch { $blockedJ = $true }
Assert-True 'J: parser/IO exception fail-closed BLOCK' ($blockedJ)

# Real Build: allowlisted path excluded; known dirty out-of-scope path included
$realSnap = Build-OutOfScopeClosureSnapshot @($baseAllow)
Assert-True 'scope real Build excludes allowlisted path' (-not $realSnap.ContainsKey($baseAllow))
Assert-True 'scope real Build includes out-of-scope dirty paths' ($realSnap.Count -ge 1)

Assert-True 'replacement claim uses CreateNew exclusive helper' (
  $contractText -match 'Write-Utf8FileCreateNewExclusive' -and
  $contractText -match 'FileMode\]::CreateNew'
)

# --- Real Git E2E (isolated temp repo; production working tree untouched) ---
$prodRepoRootForE2E = $RepoRoot
$prodRuntimeForE2E = $RuntimeDir
$e2eRoot = Join-Path $script:TempRoot 'e2e-git-repo'
New-Item -ItemType Directory -Force -Path $e2eRoot | Out-Null

function Invoke-E2EGit([string[]]$GitArgs) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $out = & git -C $e2eRoot @GitArgs 2>&1
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) {
    throw ("e2e git failed: git " + ($GitArgs -join ' ') + " exit=$code :: " + (($out | Out-String).Trim()))
  }
  return $out
}

# init before creating nested dirs so this is a real git work tree
Invoke-E2EGit -GitArgs @('init')
Invoke-E2EGit -GitArgs @('config', '--local', 'user.email', 'selftest@forge.local')
Invoke-E2EGit -GitArgs @('config', '--local', 'user.name', 'Forge Selftest')
Invoke-E2EGit -GitArgs @('config', '--local', 'core.autocrlf', 'false')
$e2eRuntime = Join-Path $e2eRoot '.agent\runtime'
New-Item -ItemType Directory -Force -Path $e2eRuntime | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $e2eRoot '.agent\tasks') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $e2eRoot '.agent\reviews') | Out-Null
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'allow.txt'), "allow-v1`n", $Utf8)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-v1`n", $Utf8)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'rename-src.txt'), "rename-body`n", $Utf8)
Invoke-E2EGit -GitArgs @('add', 'allow.txt', 'outside.txt', 'rename-src.txt')
Invoke-E2EGit -GitArgs @('commit', '-m', 'e2e-init')

$RepoRoot = $e2eRoot
$RuntimeDir = $e2eRuntime
function Fail-Blocked([string]$Message) { throw $Message }
function Invoke-Git { param([string[]]$GitArgs) & git -C $RepoRoot @GitArgs }
function Read-Utf8File([string]$Path) { [System.IO.File]::ReadAllText($Path, $Utf8) }
function Write-Utf8File([string]$Path, [string]$Content) {
  $d = Split-Path -Parent $Path
  if ($d -and -not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8)
}
. (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1')

$e2eAllow = @('allow.txt')
$e2eStem = 'e2e-scope-stem'

# Ensure allowlist path is dirty so terminal_closure path-changed gate can pass when needed
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'allow.txt'), "allow-v2`n", $Utf8)

# A: clean tracked outside 竊・modify after baseline 竊・BLOCK
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-v1`n", $Utf8)
Invoke-E2EGit -GitArgs @('checkout', '--', 'outside.txt')
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-A') -AllowPaths $e2eAllow)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-A-changed`n", $Utf8)
$blockedE2EA = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-A') -AllowPaths $e2eAllow } catch { $blockedE2EA = $true }
Assert-True 'E2E A: clean tracked then out-of-scope modify BLOCK' ($blockedE2EA)

# B: pre-dirty tracked 竊・further content change 竊・BLOCK
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-dirty-start`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-B') -AllowPaths $e2eAllow)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-dirty-then-changed`n", $Utf8)
$blockedE2EB = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-B') -AllowPaths $e2eAllow } catch { $blockedE2EB = $true }
Assert-True 'E2E B: pre-dirty tracked further change BLOCK' ($blockedE2EB)

# C: pre-dirty tracked 竊・content unchanged 竊・PASS
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-dirty-stable`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-C') -AllowPaths $e2eAllow)
$blockedE2EC = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-C') -AllowPaths $e2eAllow } catch { $blockedE2EC = $true }
Assert-True 'E2E C: pre-dirty tracked unchanged PASS' (-not $blockedE2EC)

# D: pre-existing untracked 竊・content change 竊・BLOCK
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'untracked.txt'), "ut-v1`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-D') -AllowPaths $e2eAllow)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'untracked.txt'), "ut-v2`n", $Utf8)
$blockedE2ED = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-D') -AllowPaths $e2eAllow } catch { $blockedE2ED = $true }
Assert-True 'E2E D: pre-existing untracked content change BLOCK' ($blockedE2ED)

# E: pre-existing untracked 竊・unchanged 竊・PASS
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'untracked.txt'), "ut-stable`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-E') -AllowPaths $e2eAllow)
$blockedE2EE = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-E') -AllowPaths $e2eAllow } catch { $blockedE2EE = $true }
Assert-True 'E2E E: pre-existing untracked unchanged PASS' (-not $blockedE2EE)

# F: new untracked out-of-scope added 竊・BLOCK
Remove-Item -LiteralPath (Join-Path $e2eRoot 'untracked.txt') -Force -ErrorAction SilentlyContinue
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-for-F`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-F') -AllowPaths $e2eAllow)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'brand-new-untracked.txt'), "new`n", $Utf8)
$blockedE2EF = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-F') -AllowPaths $e2eAllow } catch { $blockedE2EF = $true }
Assert-True 'E2E F: new untracked out-of-scope added BLOCK' ($blockedE2EF)
Remove-Item -LiteralPath (Join-Path $e2eRoot 'brand-new-untracked.txt') -Force -ErrorAction SilentlyContinue

# G: out-of-scope file deleted 竊・BLOCK
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-for-G`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-G') -AllowPaths $e2eAllow)
Remove-Item -LiteralPath (Join-Path $e2eRoot 'outside.txt') -Force
$blockedE2EG = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-G') -AllowPaths $e2eAllow } catch { $blockedE2EG = $true }
Assert-True 'E2E G: out-of-scope file deleted BLOCK' ($blockedE2EG)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-restored`n", $Utf8)

# H: rename 竊・BLOCK
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'rename-src.txt'), "rename-body`n", $Utf8)
Invoke-E2EGit -GitArgs @('add', 'rename-src.txt')
Invoke-E2EGit -GitArgs @('checkout', '--', 'rename-src.txt')
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'rename-src.txt'), "rename-dirty`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-H') -AllowPaths $e2eAllow)
Invoke-E2EGit -GitArgs @('mv', 'rename-src.txt', 'rename-dst.txt')
$blockedE2EH = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-H') -AllowPaths $e2eAllow } catch { $blockedE2EH = $true }
Assert-True 'E2E H: out-of-scope rename BLOCK' ($blockedE2EH)
if (Test-Path -LiteralPath (Join-Path $e2eRoot 'rename-dst.txt')) {
  Invoke-E2EGit -GitArgs @('mv', 'rename-dst.txt', 'rename-src.txt')
}
Invoke-E2EGit -GitArgs @('checkout', '--', 'rename-src.txt')

# I: byte-level CRLF/LF change 竊・BLOCK
[System.IO.File]::WriteAllBytes((Join-Path $e2eRoot 'outside.txt'), [byte[]](0x6f, 0x75, 0x74, 0x0a)) # "out\n"
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-I') -AllowPaths $e2eAllow)
[System.IO.File]::WriteAllBytes((Join-Path $e2eRoot 'outside.txt'), [byte[]](0x6f, 0x75, 0x74, 0x0d, 0x0a)) # "out\r\n"
$blockedE2EI = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-I') -AllowPaths $e2eAllow } catch { $blockedE2EI = $true }
Assert-True 'E2E I: CRLF/LF byte content change BLOCK' ($blockedE2EI)

# J: allowed scope only changes 竊・PASS
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'outside.txt'), "outside-stable-J`n", $Utf8)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'allow.txt'), "allow-before-J`n", $Utf8)
[void](Write-ClosureScopeBaseline -TaskStem ($e2eStem + '-J') -AllowPaths $e2eAllow)
[System.IO.File]::WriteAllText((Join-Path $e2eRoot 'allow.txt'), "allow-after-J`n", $Utf8)
$blockedE2EJ = $false
try { Assert-ClosureScopeBaselineHeld -TaskStem ($e2eStem + '-J') -AllowPaths $e2eAllow } catch { $blockedE2EJ = $true }
Assert-True 'E2E J: allowlisted-only change PASS' (-not $blockedE2EJ)

# K: concurrent replacement claim 窶・exactly one winner
$remK = 'e2e-rem-concurrent'
$invFirst = 'e2e-first-closure'
$childA = 'e2e-repl-child-A'
$childB = 'e2e-repl-child-B'
Write-Utf8File (Get-TerminalClosureChildPath $remK) ($invFirst + "`n")
Write-Utf8File (Get-ClosureInvalidationPath $invFirst) ("INVALIDATED_BY_REVIEW_HARNESS_DEFECT`n")
$workerPs1 = Join-Path $script:TempRoot 'claim-worker.ps1'
$workerBody = @'
param(
  [string]$RepoRoot,
  [string]$RuntimeDir,
  [string]$ContractPath,
  [string]$RemediationStem,
  [string]$ChildStem,
  [string]$ReplacesTaskId,
  [string]$OutFile
)
$ErrorActionPreference = 'Stop'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
function Fail-Blocked([string]$Message) {
  [System.IO.File]::WriteAllText($OutFile, ('BLOCKED:' + $Message), $Utf8)
  exit 30
}
function Read-Utf8File([string]$Path) { [System.IO.File]::ReadAllText($Path, $Utf8) }
function Write-Utf8File([string]$Path, [string]$Content) {
  $d = Split-Path -Parent $Path
  if ($d -and -not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8)
}
function Invoke-Git { param([string[]]$GitArgs) & git -C $RepoRoot @GitArgs }
. $ContractPath
Claim-TerminalClosureSlot -RemediationStem $RemediationStem -ChildStem $ChildStem -ReplacesTaskId $ReplacesTaskId
[System.IO.File]::WriteAllText($OutFile, 'OK', $Utf8)
exit 0
'@
[System.IO.File]::WriteAllText($workerPs1, $workerBody, $Utf8)
$outA = Join-Path $script:TempRoot 'claim-A.txt'
$outB = Join-Path $script:TempRoot 'claim-B.txt'
$pA = Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $workerPs1,
  '-RepoRoot', $e2eRoot, '-RuntimeDir', $e2eRuntime, '-ContractPath', (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1'),
  '-RemediationStem', $remK, '-ChildStem', $childA, '-ReplacesTaskId', $invFirst, '-OutFile', $outA
) -WorkingDirectory $e2eRoot -PassThru -WindowStyle Hidden
$pB = Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $workerPs1,
  '-RepoRoot', $e2eRoot, '-RuntimeDir', $e2eRuntime, '-ContractPath', (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1'),
  '-RemediationStem', $remK, '-ChildStem', $childB, '-ReplacesTaskId', $invFirst, '-OutFile', $outB
) -WorkingDirectory $e2eRoot -PassThru -WindowStyle Hidden
Wait-Process -Id $pA.Id -ErrorAction SilentlyContinue
Wait-Process -Id $pB.Id -ErrorAction SilentlyContinue
$resA = if (Test-Path -LiteralPath $outA) { (Get-Content -LiteralPath $outA -Raw) } else { 'MISSING' }
$resB = if (Test-Path -LiteralPath $outB) { (Get-Content -LiteralPath $outB -Raw) } else { 'MISSING' }
$okCount = @(@($resA, $resB) | ForEach-Object { $_.Trim() } | Where-Object { $_ -eq 'OK' })
$blockCount = @(@($resA, $resB) | ForEach-Object { $_.Trim() } | Where-Object { $_ -like 'BLOCKED:*' })
$markerK = (Read-Utf8File (Get-TerminalClosureReplacementPath $remK)).Trim()
$slotK = (Read-Utf8File (Get-TerminalClosureChildPath $remK)).Trim()
$winnerOk = ($okCount.Count -eq 1) -and ($blockCount.Count -eq 1) -and
  ($markerK -eq $slotK) -and (($markerK -eq $childA) -or ($markerK -eq $childB))
Assert-True 'E2E K: concurrent replacement claim exactly one winner' $winnerOk

# Second different task ID on same lineage must BLOCK
$blockedSecond = $false
try {
  Claim-TerminalClosureSlot -RemediationStem $remK -ChildStem 'e2e-repl-child-C' -ReplacesTaskId $invFirst
} catch { $blockedSecond = $true }
Assert-True 'E2E Kb: second replacement task id on same lineage BLOCK' ($blockedSecond)

# Same winner idempotent reclaim PASS
$blockedIdem = $false
try {
  Claim-TerminalClosureSlot -RemediationStem $remK -ChildStem $markerK -ReplacesTaskId $invFirst
} catch { $blockedIdem = $true }
Assert-True 'E2E Kc: same-child replacement reclaim idempotent PASS' (-not $blockedIdem)

# Restore production RepoRoot / RuntimeDir bindings for any later helpers
$RepoRoot = $prodRepoRootForE2E
$RuntimeDir = $prodRuntimeForE2E
function Fail-Blocked([string]$Message) { throw $Message }
function Invoke-Git { param([string[]]$GitArgs) & git -C $RepoRoot @GitArgs }
function Read-Utf8File([string]$Path) { [System.IO.File]::ReadAllText($Path, $Utf8) }
function Write-Utf8File([string]$Path, [string]$Content) {
  $d = Split-Path -Parent $Path
  if ($d -and -not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Content, $Utf8)
}
. (Join-Path $PSScriptRoot 'codex-remediation-contract.ps1')

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
Get-ChildItem -LiteralPath $runtimeDir -Filter ('selftest-rem-*-' + $script:SelftestId.Substring(0, 8) + '*') -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse -ErrorAction SilentlyContinue }
Get-ChildItem -LiteralPath $runtimeDir -Filter ('selftest-tc-*-' + $script:SelftestId.Substring(0, 8) + '*') -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse -ErrorAction SilentlyContinue }
Get-ChildItem -LiteralPath $reviewsDir -Filter ('selftest-*-' + $script:SelftestId.Substring(0, 8) + '*') -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse -ErrorAction SilentlyContinue }
Get-ChildItem -LiteralPath $taskDir -Filter ('selftest-*-' + $script:SelftestId.Substring(0, 8) + '*') -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath $script:TempRoot -Force -Recurse -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "cases: $($script:Passed) passed, $($script:Failed) failed"
if ($script:Failed -gt 0) { exit 1 }
exit 0
