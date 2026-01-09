#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p .vscode .mcp docs/meta
touch .mcp/memory.jsonl

cat > .vscode/mcp.json <<'JSON'
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "${workspaceFolder}/.mcp/memory.jsonl"
      }
    }
  }
}
JSON

echo "✅ Memory MCP bootstrapped:"
echo "- .vscode/mcp.json"
echo "- .mcp/memory.jsonl"
