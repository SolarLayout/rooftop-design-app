# 019: The first new cloud session: see the map work from the cloud, then the owner's next task
Written: 2026-10-11, by a Claude Code cloud session (#198). Status: open.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo, in a Claude Code cloud session. Read CLAUDE.md, then
plan/STATE.md (check it against git, the open pull requests and the code), then plan/SESSIONS.md. Follow the owner's
standing instructions in plan/STATE.md ("In flight"), and his decision of 2026-10-11: the browser tests are set aside (they
are broken and will be fixed later). Run no browser group; `bun check --skip=e2e` is the check before every commit.

The cloud differs from the owner's Mac; know it before you start:
- The SessionStart hook (.claude/hooks/session-start.sh, #198) has installed the dependencies: confirm node_modules and
  apps/api/.venv exist, and that /opt/pw-browsers/chromium-1169 points at the container's Chromium.
- There is no gh CLI and no Playwright MCP. Use the GitHub MCP tools for pull requests and checks (where SESSIONS.md says
  `gh pr list`). For the browser, write a Node script that imports @playwright/test, keep it in your scratchpad, copy it into
  e2e/ to run it (`node e2e/<script>.mjs`; Node 22 is on PATH here) and delete the copy after; save screenshots to the
  scratchpad, not to the repo.
- The owner cannot open the app: it runs inside the container. Your screenshots are what he sees; send them to him.
- The test stack is the only stack: `bun dev:bg --profile test` (web on localhost:4710, API on 4711).
- Never print, log or commit NEXT_PUBLIC_ESRI_API_KEY. It comes from the cloud environment's settings, not .env.local.

1. The map from the cloud. The owner regenerated the Esri key with http://localhost:4710 and http://127.0.0.1:4710 among its
   referrers and put it in this environment; the session that set the cloud up still held the old key, so this was never
   seen to work. Check it:
   a. Geocoding with the referrer of the test stack: curl -s -e http://localhost:4710/ "https://geocode-api.arcgis.com/
      arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=Pune&token=$NEXT_PUBLIC_ESRI_API_KEY" must give
      suggestions, not error 498. Then the same from 127.0.0.1:4710.
   b. In the app, at 1440: Home's search, a place typed and picked, Find opening at it with the imagery under the outline
      tools. A screenshot of each, sent to the owner.
   If it fails, say what failed and stop there: the key's referrers are the owner's to change, one step at a time
   (CLAUDE.md, "Working with the owner").
2. Then ask the owner for the next task, and work it by the rules above.
Before stopping: plan/STATE.md (the map's result in the "Next" line), and this prompt's status in plan/resume/README.md.
```

## Notes for the owner

- Step 1 takes a few minutes. When it passes, the cloud can do everything but the browser tests, which you set aside.
- If geocoding still says 498, the key in the cloud environment is not the regenerated one, or its referrers are not
  saved on it. The fix is in the ArcGIS dashboard and the environment's settings, not in the code.
