#!/usr/bin/env bash
# uninstall-hooks.sh — Remove ConnectHub git hooks

set -euo pipefail

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

remove_hook() {
  local HOOK="$HOOKS_DIR/$1"
  if [ -f "$HOOK" ]; then
    rm -f "$HOOK"
    echo "🗑️  Removed: $1"
    # Restore backup if present
    if [ -f "$HOOK.bak" ]; then
      mv "$HOOK.bak" "$HOOK"
      echo "   ↩ Restored previous hook from $1.bak"
    fi
  else
    echo "   $1 not installed, skipping."
  fi
}

echo "Removing ConnectHub git hooks..."
remove_hook "pre-push"
echo "Done."
