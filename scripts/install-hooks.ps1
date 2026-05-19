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

    $src  = Join-Path $scriptsDir $HookName
    $dest = Join-Path $hooksDir $HookName

    if (-not (Test-Path $src)) {
        Write-Warning "Hook source not found: $src"
        return
    }

    if ((Test-Path $dest) -and -not ((Get-Item $dest).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        Write-Warning "Backing up existing $HookName → $dest.bak"
        Copy-Item $dest "$dest.bak" -Force
    }

    Copy-Item $src $dest -Force
    Write-Host "✅ Installed: $HookName"
}

Write-Host "Installing ConnectHub git hooks..."
Write-Host ""
Install-Hook 'pre-push'
Write-Host ""
Write-Host "✅ Done! The @Reviewer agent will be triggered on every git push."
Write-Host "   Run 'npm run hooks:uninstall' to remove."
