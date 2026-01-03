#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Always refresh inventories
bash scripts/bootstrap_token_discipline.sh >/dev/null

fail() { echo "❌ $1" >&2; exit 1; }
warn() { echo "⚠️  $1" >&2; }

# 1) Orphan doc detection (docs not referenced by docs/README.md or docs/meta/DOCS_INDEX.md)
# This is intentionally simple: it catches obvious “new file, forgot to link it”.
ORPHANS=0
while IFS= read -r path; do
  # ignore these buckets
  if [[ "$path" == docs/old-prompts/* ]]; then continue; fi

  if ! grep -qF "$path" docs/README.md 2>/dev/null && ! grep -qF "$path" docs/meta/DOCS_INDEX.md 2>/dev/null; then
    warn "Orphan doc (not indexed): $path"
    ORPHANS=$((ORPHANS+1))
  fi
done < <(find docs -type f -name "*.md" | sort)

if [ "$ORPHANS" -gt 0 ]; then
  warn "Found $ORPHANS orphan docs. Link them or delete/merge them."
fi

# 2) Progress log freshness check (soft gate)
if [ -f "docs/progress.md" ]; then
  # “fresh enough” = contains an entry from the last 14 days (best-effort heuristic)
  if ! grep -Eq "$(date -u +%Y-%m-)|$(date -u -d '7 days ago' +%Y-%m-)|$(date -u -d '14 days ago' +%Y-%m-)" docs/progress.md 2>/dev/null; then
    warn "docs/progress.md looks stale (no recent YYYY-MM- entries found). Add BEFORE/NOW/NEXT for the latest milestone."
  fi
else
  fail "Missing docs/progress.md (required by AGENTS contract)."
fi

# 3) MCP config sanity
if [ ! -f ".vscode/mcp.json" ]; then
  fail "Missing .vscode/mcp.json (MCP workspace config)."
fi
if ! grep -q "@modelcontextprotocol/server-memory" .vscode/mcp.json; then
  fail ".vscode/mcp.json exists but does not reference @modelcontextprotocol/server-memory"
fi
touch .mcp/memory.jsonl

# 4) Optional: run lint if deps installed
if [ -d "node_modules" ]; then
  echo "Running: npm run lint"
  npm run lint
else
  warn "node_modules not found; skipping lint."
fi

echo "✅ Maintenance checks complete."
