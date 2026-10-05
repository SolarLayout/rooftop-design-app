# 016: Phase 13, optimization: the owner's interview first, then the plan

Written: 2026-10-05, by session 16, at the owner's ask. Status: open. After 015 (Phase 12).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 13: optimization (plan/phase-13-optimization.md):
the engine lean in time and memory on AWS Lambda, every unsound algorithm found and fixed, the engine's numbers unchanged. The owner
has many inputs on the code that takes so much memory, so this session STARTS WITH AN INTERVIEW OF THE OWNER, and writes no code and
no plan until the interview is done.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, plan/STATE.md (check it against reality: both environments should answer /api/health with
commit 666368a), plan/SESSIONS.md, plan/README.md (decisions; D58 to D63 are Phase 12's, D61 is the memory), plan/phase-13-optimization.md,
GitHub issues #96 (the memory of a design run: the measurements and the suspects), #76 (the API lean for Lambda) and #98, then
plan/reference/api-profile.md (Phase 11's profile by step), plan/phase-12-deployment.md "As built (so far)" and plan/sessions/016/record.md.

Then read the engine's hot paths enough to ask informed questions and to point at code while asking, without measuring or changing
anything yet: apps/api/src/rooftop_core/options.py (the candidates and their threads), simulation.py, stringing.py, onediode.py, the
shading (find where the hourly shading for every module is computed), memo.py, and apps/api/tools/profile_engine.py. Note, for yourself,
where arrays of 8,760 hours times modules or strings are made, their dtypes, the Python loops over modules, strings or hours, and
anything quadratic.

THE INTERVIEW. Ask the owner one question at a time, and wait for each answer. Start open ("what have you seen or suspect in the
engine's code?"), then follow what he says; cover at least: where he suspects bad code and why; the standard he wants (vectorised
numpy, no Python loops over hours or modules, dtypes, no O(n²), no frames materialised whole, what may be recomputed or cached); what
must not change (the engine's numbers to the bit? the desktop app's results?); the targets in numbers (peak memory and time of a run
at the roof limit and of the demo, on Lambda; the functions' memory after fitting; the cold start); how to measure (memray,
tracemalloc, py-spy; on Lambda or in the image here); the order of the work and the size of pull requests; what of Phase 12 waits
(#99 the operator's guide and the dry run, #100 the production guards) and whether any of it comes before or beside Phase 13.
Record his answers word for word in plan/sessions/017/owner-messages.md as you go, and a summary by theme in
plan/reference/phase-13-interview.md. When he says the interview is done, read the summary back to him for corrections.

Then the plan of the phase, as plan/phase-12-plan.md and plan/phase-11-plan.md were written (what was found, the pull requests, the
steps with their tests and their before-and-after numbers, the decisions with their why, the risks, what done means), built on the
interview. Show it, explain it item by item in plain words, and he keeps, drops or changes each. Then build in pull requests, test
first; each fix with its numbers before and after, measured on staging (the owner deploys or says to; deploys are by hand, D59).

Decide small and medium things yourself and say what you decided; ask only the major ones, one at a time. Documents alone go to
main directly (D26); code never does. Update plan/STATE.md before you stop.
```

## Notes for the owner and the session

- **What stands.** Staging and production run `666368a`, deployed by hand and smoked. The functions have 10,240 MB and run the options in
  one thread, set by the image (D61). At the roof limit: 5,652 MB and 117 s with one thread; 10,215 MB with two (#96).
- **Traps known at handover.**
  - Deploys are by hand only (`gh workflow run deploy -f environment=Staging`, then Production); nothing deploys on a push (D59).
  - AWS: profile `journium-dev`, always `--region ap-south-1`. The permission system refuses `aws iam create-role` from the session, so the
    owner runs IAM commands. Write commands for bash; under zsh never keep several options in one variable.
  - The Vercel CLI is at `~/.bun/bin/vercel` (not on the shell's PATH); `--scope solarlayout`.
  - Docker Desktop must be running to build the image here. Measuring in the image (`docker run`, cgroup `memory.peak`) is close to Lambda;
    Lambda's own `Max Memory Used` (the REPORT line) is the instance's high-water mark, so measure one kind of run per fresh instance.
  - A failed `bun check` stops the work: no commit, no pull request after it.
  - The engine's numbers are held by `tests/engine/test_demo_numbers.py`, which runs in every pytest run.
