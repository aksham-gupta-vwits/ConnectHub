#!/usr/bin/env bash
# install-hooks.sh — Install ConnectHub git hooks
#
# Usage:
#   bash scripts/install-hooks.sh
#   npm run hooks:install

set -euo pipefail

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"
SCRIPTS_DIR="$(git rev-parse --show-toplevel)/scripts/hooks"

install_hook() {
  local HOOK_NAME="$1"
  local SRC="$SCRIPTS_DIR/$HOOK_NAME"
  local DEST="$HOOKS_DIR/$HOOK_NAME"

  if [ ! -f "$SRC" ]; then
    echo "⚠️  Hook source not found: $SRC"
    return 1
  fi

  if [ -f "$DEST" ] && [ ! -L "$DEST" ]; then
    echo "⚠️  Backing up existing $HOOK_NAME → $DEST.bak"
    cp "$DEST" "$DEST.bak"
  fi

  cp "$SRC" "$DEST"
  chmod +x "$DEST"
  echo "✅ Installed: $HOOK_NAME"
}

echo "Installing ConnectHub git hooks..."
echo ""
install_hook "pre-push"
echo ""
echo "✅ Done! The @Reviewer agent will be triggered on every git push."
echo "   Run 'npm run hooks:uninstall' to remove."
