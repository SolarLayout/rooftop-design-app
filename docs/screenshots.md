# Screenshots: how they are taken, kept and linked

Three kinds of picture are made of the app, each its own way. None is drawn or edited by hand.

| Kind | What it is for | How |
|---|---|---|
| A pull request's screenshots | Proof that a change was looked at, on every size it reaches | By hand in the browser on the test stack; kept on the branch `pr-shots` (below) |
| The pictures of the help's how-tos | Part of the product: the steps of a how-to (D81) | `bun help:pictures`: `docs/help-content.md`, "Pictures" |
| A board's preview and its images on the canvas | The design, for approval | The board's script; `docs/design/README.md` and "Boards" below |

## A pull request's screenshots

The owner's standing instruction (session 18): no browser test suites are run and no new UI tests are written; each change
is checked by hand in the browser, and its screenshots go into the pull request.

1. **The test stack, never the dev stack:** `bun dev:bg --profile test`; its port is in `.dev/test/pids.json` (4710 unless
   taken). `bun status` shows both.
2. **The browser:** the Playwright MCP's `browser_run_code_unsafe`, with a script in `.playwright-mcp/` (ignored by git:
   scratch, one per change). A script opens one context per size, so each size is a fresh device:

   | Size | Viewport | Input |
   |---|---|---|
   | desktop | 1440 × 900 | mouse: `click` |
   | tablet | 834 × 1194 | touch: `hasTouch`, `isMobile`, `tap` |
   | phone | 390 × 844 | touch: `hasTouch`, `isMobile`, `tap` |

   All at `deviceScaleFactor: 2`. The template below.
3. **Reach the state as a user would** (press, type, drag), read what the screen says and return it from the script, so the
   result is in words as well as in pictures; collect `pageerror`s and report them.
4. **Look at every screenshot** before it is used. One that shows something wrong is a finding: fix it, or say it in the
   pull request.
5. **Keep them on `pr-shots`:** `bun tools/pr-shots.ts <folder> <file>...`, one folder a pull request
   (`help-topics-roof`). The tool commits them to the orphan branch `pr-shots` with git's plumbing (the working tree and the
   branch checked out are not touched), pushes it, and prints a table of links by the commit, so a link never changes.
   The links are `https://github.com/<repo>/blob/<commit>/<path>?raw=true`: the form GitHub shows in a private repository to
   those who can read it. Never `raw.githubusercontent.com`, which answers 404 without a token: the pictures do not show.
6. **The description:** "How it was checked" says what was run, pressed and read, and what was not; "Screenshots" holds the
   table, each row named by size and state. **Every pull request that changes what is seen** (a screen, a state, a design,
   the way something is done) has its screenshots in its description, at each size it reaches; none is merged without.
7. **Look at the description on GitHub** after it is opened (`gh pr view <n> --web`, or the page): the pictures show. A
   picture that does not show is fixed before anything else.

```js
// .playwright-mcp/<change>.js, run with browser_run_code_unsafe { filename }
async (page) => {
  const browser = page.context().browser();
  const sizes = [
    { name: 'desktop', viewport: { width: 1440, height: 900 }, touch: false },
    { name: 'tablet', viewport: { width: 834, height: 1194 }, touch: true },
    { name: 'phone', viewport: { width: 390, height: 844 }, touch: true },
  ];
  const out = {};
  for (const size of sizes) {
    const ctx = await browser.newContext({ viewport: size.viewport, hasTouch: size.touch, isMobile: size.touch, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    const press = (l) => (size.touch ? l.tap() : l.click());
    await p.goto('http://localhost:4710/studio/roof'); await p.waitForTimeout(6000);
    // … reach the state, read what the screen says into out[size.name] …
    await p.screenshot({ path: `.playwright-mcp/<change>/${size.name}-1-<state>.png` });
    out[size.name] = { ...out[size.name], errors };
    await ctx.close();
  }
  return out;
}
```

Things that catch a script out: an element hidden on one size and shown on another (`.filter({ visible: true })`); an
open dialog that intercepts presses under it; a picture taken before an animation ends (wait for it, or for the state).

## Boards

A board's script writes its `.dc.html` (`python3 -I docs/design/mockups/build_<board>.py`); the images it shows are the
app caught in the browser, as above, into the board's folder under `docs/design/mockups/`. For the canvas the images are
uploaded to the canvas artifact, their addresses kept in the folder's `canvas.json`, and the script run with `--canvas`
writes the copies that use them. A preview is the board rendered at its width: serve the folder
(`python3 -m http.server 4795 --bind 127.0.0.1` in `docs/design/mockups`), take a full-page screenshot of the board at its
`$preview` width, and convert it to JPEG into `docs/design/previews/` (`sips -s format jpeg -s formatOptions 80`). Every
board for approval comes in three sizes (desktop, tablet, phone) on the canvas.
