# install-hooks.ps1 — Install ConnectHub git hooks (Windows)
#
# Usage:
#   pwsh scripts\install-hooks.ps1
#   npm run hooks:install

$ErrorActionPreference = 'Stop'

$gitDir    = (git rev-parse --git-dir).Trim()
$repoRoot  = (git rev-parse --show-toplevel).Trim()
$hooksDir  = Join-Path $gitDir 'hooks'
$scriptsDir = Join-Path $repoRoot 'scripts\hooks'

# Resolve node.exe — checks PATH first, then NVS, then common locations
function Find-NodeExe {
    # 1. Already in PATH?
    $inPath = Get-Command node -ErrorAction SilentlyContinue
    if ($inPath) { return $inPath.Source }

    # 2. NVS (Node Version Switcher)
    $nvsRoot = "$env:USERPROFILE\.nvs"
    if (Test-Path $nvsRoot) {
        # Prefer the highest-versioned node
        $found = Get-ChildItem "$nvsRoot" -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue |
                 Where-Object { $_.FullName -notmatch 'cache' } |
                 Sort-Object FullName -Descending |
                 Select-Object -First 1
        if ($found) { return $found.FullName }
    }

    # 3. Common install locations
    $candidates = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
        "C:\Program Files\nodejs\node.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }

    throw "node.exe not found. Install Node.js and try again."
}

$nodePath = Find-NodeExe
Write-Host "Using Node.js: $nodePath"

function Install-Hook {
    param([string]$HookName)

    # On Windows, use the Node.js version of the hook (cross-platform)
    $nodeHook = Join-Path $scriptsDir "$HookName.js"
    $bashHook = Join-Path $scriptsDir $HookName

    if (Test-Path $nodeHook) {
        $src = $nodeHook
    } elseif (Test-Path $bashHook) {
        $src = $bashHook
    } else {
        Write-Warning "Hook source not found: $nodeHook or $bashHook"
        return
    }

    $dest = Join-Path $hooksDir $HookName

    if ((Test-Path $dest) -and -not ((Get-Item $dest).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        Write-Warning "Backing up existing $HookName → $dest.bak"
        Copy-Item $dest "$dest.bak" -Force
    }

    # Write a wrapper that calls node on the .js hook (works without bash on Windows)
    if ($src -like "*.js") {
        $jsPath      = $src -replace '\\', '/'
        $nodePathFwd = $nodePath -replace '\\', '/'
        # MUST use LF line endings — git's sh.exe rejects CRLF hooks on Windows
        # Embed the absolute node path so git's minimal sh.exe PATH doesn't matter
        $lf = "`n"
        $wrapperContent = "#!/usr/bin/env sh${lf}exec `"$nodePathFwd`" `"$jsPath`" `"`$@`"${lf}"
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($dest, $wrapperContent, $utf8NoBom)
    } else {
        Copy-Item $src $dest -Force
    }

    Write-Host "✅ Installed: $HookName → $dest"
}

Write-Host "Installing ConnectHub git hooks..."
Write-Host ""
Install-Hook 'pre-push'
Write-Host ""
Write-Host "✅ Done! The @Reviewer agent will be triggered on every git push."
Write-Host "   Run 'npm run hooks:uninstall' to remove."
