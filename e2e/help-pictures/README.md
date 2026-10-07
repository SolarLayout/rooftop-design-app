# e2e/help-pictures

The pictures of the in-app help's how-tos (D81): taken from the app itself, never drawn by hand and never edited after.
This folder is a Playwright run of its own, as the soak of Present is; the check never runs it.

| File | What |
|---|---|
| `playwright.config.ts` | One Chromium on the test stack, at twice the pixels, software WebGL as the tests have it |
| `help-pictures.ts` | Opens the demo roof on Find (Edit, in the Roof lens), does each picture's acts, cuts out the roof with its margin |
| `ground.jpg` | The plain ground served in place of the satellite imagery: no imagery to license, nothing behind the roof |
| `../../tools/help/pictures.ts` | What each picture shows (pure, tested by `bun test tools/help`): the window, the margin, the acts |

Run it from the root:

```sh
bun help:pictures                         # every how-to
bun help:pictures -g find/move-the-roof   # one how-to, by its folder
```

The test stack is started when it is not running, and stopped after in that case. Nothing leaves this machine: the
fixtures' guard refuses every other request (`e2e/fixtures.ts`). The pictures are written to
`apps/web/public/help/<dir>/<n>.jpg` and committed with the change that needs them; look at each one before the commit, and
put them in the pull request. How to add a how-to's pictures, and the rules they keep: `docs/help-content.md`, "Pictures".

Once on a machine: `cd e2e && bun x playwright install chromium` (the root `README.md`).
