#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/bootstrap_token_discipline.sh >/dev/null

warn() { echo "⚠️  $1" >&2; }
fail() { echo "❌ $1" >&2; exit 1; }

# --- Detect duplicate context packs
if [ -f "docs/meta/CONTENT_PACK.md" ]; then
  fail "Duplicate context pack found: docs/meta/CONTENT_PACK.md (delete it)"
fi

# --- Orphan docs check (excluding ignored folders)
while IFS= read -r file; do
  case "$file" in
    docs/used-prompts/*|docs/design/prompts/*|docs/design/more-prompts/*|docs/design/svg/*)
      continue
      ;;
  esac

  if ! grep -qF "$file" docs/meta/DOCS_INDEX.md 2>/dev/null; then
    warn "Doc not indexed: $file"
  fi
done < <(find docs -type f -name "*.md" | sort)

# --- Toxic files check
if [ -f "docs/TODOS.md" ]; then
  warn "docs/TODOS.md exists in root docs — this is a known conflict source."
  warn "Move it to docs/used-prompts/ or merge its content into canonical docs."
fi

# --- Progress log presence
[ -f docs/progress.md ] || fail "Missing docs/progress.md"

echo "✅ Token discipline maintenance complete."
