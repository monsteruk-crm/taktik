#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p docs/meta .mcp

# --- Repo file inventory (cheap context)
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git ls-files > docs/meta/REPO_FILES.txt
else
  find . -type f \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./.next/*" \
    | sed 's#^\./##' \
    | sort > docs/meta/REPO_FILES.txt
fi

# --- Docs inventory
find docs -type f -name "*.md" | sort > docs/meta/DOCS_FILES.txt

# --- Ensure meta docs exist (do not overwrite)
touch docs/meta/TOKEN_DISCIPLINE.md
touch docs/meta/DOCS_INDEX.md
touch docs/meta/CONTEXT_PACK.md
touch docs/meta/CODEX_BOOTSTRAP_PROMPT.md

# --- Ensure memory file exists (config is external)
touch .mcp/memory.jsonl

echo "✅ Token discipline bootstrap complete."
