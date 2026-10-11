#!/bin/bash
# Claude Code cloud sessions start from a fresh clone: install what the stack and the check need, so that
# `bun dev:bg --profile test` and `bun check` work from the first turn. Runs only in the cloud; idempotent.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

bun install
(cd apps/api && uv sync)

# The container's Playwright browsers are of a newer build than the one @playwright/test pins. The layout is the
# same, so the build it asks for is pointed at the newest installed one; the screenshot tools need a browser.
browsers="${PLAYWRIGHT_BROWSERS_PATH:-}"
manifest=$(ls node_modules/.bun/playwright-core@*/node_modules/playwright-core/browsers.json 2>/dev/null | head -1)
if [ -n "$browsers" ] && [ -d "$browsers" ] && [ -n "$manifest" ]; then
  wanted=$(bun -e 'const m = await Bun.file(process.argv[1]).json(); console.log(m.browsers.find((b) => b.name === "chromium").revision)' "$manifest")
  for kind in chromium chromium_headless_shell; do
    newest=$(ls -d "$browsers/$kind"-[0-9]* 2>/dev/null | grep -v -- "-$wanted\$" | sort -t- -k2 -n | tail -1)
    if [ ! -e "$browsers/$kind-$wanted" ] && [ -n "$newest" ]; then
      ln -s "$(basename "$newest")" "$browsers/$kind-$wanted"
    fi
  done
fi
