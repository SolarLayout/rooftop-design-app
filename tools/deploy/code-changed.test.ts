import { describe, expect, test } from "bun:test";

import { codeChanged, isDocument } from "./code-changed";

describe("whether a change needs a deploy", () => {
  test("documents alone do not: the plan, the docs, and any Markdown file", () => {
    for (const path of ["plan/STATE.md", "plan/sessions/016/record.md", "docs/checks.md", "docs/design/mockups/x.dc.html", "README.md", "apps/web/CLAUDE.md"]) {
      expect(isDocument(path)).toBe(true);
    }
    expect(codeChanged(["plan/STATE.md", "docs/checks.md", "CLAUDE.md"])).toBe(false);
  });

  test("anything else does, the infrastructure and the workflows too", () => {
    for (const path of ["apps/web/app/page.tsx", "apps/api/src/rooftop_api/main.py", "bun.lock", "infra/aws/github-staging-policy.json", ".github/workflows/deploy-staging.yml"]) {
      expect(isDocument(path)).toBe(false);
    }
    expect(codeChanged(["plan/STATE.md", "apps/web/next.config.ts"])).toBe(true);
  });

  test("blank lines are not files; no file at all is no change", () => {
    expect(codeChanged(["", "  ", "plan/STATE.md"])).toBe(false);
    expect(codeChanged([])).toBe(false);
  });
});
