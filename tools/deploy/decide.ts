// Whether a green check of main deploys staging (plan/phase-12-plan.md, decision 7). The workflow gathers the facts
// (.github/workflows/deploy-staging.yml, the job "decide"); the rule is here, where it is tested.

export type Facts = {
  /** Started by hand. */
  manual: boolean;
  /** The commit the check passed on. */
  commit: string;
  /** The commit staging's API names, or null when staging does not answer. */
  deployed: string | null;
  /** Whether that commit is one of this repository's. */
  deployedKnown: boolean;
  /** Whether the commit is an ancestor of the deployed one (and not the same). */
  olderThanDeployed: boolean;
  /** Whether the deployed commit's image carries the tag of a smoke passed. */
  deployedSmoked: boolean;
  /** Whether anything but documents changed between the deployed commit and this one. */
  codeChanged: boolean;
};

export type Decision = { deploy: boolean; reason: string };

export function decide(facts: Facts): Decision {
  const { commit, deployed } = facts;
  if (facts.manual) return { deploy: true, reason: "started by hand" };
  if (deployed === null) return { deploy: true, reason: "staging does not say what it runs" };
  if (!facts.deployedKnown) return { deploy: true, reason: `staging runs ${deployed}, which is not a commit of this repository` };
  if (facts.olderThanDeployed) return { deploy: false, reason: `${commit} is older than ${deployed}, which staging runs` };
  if (!facts.deployedSmoked) return { deploy: true, reason: `staging runs ${deployed}, which never passed its smoke` };
  if (deployed === commit) return { deploy: false, reason: `staging runs ${commit} already, smoked` };
  if (facts.codeChanged) return { deploy: true, reason: `code changed since ${deployed}` };
  return { deploy: false, reason: `documents alone changed since ${deployed}` };
}

/** The facts as the workflow passes them: environment variables, booleans as "true" or "false". */
export function factsFrom(env: Readonly<Record<string, string | undefined>>): Facts {
  const flag = (name: string): boolean => {
    const value = env[name];
    if (value !== "true" && value !== "false") throw new Error(`${name} must be "true" or "false", got "${value ?? ""}".`);
    return value === "true";
  };
  const commit = env.COMMIT ?? "";
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`COMMIT must be a whole commit SHA, got "${commit}".`);
  return {
    manual: flag("MANUAL"),
    commit,
    deployed: env.DEPLOYED?.trim() || null,
    deployedKnown: flag("DEPLOYED_KNOWN"),
    olderThanDeployed: flag("OLDER"),
    deployedSmoked: flag("SMOKED"),
    codeChanged: flag("CHANGED"),
  };
}
