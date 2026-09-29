# Resume prompt

Start a new session in `/Users/arunkpatra/codebase/rooftop-design-app` and paste the block below.
It does not change from session to session: the state is in the repo, not in the prompt.

```
Continue the SolarLayout Rooftop web rebuild in this repo.

This is a long project worked in phases over many sessions. Everything you need is in the repo;
you have no memory of earlier sessions and must not assume any.

1. Read, in this order: CLAUDE.md, plan/STATE.md, plan/SESSIONS.md, plan/README.md.
2. Follow "Start of a session" in plan/SESSIONS.md exactly, including the checks of git, open pull
   requests, the running stacks, and a green `bun check`.
3. Take the first item under "Next, in order" in plan/STATE.md. If something is listed under
   "In flight", finish that first: review it, verify it yourself, merge it.
4. Read the phase file for that slice and the references it names before writing anything.
   For UI work, read docs/design/README.md and build to the approved mockups.
5. Work test-first, production grade, one change per pull request. You may commit, push and
   merge pull requests yourself once the check is green.
6. Be brief. Decide small things yourself and tell me. Ask me only for major decisions, one at a
   time. Show me each finished part.
7. Before you stop, follow "End of a session" in plan/SESSIONS.md: update plan/STATE.md and the
   phase file, merge that, and tell me the state in a few lines.

Start by telling me what you found and what you will do in this session.
```

## To point a session at something specific

Add one line at the end of the block, for example:

- `In this session: Phase 2, part 2 only.`
- `In this session: draw the remaining Studio screens for phone and tablet (Phase 0).`
- `In this session: Phase 4, and start by reading plan/reference/map-providers.md.`
