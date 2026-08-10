#requires -Version 5.1
<#
.SYNOPSIS
  Remediation re-review contract helpers for the Codex gate.
  Dot-sourced by run-codex-review.ps1. Not a standalone entrypoint.
#>

function Get-ReviewKindMetaPath([string]$TaskStem) {
  return (Join-Path $RuntimeDir ($TaskStem + '.review-kind.json'))
}

function Get-RemediationChildPath([string]$ParentStem) {
  return (Join-Path $RuntimeDir ($ParentStem + '.remediation-child'))
}

function Get-TerminalClosureChildPath([string]$RemediationStem) {
  return (Join-Path $RuntimeDir ($RemediationStem + '.terminal-closure-child'))
}

function Get-TerminalFingerprintPath([string]$TaskStem) {
  return (Join-Path $RuntimeDir ($TaskStem + '.r3-terminal-fingerprint.txt'))
}

function Get-FingerprintHash([string]$FingerprintText) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = $Utf8.GetBytes([string]$FingerprintText)
    $hash = $sha.ComputeHash($bytes)
    return ([BitConverter]::ToString($hash) -replace '-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Write-TerminalFingerprint([string]$TaskStem) {
  $fp = Get-TreeFingerprint
  $hash = Get-FingerprintHash $fp
  $body = @"
task=$TaskStem
captured_at=$((Get-Date).ToUniversalTime().ToString('o'))
fingerprint_sha256=$hash

$fp
"@
  Write-Utf8File (Get-TerminalFingerprintPath $TaskStem) ($body.TrimEnd() + "`n")
}

function Read-TerminalFingerprintHash([string]$TaskStem) {
  $path = Get-TerminalFingerprintPath $TaskStem
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  $text = Read-Utf8File $path
  if ($text -match '(?m)^fingerprint_sha256=([0-9a-f]{64})\s*$') {
    return $Matches[1]
  }
  return (Get-FingerprintHash $text)
}

function Parse-TaskReviewMeta([string]$TaskPath) {
  $raw = Read-Utf8File $TaskPath
  $meta = @{
    review_kind                 = 'normal'
    parent_task_id              = ''
    remediation_parent_task_id  = ''
    remediation_depth           = 0
    closure_depth               = 0
    replaces_task_id            = ''
    replacement_reason          = ''
    remediation_changed_paths   = @()
    related_blocked_task_ids    = @()
    closure_finding_ids         = @()
    closure_changed_paths       = @()
  }
  if ($raw -notmatch '(?s)\A---\r?\n(.*?)\r?\n---\r?\n') {
    return $meta
  }
  $yaml = $Matches[1]
  foreach ($line in ($yaml -split '\r?\n')) {
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
    if ($line -match '^\s*review_kind\s*:\s*(\S+)\s*$') {
      $meta.review_kind = $Matches[1].Trim().ToLowerInvariant()
      continue
    }
    if ($line -match '^\s*parent_task_id\s*:\s*(.+?)\s*$') {
      $meta.parent_task_id = $Matches[1].Trim()
      continue
    }
    if ($line -match '^\s*remediation_parent_task_id\s*:\s*(.+?)\s*$') {
      $meta.remediation_parent_task_id = $Matches[1].Trim()
      continue
    }
    if ($line -match '^\s*replaces_task_id\s*:\s*(.+?)\s*$') {
      $meta.replaces_task_id = $Matches[1].Trim()
      continue
    }
    if ($line -match '^\s*replacement_reason\s*:\s*(.+?)\s*$') {
      $meta.replacement_reason = $Matches[1].Trim()
      continue
    }
    if ($line -match '^\s*remediation_depth\s*:\s*(\d+)\s*$') {
      $meta.remediation_depth = [int]$Matches[1]
      continue
    }
    if ($line -match '^\s*closure_depth\s*:\s*(\d+)\s*$') {
      $meta.closure_depth = [int]$Matches[1]
      continue
    }
    if ($line -match '^\s*-\s+(.+?)\s*$') {
      continue
    }
  }
  $inChanged = $false
  $inRelated = $false
  $inFindings = $false
  $inClosurePaths = $false
  $changed = New-Object System.Collections.Generic.List[string]
  $related = New-Object System.Collections.Generic.List[string]
  $findings = New-Object System.Collections.Generic.List[string]
  $closurePaths = New-Object System.Collections.Generic.List[string]
  foreach ($line in ($yaml -split '\r?\n')) {
    if ($line -match '^\s*remediation_changed_paths\s*:\s*$') { $inChanged = $true; $inRelated = $false; $inFindings = $false; $inClosurePaths = $false; continue }
    if ($line -match '^\s*related_blocked_task_ids\s*:\s*$') { $inRelated = $true; $inChanged = $false; $inFindings = $false; $inClosurePaths = $false; continue }
    if ($line -match '^\s*closure_finding_ids\s*:\s*$') { $inFindings = $true; $inChanged = $false; $inRelated = $false; $inClosurePaths = $false; continue }
    if ($line -match '^\s*closure_changed_paths\s*:\s*$') { $inClosurePaths = $true; $inChanged = $false; $inRelated = $false; $inFindings = $false; continue }
    if ($line -match '^\s*[a-z_]+\s*:') { $inChanged = $false; $inRelated = $false; $inFindings = $false; $inClosurePaths = $false }
    if ($line -match '^\s*remediation_changed_paths\s*:\s*\[(.*)\]\s*$') {
      foreach ($p in ($Matches[1] -split ',')) {
        $t = $p.Trim().Trim("'").Trim('"')
        if ($t) { [void]$changed.Add($t) }
      }
      continue
    }
    if ($inChanged -and $line -match '^\s*-\s+(.+?)\s*$') {
      [void]$changed.Add($Matches[1].Trim().Trim("'").Trim('"'))
      continue
    }
    if ($inRelated -and $line -match '^\s*-\s+(.+?)\s*$') {
      [void]$related.Add($Matches[1].Trim().Trim("'").Trim('"'))
      continue
    }
    if ($inFindings -and $line -match '^\s*-\s+(.+?)\s*$') {
      [void]$findings.Add($Matches[1].Trim().Trim("'").Trim('"'))
      continue
    }
    if ($inClosurePaths -and $line -match '^\s*-\s+(.+?)\s*$') {
      [void]$closurePaths.Add($Matches[1].Trim().Trim("'").Trim('"'))
      continue
    }
  }
  $meta.remediation_changed_paths = @($changed)
  $meta.related_blocked_task_ids = @($related)
  $meta.closure_finding_ids = @($findings)
  $meta.closure_changed_paths = @($closurePaths)
  $allowedKinds = @('normal', 'remediation', 'terminal_closure')
  if ($allowedKinds -notcontains $meta.review_kind) {
    Fail-Blocked "Task review_kind must be 'normal', 'remediation', or 'terminal_closure' (got '$($meta.review_kind)')."
  }
  return $meta
}

function Test-PathChangedVsHead([string]$RelPath) {
  $rel = $RelPath -replace '\\', '/'
  try {
    $diff = (Invoke-Git -GitArgs @('diff', 'HEAD', '--', $rel)).Trim()
    if ($diff) { return $true }
  } catch {
    # Path probe failed; continue to status probe (do not treat as changed).
  }
  try {
    $status = (Invoke-Git -GitArgs @('status', '--porcelain=v1', '-uall', '--', $rel)).Trim()
    if ($status) { return $true }
  } catch {
    # Path probe failed; caller treats false as unchanged.
  }
  return $false
}

function Assert-ParentRound3TerminalFailFixable([string]$ParentStem) {
  $r3 = Get-ReviewPath $ParentStem 3
  if (-not (Test-Path -LiteralPath $r3)) {
    Fail-Blocked "Remediation refused: parent '$ParentStem' has no Round 3 formal review (not terminal)."
  }
  if ((Invoke-ValidateReviewFile $r3) -ne 0) {
    Fail-Blocked "Remediation refused: parent Round 3 review failed schema validation: $r3"
  }
  $obj = Get-Content -LiteralPath $r3 -Raw -Encoding UTF8 | ConvertFrom-Json
  $verdict = [string]$obj.verdict
  if ($verdict -ne 'FAIL_FIXABLE') {
    Fail-Blocked "Remediation refused: parent Round 3 verdict must be FAIL_FIXABLE (got '$verdict')."
  }
  $att = Get-AttemptPath $ParentStem 3
  $st = Read-AttemptStatus $att
  if ($st -ne 'reviewed') {
    Fail-Blocked "Remediation refused: parent Round 3 attempt status must be reviewed (got '$st')."
  }
  # Ensure Round 4 is not somehow open on parent
  if ((Test-Path -LiteralPath (Get-ReviewPath $ParentStem 4)) -or (Test-Path -LiteralPath (Get-AttemptPath $ParentStem 4))) {
    Fail-Blocked "Remediation refused: parent unexpectedly has Round 4 artifacts."
  }
}

function Assert-ParentNotRemediationTask([string]$ParentStem) {
  $parentTask = Join-Path (Join-Path $RepoRoot '.agent\tasks') ($ParentStem + '.md')
  if (Test-Path -LiteralPath $parentTask) {
    $pm = Parse-TaskReviewMeta $parentTask
    if ($pm.review_kind -eq 'remediation' -or $pm.review_kind -eq 'terminal_closure') {
      Fail-Blocked "Remediation chaining refused: parent '$ParentStem' is itself a remediation/closure task."
    }
  }
  $kindMeta = Get-ReviewKindMetaPath $ParentStem
  if (Test-Path -LiteralPath $kindMeta) {
    $rawMeta = $null
    try {
      $rawMeta = Get-Content -LiteralPath $kindMeta -Raw -Encoding UTF8
      $km = $rawMeta | ConvertFrom-Json
    } catch {
      Fail-Blocked "Remediation refused: parent '$ParentStem' review-kind metadata is unreadable/invalid JSON."
    }
    if ([string]$km.review_kind -eq 'remediation' -or [string]$km.review_kind -eq 'terminal_closure') {
      Fail-Blocked "Remediation chaining refused: parent kind metadata marks remediation/closure."
    }
  }
}

function Assert-RemediationDiffChanged([string]$ParentStem, [string[]]$ChangedPaths) {
  $priorHash = Read-TerminalFingerprintHash $ParentStem
  $currentHash = Get-FingerprintHash (Get-TreeFingerprint)
  if ($priorHash) {
    if ($priorHash -eq $currentHash) {
      Fail-Blocked "Remediation refused: working tree fingerprint unchanged since parent Round 3 terminal snapshot. Fix findings before remediation re-review."
    }
    return
  }
  # Legacy parents (terminal before fingerprint existed): require attested path diffs vs HEAD.
  if (-not $ChangedPaths -or $ChangedPaths.Count -eq 0) {
    Fail-Blocked "Remediation refused: parent has no r3-terminal-fingerprint; remediation_changed_paths must list fixed files that differ from HEAD."
  }
  $any = $false
  foreach ($p in $ChangedPaths) {
    if (Test-PathChangedVsHead $p) { $any = $true; break }
  }
  if (-not $any) {
    Fail-Blocked "Remediation refused: none of remediation_changed_paths differ from HEAD (unchanged diff cannot open remediation)."
  }
}

function Assert-RemediationSlotAvailable([string]$ParentStem, [string]$ChildStem) {
  $slot = Get-RemediationChildPath $ParentStem
  if (Test-Path -LiteralPath $slot) {
    $existing = (Read-Utf8File $slot).Trim()
    if ($existing -and -not [string]::Equals($existing, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
      Fail-Blocked "Remediation refused: parent '$ParentStem' already used remediation slot for '$existing'. Second remediation is forbidden."
    }
  }
}

function Try-ClaimRemediationSlot([string]$ParentStem, [string]$ChildStem) {
  # Returns $true if this child owns the slot (created or idempotent same-child).
  # Returns $false if another child already claimed (loser path for parallel races).
  # Atomic claim via FileMode.CreateNew (fails if destination already exists).
  $slot = Get-RemediationChildPath $ParentStem
  $dir = Split-Path -Parent $slot
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  if (Test-Path -LiteralPath $slot) {
    $existing = (Read-Utf8File $slot).Trim()
    if ([string]::Equals($existing, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
    return $false
  }
  $payload = $ChildStem + "`n"
  $bytes = $Utf8.GetBytes($payload)
  try {
    $fs = [System.IO.File]::Open(
      $slot,
      [System.IO.FileMode]::CreateNew,
      [System.IO.FileAccess]::Write,
      [System.IO.FileShare]::None
    )
    try {
      $fs.Write($bytes, 0, $bytes.Length)
    } finally {
      $fs.Dispose()
    }
    return $true
  } catch [System.IO.IOException] {
    if (Test-Path -LiteralPath $slot) {
      $existing = (Read-Utf8File $slot).Trim()
      if ([string]::Equals($existing, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $true
      }
      return $false
    }
    throw
  }
}

function Claim-RemediationSlot([string]$ParentStem, [string]$ChildStem) {
  if (Try-ClaimRemediationSlot -ParentStem $ParentStem -ChildStem $ChildStem) {
    return
  }
  $slot = Get-RemediationChildPath $ParentStem
  $existing = if (Test-Path -LiteralPath $slot) { (Read-Utf8File $slot).Trim() } else { '(unknown)' }
  Fail-Blocked "Remediation refused: parent '$ParentStem' already used remediation slot for '$existing'. Second remediation is forbidden."
}

function Assert-RemediationParentBaseSha([string]$ParentStem, [string]$FixedBaseSha) {
  $parentMeta = Join-Path $RuntimeDir ($ParentStem + '.review-base-sha')
  if (-not (Test-Path -LiteralPath $parentMeta)) {
    Fail-Blocked "Remediation refused: parent '$ParentStem' has no immutable review-base-sha metadata."
  }
  $parentSha = (Read-Utf8File $parentMeta).Trim()
  if (-not $parentSha -or $parentSha -notmatch '^[0-9a-fA-F]{40}$') {
    Fail-Blocked "Remediation refused: parent '$ParentStem' review-base-sha is missing or invalid."
  }
  if (-not [string]::Equals($parentSha, $FixedBaseSha, [System.StringComparison]::OrdinalIgnoreCase)) {
    Fail-Blocked "Remediation BaseSha must match parent immutable base ($parentSha). Got: $FixedBaseSha"
  }
}

function Write-ReviewKindMeta([string]$TaskStem, $Meta, [string]$ParentStem) {
  $remParent = [string]$Meta.remediation_parent_task_id
  $closureDepth = [int]$Meta.closure_depth
  $json = @"
{
  "task": "$TaskStem",
  "review_kind": "$($Meta.review_kind)",
  "parent_task_id": "$ParentStem",
  "remediation_parent_task_id": "$remParent",
  "remediation_depth": $($Meta.remediation_depth),
  "closure_depth": $closureDepth,
  "written_at": "$((Get-Date).ToUniversalTime().ToString('o'))"
}
"@
  Write-Utf8File (Get-ReviewKindMetaPath $TaskStem) ($json.Trim() + "`n")
}

function Build-ParentReviewHistory([string]$ParentStem, [string[]]$RelatedBlockedTaskIds) {
  $parts = New-Object System.Collections.Generic.List[string]
  $parts.Add("## Parent task: $ParentStem")
  for ($i = 1; $i -le 3; $i++) {
    $p = Get-ReviewPath $ParentStem $i
    if (Test-Path -LiteralPath $p) {
      $parts.Add("### Parent round $i (`$p`)`n" + (Read-Utf8File $p))
    } else {
      $parts.Add("### Parent round $i`n(missing)")
    }
  }
  $fpPath = Get-TerminalFingerprintPath $ParentStem
  if (Test-Path -LiteralPath $fpPath) {
    $parts.Add("### Parent terminal fingerprint file`n" + (Read-Utf8File $fpPath))
  } else {
    $parts.Add("### Parent terminal fingerprint file`n(legacy: not recorded at Round 3; remediation used path-diff attestation)")
  }
  foreach ($rel in @($RelatedBlockedTaskIds)) {
    if (-not $rel) { continue }
    $parts.Add("## Related blocked / invalid reset task: $rel")
    for ($i = 1; $i -le 3; $i++) {
      $rp = Get-ReviewPath $rel $i
      if (Test-Path -LiteralPath $rp) {
        $parts.Add("### $rel round $i`n" + (Read-Utf8File $rp))
      }
    }
  }
  return (($parts -join "`n`n") + "`n")
}

function Get-PorcelainPathsExcludingAgent {
  $entries = @(Get-PorcelainEntriesExcludingAgent)
  return @($entries | ForEach-Object { $_.path } | Select-Object -Unique)
}

function Get-PorcelainEntriesExcludingAgent {
  $raw = $null
  try {
    $raw = (Invoke-Git -GitArgs @('status', '--porcelain=v1', '-uall')).TrimEnd()
  } catch {
    Fail-Blocked ("terminal_closure scope lock: git status failed: " + $_.Exception.Message)
  }
  $entries = New-Object System.Collections.Generic.List[object]
  if ([string]::IsNullOrWhiteSpace($raw)) { return [object[]]@() }
  foreach ($line in @($raw -split "`n")) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line -match '(?i)^(.. )\.agent/') { continue }
    if ($line -match '(?i)^\?\? \.agent/') { continue }
    if ($line.Length -lt 4) { continue }
    $xy = $line.Substring(0, 2)
    $rest = $line.Substring(3).Trim()
    if ([string]::IsNullOrWhiteSpace($rest)) { continue }
    $from = ''
    $path = $rest
    if ($rest -match ' -> ') {
      $parts = $rest -split ' -> ', 2
      $from = $parts[0].Trim().Trim('"') -replace '\\', '/'
      $path = $parts[1].Trim().Trim('"') -replace '\\', '/'
    } else {
      $path = $rest.Trim('"') -replace '\\', '/'
    }
    $path = $path.Trim()
    $from = $from.Trim()
    if ([string]::IsNullOrWhiteSpace($path)) { continue }
    [void]$entries.Add([pscustomobject]@{ xy = $xy; path = $path; rename_from = $from })
  }
  # Return a flat object[]; do NOT use unary-comma nesting (callers use @()).
  return [object[]]$entries.ToArray()
}

function Get-FingerprintStatusPaths([string]$FingerprintPath) {
  if (-not (Test-Path -LiteralPath $FingerprintPath)) { return @() }
  $text = $null
  try {
    $text = Read-Utf8File $FingerprintPath
  } catch {
    Fail-Blocked ("terminal_closure scope lock: failed reading remediation fingerprint: " + $_.Exception.Message)
  }
  $paths = New-Object System.Collections.Generic.List[string]
  $inStatus = $false
  foreach ($line in ($text -split '\r?\n')) {
    if ($line -eq 'STATUS:') { $inStatus = $true; continue }
    if ($inStatus -and ($line -eq 'STAGED:' -or $line -eq 'UNSTAGED:')) { break }
    if (-not $inStatus) { continue }
    if ($line.Length -lt 4) { continue }
    $rest = $line.Substring(3).Trim()
    if ($rest -match ' -> ') { $rest = ($rest -split ' -> ', 2)[1] }
    $rest = $rest.Trim('"') -replace '\\', '/'
    if ($rest) { [void]$paths.Add([string]$rest) }
  }
  return [string[]]$paths.ToArray()
}

function Get-RelPathContentSha256([string]$RelPath) {
  $rel = ($RelPath -replace '\\', '/').Trim()
  if (-not $rel -or $rel.Contains('..')) {
    Fail-Blocked "terminal_closure scope lock: refused unsafe path '$RelPath'."
  }
  $abs = Join-Path $RepoRoot ($rel -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $abs)) {
    return 'MISSING'
  }
  try {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $fs = [System.IO.File]::Open(
      $abs,
      [System.IO.FileMode]::Open,
      [System.IO.FileAccess]::Read,
      [System.IO.FileShare]::ReadWrite
    )
    try {
      $hash = $sha.ComputeHash($fs)
      return ([BitConverter]::ToString($hash) -replace '-', '').ToLowerInvariant()
    } finally {
      $fs.Dispose()
      $sha.Dispose()
    }
  } catch {
    Fail-Blocked ("terminal_closure scope lock: hash failed for '" + $rel + "': " + $_.Exception.Message)
  }
}

function Get-ClosureScopeBaselinePath([string]$TaskStem) {
  return (Join-Path $RuntimeDir ($TaskStem + '.closure-scope-baseline.json'))
}

function Get-ClosureInvalidationPath([string]$TaskStem) {
  return (Join-Path $RuntimeDir ($TaskStem + '.INVALIDATED_BY_REVIEW_HARNESS_DEFECT'))
}

function Get-TerminalClosureReplacementPath([string]$RemediationStem) {
  return (Join-Path $RuntimeDir ($RemediationStem + '.terminal-closure-replacement'))
}

function Build-OutOfScopeClosureSnapshot([string[]]$AllowPaths) {
  $allowSet = @{}
  foreach ($p in @($AllowPaths)) {
    $n = ($p -replace '\\', '/').Trim()
    if ($n) { $allowSet[$n] = $true }
  }
  $map = @{}
  $entries = @(Get-PorcelainEntriesExcludingAgent)
  foreach ($e in $entries) {
    if ($null -eq $e) { continue }
    $path = ([string]$e.path).Trim()
    if ([string]::IsNullOrWhiteSpace($path)) { continue }
    if ($allowSet.ContainsKey($path)) { continue }
    $renameFrom = ([string]$e.rename_from).Trim()
    if ($renameFrom -and -not $allowSet.ContainsKey($renameFrom)) {
      if (-not $map.ContainsKey($renameFrom)) {
        $map[$renameFrom] = @{
          path       = $renameFrom
          xy         = [string]$e.xy
          sha256     = (Get-RelPathContentSha256 $renameFrom)
          rename_to  = $path
          rename_from = ''
        }
      }
    }
    $map[$path] = @{
      path        = $path
      xy          = [string]$e.xy
      sha256      = (Get-RelPathContentSha256 $path)
      rename_from = $renameFrom
      rename_to   = ''
    }
  }
  return $map
}

function Convert-ScopeSnapshotToJson([hashtable]$Snapshot) {
  $paths = @($Snapshot.Keys | Sort-Object)
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine('{')
  [void]$sb.AppendLine('  "captured_at": "' + ((Get-Date).ToUniversalTime().ToString('o')) + '",')
  [void]$sb.AppendLine('  "entry_count": ' + $paths.Count + ',')
  [void]$sb.AppendLine('  "entries": {')
  for ($i = 0; $i -lt $paths.Count; $i++) {
    $p = [string]$paths[$i]
    $e = $Snapshot[$p]
    $comma = if ($i -lt $paths.Count - 1) { ',' } else { '' }
    $rf = if ($e.rename_from) { [string]$e.rename_from } else { '' }
    $rt = if ($e.rename_to) { [string]$e.rename_to } else { '' }
    $line = '    "' + $p.Replace('\', '\\').Replace('"', '\"') + '": {"xy":"' + $e.xy + '","sha256":"' + $e.sha256 + '","rename_from":"' + $rf.Replace('\', '\\').Replace('"', '\"') + '","rename_to":"' + $rt.Replace('\', '\\').Replace('"', '\"') + '"}' + $comma
    [void]$sb.AppendLine($line)
  }
  [void]$sb.AppendLine('  }')
  [void]$sb.AppendLine('}')
  return ($sb.ToString().TrimEnd() + "`n")
}

function Read-ScopeSnapshotFromJson([string]$JsonPath) {
  $raw = $null
  try {
    $raw = Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8
    $obj = $raw | ConvertFrom-Json
  } catch {
    Fail-Blocked ("terminal_closure scope lock: baseline JSON unreadable: " + $_.Exception.Message)
  }
  $map = @{}
  if ($null -eq $obj.entries) {
    Fail-Blocked "terminal_closure scope lock: baseline missing entries object."
  }
  foreach ($prop in $obj.entries.PSObject.Properties) {
    $map[[string]$prop.Name] = @{
      path        = [string]$prop.Name
      xy          = [string]$prop.Value.xy
      sha256      = [string]$prop.Value.sha256
      rename_from = [string]$prop.Value.rename_from
      rename_to   = [string]$prop.Value.rename_to
    }
  }
  return $map
}

function Assert-OutOfScopeSnapshotsEqual([hashtable]$Baseline, [hashtable]$Current, [string]$Context) {
  $baseKeys = @($Baseline.Keys | Sort-Object)
  $curKeys = @($Current.Keys | Sort-Object)
  $added = @($curKeys | Where-Object { -not $Baseline.ContainsKey($_) })
  $removed = @($baseKeys | Where-Object { -not $Current.ContainsKey($_) })
  if ($added.Count -gt 0) {
    Fail-Blocked ("terminal_closure scope lock ($Context): out-of-scope path added: " + ($added -join ', '))
  }
  if ($removed.Count -gt 0) {
    Fail-Blocked ("terminal_closure scope lock ($Context): out-of-scope path removed: " + ($removed -join ', '))
  }
  foreach ($k in $baseKeys) {
    $b = $Baseline[$k]
    $c = $Current[$k]
    if ([string]$b.sha256 -ne [string]$c.sha256) {
      Fail-Blocked ("terminal_closure scope lock ($Context): out-of-scope content changed: " + $k)
    }
    if ([string]$b.xy -ne [string]$c.xy) {
      Fail-Blocked ("terminal_closure scope lock ($Context): out-of-scope porcelain/stage changed: " + $k + " (" + $b.xy + " -> " + $c.xy + ")")
    }
    if ([string]$b.rename_from -ne [string]$c.rename_from -or [string]$b.rename_to -ne [string]$c.rename_to) {
      Fail-Blocked ("terminal_closure scope lock ($Context): out-of-scope rename changed: " + $k)
    }
  }
}

function Write-ClosureScopeBaseline([string]$TaskStem, [string[]]$AllowPaths) {
  $snap = $null
  try {
    $snap = Build-OutOfScopeClosureSnapshot $AllowPaths
  } catch {
    if ($_.Exception.Message -match 'terminal_closure scope lock') { throw }
    Fail-Blocked ("terminal_closure scope lock: snapshot failed: " + $_.Exception.Message)
  }
  $path = Get-ClosureScopeBaselinePath $TaskStem
  Write-Utf8File $path (Convert-ScopeSnapshotToJson $snap)
  return $snap
}

function Assert-ClosureScopeBaselineHeld([string]$TaskStem, [string[]]$AllowPaths) {
  $path = Get-ClosureScopeBaselinePath $TaskStem
  if (-not (Test-Path -LiteralPath $path)) {
    Fail-Blocked "terminal_closure scope lock: missing baseline file $path"
  }
  $baseline = Read-ScopeSnapshotFromJson $path
  $current = $null
  try {
    $current = Build-OutOfScopeClosureSnapshot $AllowPaths
  } catch {
    if ($_.Exception.Message -match 'terminal_closure scope lock') { throw }
    Fail-Blocked ("terminal_closure scope lock: end snapshot failed: " + $_.Exception.Message)
  }
  Assert-OutOfScopeSnapshotsEqual $baseline $current 'end-vs-start'
}

function Assert-TerminalClosureScopeLock([string]$RemediationStem, [string]$TaskStem, [string[]]$AllowPaths) {
  $allow = @($AllowPaths | ForEach-Object { ($_ -replace '\\', '/').Trim() } | Where-Object { $_ })
  if ($allow.Count -eq 0) {
    Fail-Blocked "terminal_closure requires closure_changed_paths (scope allowlist)."
  }
  $allowSet = @{}
  foreach ($p in $allow) { $allowSet[$p] = $true }

  # Path-set gate vs remediation R3: new out-of-scope paths since R3 are refused.
  $fpPath = Get-TerminalFingerprintPath $RemediationStem
  if (-not (Test-Path -LiteralPath $fpPath)) {
    Fail-Blocked "terminal_closure scope lock: missing remediation R3 terminal fingerprint: $fpPath"
  }
  $baselinePaths = @(Get-FingerprintStatusPaths $fpPath)
  if ($baselinePaths.Count -lt 1) {
    Fail-Blocked "terminal_closure scope lock: remediation R3 fingerprint has empty STATUS path set: $fpPath"
  }
  $baselineSet = @{}
  foreach ($p in $baselinePaths) { $baselineSet[[string]$p] = $true }
  $currentEntries = @(Get-PorcelainEntriesExcludingAgent)
  $newOutside = New-Object System.Collections.Generic.List[string]
  foreach ($e in $currentEntries) {
    $p = [string]$e.path
    if ($allowSet.ContainsKey($p)) { continue }
    if ($baselineSet.ContainsKey($p)) { continue }
    [void]$newOutside.Add($p)
  }
  if ($newOutside.Count -gt 0) {
    Fail-Blocked ("terminal_closure scope lock: unrelated paths changed since remediation R3 terminal: " + ($newOutside -join ', '))
  }

  $any = $false
  foreach ($p in $allow) {
    if (Test-PathChangedVsHead $p) { $any = $true; break }
  }
  if (-not $any) {
    Fail-Blocked "terminal_closure refused: none of closure_changed_paths differ from HEAD."
  }

  # Content-hash baseline for every current out-of-scope dirty path (including already-dirty ones).
  [void](Write-ClosureScopeBaseline -TaskStem $TaskStem -AllowPaths $allow)
}

function Assert-TerminalClosureSlotAvailable([string]$RemediationStem, [string]$ChildStem, [string]$ReplacesTaskId = '') {
  $slot = Get-TerminalClosureChildPath $RemediationStem
  if (-not (Test-Path -LiteralPath $slot)) { return }
  $existing = (Read-Utf8File $slot).Trim()
  if (-not $existing) { return }
  if ([string]::Equals($existing, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) { return }
  if ($ReplacesTaskId -and [string]::Equals($existing, $ReplacesTaskId, [System.StringComparison]::OrdinalIgnoreCase)) {
    $inv = Get-ClosureInvalidationPath $ReplacesTaskId
    if (-not (Test-Path -LiteralPath $inv)) {
      Fail-Blocked "terminal_closure replacement refused: replaces_task_id '$ReplacesTaskId' is not marked INVALIDATED_BY_REVIEW_HARNESS_DEFECT."
    }
    $replSlot = Get-TerminalClosureReplacementPath $RemediationStem
    if (Test-Path -LiteralPath $replSlot) {
      $prev = (Read-Utf8File $replSlot).Trim()
      if ($prev -and -not [string]::Equals($prev, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
        Fail-Blocked "terminal_closure replacement already used for '$prev'. Second replacement is forbidden."
      }
    }
    return
  }
  Fail-Blocked "terminal_closure refused: remediation '$RemediationStem' already used closure slot for '$existing'. Second terminal_closure is forbidden."
}

function Write-Utf8FileCreateNewExclusive([string]$Path, [string]$Content) {
  <#
    Atomic exclusive create (FileMode.CreateNew). Returns:
      'created'     — this caller uniquely created the file
      'exists-same' — file already existed with identical trimmed content (idempotent)
    Any other outcome (exists-other / IO / unexpected) → Fail-Blocked (fail-closed).
    Never truncates or overwrites an existing file.
  #>
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $payload = if ($null -eq $Content) { '' } else { [string]$Content }
  $bytes = $Utf8.GetBytes($payload)
  try {
    $fs = [System.IO.File]::Open(
      $Path,
      [System.IO.FileMode]::CreateNew,
      [System.IO.FileAccess]::Write,
      [System.IO.FileShare]::None
    )
    try {
      $fs.Write($bytes, 0, $bytes.Length)
      $fs.Flush($true)
    } finally {
      $fs.Dispose()
    }
    return 'created'
  } catch [System.IO.IOException] {
    if (-not (Test-Path -LiteralPath $Path)) {
      Fail-Blocked ("exclusive create failed and file missing: " + $Path + " (" + $_.Exception.Message + ")")
    }
    $existing = $null
    try {
      $existing = (Read-Utf8File $Path).Trim()
    } catch {
      Fail-Blocked ("exclusive create race: existing claim unreadable at " + $Path + ": " + $_.Exception.Message)
    }
    $want = $payload.Trim()
    if ([string]::Equals($existing, $want, [System.StringComparison]::OrdinalIgnoreCase)) {
      return 'exists-same'
    }
    Fail-Blocked ("exclusive create race lost at '" + $Path + "' (existing='" + $existing + "').")
  } catch {
    Fail-Blocked ("exclusive create unexpected failure at '" + $Path + "': " + $_.Exception.Message)
  }
}

function Claim-TerminalClosureSlot([string]$RemediationStem, [string]$ChildStem, [string]$ReplacesTaskId = '') {
  Assert-TerminalClosureSlotAvailable -RemediationStem $RemediationStem -ChildStem $ChildStem -ReplacesTaskId $ReplacesTaskId
  $slot = Get-TerminalClosureChildPath $RemediationStem
  $dir = Split-Path -Parent $slot
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $payload = $ChildStem + "`n"
  if ($ReplacesTaskId) {
    # Lineage-scoped exclusive claim: one replacement child per remediation parent.
    # Concurrent callers: CreateNew admits exactly one winner; losers fail-closed.
    $replSlot = Get-TerminalClosureReplacementPath $RemediationStem
    $claimResult = Write-Utf8FileCreateNewExclusive $replSlot $payload
    if ($claimResult -ne 'created' -and $claimResult -ne 'exists-same') {
      Fail-Blocked "terminal_closure replacement claim returned unexpected result '$claimResult'."
    }
    $owned = (Read-Utf8File $replSlot).Trim()
    if (-not [string]::Equals($owned, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
      Fail-Blocked "terminal_closure replacement claim ownership mismatch (marker='$owned', child='$ChildStem')."
    }
    # Slot update only after exclusive marker ownership. Overwrite is intentional when
    # replacing the invalidated first closure child; never rewrite marker via CreateNew loss.
    try {
      Write-Utf8File $slot $payload
    } catch {
      Fail-Blocked ("terminal_closure replacement owned marker but failed to update closure slot: " + $_.Exception.Message)
    }
    $slotOwned = (Read-Utf8File $slot).Trim()
    if (-not [string]::Equals($slotOwned, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
      Fail-Blocked "terminal_closure replacement slot ownership mismatch after claim (slot='$slotOwned', child='$ChildStem')."
    }
    return
  }
  if (Test-Path -LiteralPath $slot) {
    $existing = (Read-Utf8File $slot).Trim()
    if ([string]::Equals($existing, $ChildStem, [System.StringComparison]::OrdinalIgnoreCase)) {
      return
    }
    Fail-Blocked "terminal_closure refused: remediation '$RemediationStem' already used closure slot for '$existing'."
  }
  [void](Write-Utf8FileCreateNewExclusive $slot $payload)
}

function Build-TerminalClosureHistory([string]$NormalParent, [string]$RemediationParent, [string[]]$RelatedBlockedTaskIds, [string]$ReplacesTaskId = '') {
  $parts = New-Object System.Collections.Generic.List[string]
  $parts.Add((Build-ParentReviewHistory -ParentStem $NormalParent -RelatedBlockedTaskIds $RelatedBlockedTaskIds))
  $parts.Add("## Remediation parent task: $RemediationParent")
  for ($i = 1; $i -le 3; $i++) {
    $p = Get-ReviewPath $RemediationParent $i
    if (Test-Path -LiteralPath $p) {
      $parts.Add("### Remediation round $i`n" + (Read-Utf8File $p))
    } else {
      $parts.Add("### Remediation round $i`n(missing)")
    }
  }
  $fpPath = Get-TerminalFingerprintPath $RemediationParent
  if (Test-Path -LiteralPath $fpPath) {
    $parts.Add("### Remediation terminal fingerprint`n" + (Read-Utf8File $fpPath))
  }
  if ($ReplacesTaskId) {
    $parts.Add("## Invalidated terminal_closure being replaced: $ReplacesTaskId")
    $inv = Get-ClosureInvalidationPath $ReplacesTaskId
    if (Test-Path -LiteralPath $inv) {
      $parts.Add("### Invalidation marker`n" + (Read-Utf8File $inv))
    }
    $rp = Get-ReviewPath $ReplacesTaskId 1
    if (Test-Path -LiteralPath $rp) {
      $parts.Add("### Invalidated closure review`n" + (Read-Utf8File $rp))
    }
  }
  return (($parts -join "`n`n") + "`n")
}

function Assert-TerminalClosureReplacementMeta($Meta) {
  $replaces = [string]$Meta.replaces_task_id
  $reason = [string]$Meta.replacement_reason
  if (-not $replaces -and -not $reason) { return }
  if (-not $replaces -or -not $reason) {
    Fail-Blocked "terminal_closure replacement requires both replaces_task_id and replacement_reason."
  }
  if ($reason -ne 'review_harness_scope_lock_defect') {
    Fail-Blocked "terminal_closure replacement_reason must be review_harness_scope_lock_defect (got '$reason')."
  }
  $inv = Get-ClosureInvalidationPath $replaces
  if (-not (Test-Path -LiteralPath $inv)) {
    Fail-Blocked "terminal_closure replacement refused: '$replaces' is not INVALIDATED_BY_REVIEW_HARNESS_DEFECT."
  }
}

function Assert-TerminalClosureContract([string]$TaskStem, $Meta, [int]$RoundNumber) {
  if ($RoundNumber -ne 1) {
    Fail-Blocked "terminal_closure allows exactly one Codex run (logical round 1 only). No iteration / Round concept."
  }
  if ($Meta.closure_depth -ne 1) {
    Fail-Blocked "closure_depth must be 1 (got $($Meta.closure_depth))."
  }
  if ($Meta.remediation_depth -ne 0) {
    Fail-Blocked "terminal_closure must not set remediation_depth (got $($Meta.remediation_depth))."
  }
  Assert-TerminalClosureReplacementMeta $Meta
  $normalParent = [string]$Meta.parent_task_id
  $remParent = [string]$Meta.remediation_parent_task_id
  if (-not $normalParent) {
    Fail-Blocked "terminal_closure requires parent_task_id (normal parent)."
  }
  if (-not $remParent) {
    Fail-Blocked "terminal_closure requires remediation_parent_task_id."
  }
  if ($normalParent -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{2,200}$') {
    Fail-Blocked "Invalid parent_task_id: $normalParent"
  }
  if ($remParent -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{2,200}$') {
    Fail-Blocked "Invalid remediation_parent_task_id: $remParent"
  }
  if ([string]::Equals($normalParent, $remParent, [System.StringComparison]::OrdinalIgnoreCase)) {
    Fail-Blocked "terminal_closure parent_task_id and remediation_parent_task_id must differ."
  }

  # Normal parent: terminal R3 FAIL_FIXABLE, not remediation/closure.
  Assert-ParentNotRemediationTask $normalParent
  Assert-ParentRound3TerminalFailFixable $normalParent

  # Remediation parent: must be remediation kind + R3 FAIL_FIXABLE terminal.
  $remTask = Join-Path (Join-Path $RepoRoot '.agent\tasks') ($remParent + '.md')
  if (-not (Test-Path -LiteralPath $remTask)) {
    Fail-Blocked "terminal_closure refused: remediation parent task file missing: $remParent"
  }
  $rm = $null
  try {
    $rm = Parse-TaskReviewMeta $remTask
  } catch {
    Fail-Blocked "terminal_closure refused: remediation parent task metadata unreadable: $remParent"
  }
  if ($rm.review_kind -ne 'remediation') {
    Fail-Blocked "terminal_closure refused: remediation_parent_task_id '$remParent' review_kind must be remediation (got '$($rm.review_kind)')."
  }
  if ([string]$rm.parent_task_id -ne $normalParent) {
    Fail-Blocked "terminal_closure refused: remediation parent cites different normal parent ('$($rm.parent_task_id)' vs '$normalParent')."
  }
  Assert-ParentRound3TerminalFailFixable $remParent

  $findings = @($Meta.closure_finding_ids | Where-Object { $_ })
  if ($findings.Count -lt 1) {
    Fail-Blocked "terminal_closure requires closure_finding_ids (fixed finding set)."
  }
  $r3Path = Get-ReviewPath $remParent 3
  $r3Text = Read-Utf8File $r3Path
  $replacesText = ''
  if ($Meta.replaces_task_id) {
    $rp = Get-ReviewPath $Meta.replaces_task_id 1
    if (Test-Path -LiteralPath $rp) { $replacesText = Read-Utf8File $rp }
  }
  foreach ($fid in $findings) {
    $inRem = $r3Text.IndexOf([string]$fid, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
    $inRep = $replacesText -and ($replacesText.IndexOf([string]$fid, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
    if (-not $inRem -and -not $inRep) {
      Fail-Blocked "terminal_closure finding id/path not found in remediation Round 3 or replaced closure review: $fid"
    }
  }

  Assert-TerminalClosureSlotAvailable -RemediationStem $remParent -ChildStem $TaskStem -ReplacesTaskId $Meta.replaces_task_id
  Assert-TerminalClosureScopeLock -RemediationStem $remParent -TaskStem $TaskStem -AllowPaths $Meta.closure_changed_paths
}

function Assert-RemediationContract([string]$TaskStem, $Meta, [int]$RoundNumber) {
  if ($Meta.review_kind -eq 'terminal_closure') {
    Assert-TerminalClosureContract -TaskStem $TaskStem -Meta $Meta -RoundNumber $RoundNumber
    return
  }

  if ($Meta.review_kind -ne 'remediation') {
    if ($Meta.parent_task_id) {
      Fail-Blocked "parent_task_id is only valid when review_kind is remediation or terminal_closure."
    }
    if ($Meta.remediation_parent_task_id) {
      Fail-Blocked "remediation_parent_task_id is only valid when review_kind is terminal_closure."
    }
    if ($Meta.closure_depth -ne 0) {
      Fail-Blocked "closure_depth is only valid when review_kind is terminal_closure."
    }
    return
  }

  if ($Meta.remediation_parent_task_id -or $Meta.closure_depth -ne 0 -or @($Meta.closure_finding_ids).Count -gt 0 -or $Meta.replaces_task_id -or $Meta.replacement_reason) {
    Fail-Blocked "Remediation tasks cannot set terminal_closure fields."
  }

  if (-not $Meta.parent_task_id) {
    Fail-Blocked "Remediation task requires parent_task_id in task front matter."
  }
  if ($Meta.remediation_depth -ne 1) {
    Fail-Blocked "remediation_depth must be 1 (got $($Meta.remediation_depth)). Chained remediation is forbidden."
  }

  $parent = $Meta.parent_task_id
  if ($parent -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{2,200}$') {
    Fail-Blocked "Invalid parent_task_id: $parent"
  }

  Assert-ParentNotRemediationTask $parent
  Assert-ParentRound3TerminalFailFixable $parent
  Assert-RemediationSlotAvailable $parent $TaskStem
  Assert-RemediationDiffChanged $parent $Meta.remediation_changed_paths

  if ($RoundNumber -ge 2) {
    # Continuing remediation rounds: slot must already claim this child
    $slot = Get-RemediationChildPath $parent
    if (-not (Test-Path -LiteralPath $slot)) {
      Fail-Blocked "Remediation Round $RoundNumber missing parent remediation-child claim."
    }
    $existing = (Read-Utf8File $slot).Trim()
    if (-not [string]::Equals($existing, $TaskStem, [System.StringComparison]::OrdinalIgnoreCase)) {
      Fail-Blocked "Remediation Round $RoundNumber child mismatch (slot='$existing', task='$TaskStem')."
    }
  }
}

function Assert-NoDisguisedRoundReset([string]$TaskStem, $Meta) {
  if ($Meta.review_kind -eq 'normal' -and $Meta.parent_task_id) {
    Fail-Blocked "Normal tasks cannot set parent_task_id. Use review_kind: remediation or terminal_closure."
  }
  if ($Meta.review_kind -eq 'normal' -and ($Meta.remediation_parent_task_id -or $Meta.closure_depth -ne 0)) {
    Fail-Blocked "Normal tasks cannot set terminal_closure fields."
  }
}
