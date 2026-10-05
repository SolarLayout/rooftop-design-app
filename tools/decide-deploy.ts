// Prints whether staging is deployed, and why, for the deploy workflow (.github/workflows/deploy-staging.yml):
// "deploy=true|false" and "reason=..." lines for $GITHUB_OUTPUT. The facts come as environment variables; the rule and
// their reading: tools/deploy/decide.ts.

import { decide, factsFrom } from "./deploy/decide";

const decision = decide(factsFrom(process.env));
console.log(`deploy=${decision.deploy}`);
console.log(`reason=${decision.reason}`);
