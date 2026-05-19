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
        $nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source ?? 'node'
        $jsPath   = $src -replace '\\', '/'
        # Git hooks on Windows can be shell scripts OR executables; write a thin sh wrapper
        $wrapperContent = "#!/usr/bin/env sh`nexec node `"$jsPath`" `"`$@`""
        [System.IO.File]::WriteAllText($dest, $wrapperContent)
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
