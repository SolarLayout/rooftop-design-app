import { describe, expect, test } from "bun:test";

import { type Facts, decide, factsFrom } from "./decide";

// Whether a green check of main deploys staging (plan/phase-12-plan.md, decision 7). Staging names the commit it runs
// (/api/health); a deploy that passed its smoke tags that commit's image `staging-smoked-<sha>`.

const SHA = "b".repeat(40);
const DEPLOYED = "a".repeat(40);

const facts = (over: Partial<Facts> = {}): Facts => ({
  manual: false,
  commit: SHA,
  deployed: DEPLOYED,
  deployedKnown: true,
  olderThanDeployed: false,
  deployedSmoked: true,
  codeChanged: true,
  ...over,
});

describe("whether staging is deployed", () => {
  test("started by hand, always", () => {
    expect(decide(facts({ manual: true, codeChanged: false, olderThanDeployed: true }))).toEqual({ deploy: true, reason: "started by hand" });
  });

  test("staging cannot say what it runs, or runs a commit this repository does not have: deploy", () => {
    expect(decide(facts({ deployed: null }))).toEqual({ deploy: true, reason: "staging does not say what it runs" });
    expect(decide(facts({ deployedKnown: false }))).toEqual({ deploy: true, reason: `staging runs ${DEPLOYED}, which is not a commit of this repository` });
  });

  test("a commit older than the one staging runs: never, so a re-run of an old check does not go back in time", () => {
    expect(decide(facts({ olderThanDeployed: true }))).toEqual({ deploy: false, reason: `${SHA} is older than ${DEPLOYED}, which staging runs` });
  });

  test("what staging runs never passed its smoke: deploy, whatever changed, so a deploy cut in half is finished", () => {
    expect(decide(facts({ deployedSmoked: false, codeChanged: false }))).toEqual({ deploy: true, reason: `staging runs ${DEPLOYED}, which never passed its smoke` });
  });

  test("the commit staging runs, smoked: nothing to do", () => {
    expect(decide(facts({ deployed: SHA, codeChanged: false }))).toEqual({ deploy: false, reason: `staging runs ${SHA} already, smoked` });
  });

  test("otherwise, code changed since: deploy; documents alone: not", () => {
    expect(decide(facts())).toEqual({ deploy: true, reason: `code changed since ${DEPLOYED}` });
    expect(decide(facts({ codeChanged: false }))).toEqual({ deploy: false, reason: `documents alone changed since ${DEPLOYED}` });
  });
});

describe("the facts as the workflow passes them", () => {
  const env = { MANUAL: "false", COMMIT: SHA, DEPLOYED: DEPLOYED, DEPLOYED_KNOWN: "true", OLDER: "false", SMOKED: "true", CHANGED: "true" };

  test("read from the environment", () => {
    expect(factsFrom(env)).toEqual(facts());
    expect(factsFrom({ ...env, DEPLOYED: "" }).deployed).toBeNull();
  });

  test("a flag that is not true or false, or a commit that is not whole, is refused in words", () => {
    expect(() => factsFrom({ ...env, SMOKED: "" })).toThrow('SMOKED must be "true" or "false", got "".');
    expect(() => factsFrom({ ...env, COMMIT: "8a4b246" })).toThrow('COMMIT must be a whole commit SHA, got "8a4b246".');
  });
});
