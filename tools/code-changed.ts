// Reads the changed files, one per line (git diff --name-only), and prints true when one of them is code.
// Used by the deploy workflow (.github/workflows/deploy-staging.yml); the rule: tools/deploy/code-changed.ts.

import { codeChanged } from "./deploy/code-changed";

console.log(codeChanged((await Bun.stdin.text()).split("\n")) ? "true" : "false");
