# Session 21: the installable web app (2026-10-08)

The owner asked to pull up issue #147 (on iPhone Safari the address bar takes space from the app) and start on it. Just
before, the same day, #148 (the Studio's empty band on phone) was fixed by #149; its reasons are in that pull request and
its commit. The owner's words are in `owner-messages.md`. The log:
`~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/49fa8d62-0d96-4fab-8a67-b3ae5b0ded4d.jsonl`.

## Standing instructions kept

Those of sessions 18 to 20: no browser test suites and no new UI tests; logic tested first with `bun test`; each change
checked by hand in the browser on the test stack, screenshots in the pull request (the page not opened to check them);
pull requests one after the other, merged on a green check, never stacked; documents to `main` alone (D26).

## What was done

| What | Where |
|---|---|
| The fast check failed on a clean main: "a group's suites are inputs of that group alone" globbed the disk once per suite and group (about 400 scans) and ran past bun's 5 s. Each group's files found once: 6.5 s to 0.3 s | #150 |
| The safe areas: `viewport-fit=cover`; tokens `--safe-top/right/bottom/left` = `env(safe-area-inset-*, 0px)`; functional utilities `pt-safe-`, `pb-safe-`, `pl-safe-`, `pr-safe-`, `px-safe-`, `top-safe-`, `bottom-safe-`, `h-safe-` (a step or a name of the spacing and the inset); the top bar and Home's header `box-content pt-safe-0`; every part at the top or bottom edge moved; the sides kept clear by the body and the full-screen overlays; `tablet-wide` and `desktop-wide` made container queries on the shell (`@container/shell`) | #151, D86 |
| The manifest, the icons drawn from the mark with `next/og` (192, 512, maskable 512, Apple 180), `appleWebApp` black-translucent, `theme-color`; `lib/brand` (name, colours, mark; tests hold the colours to the tokens and `icon.svg` to the mark), placed in the base of the browser groups | #152 |
| Deployed by the owner and checked on an iPhone from the Home Screen: "works". Issue #147 closed | |

## Why things are as they are

- **Sides by the body, not part by part.** Only a phone on its side has side insets, and it gets the tablet layout. Padding
  the body (and the overlays that cover the screen, which are fixed and ignore it) gives the same bands a Safari tab shows
  without `cover`, with a handful of changes instead of one per overlay of the stage.
- **The top bar's widths are the shell's.** With `cover` the media queries see the whole screen: an iPhone on its side is
  844 wide with 750 between the bands, `tablet-wide` switched on and Export was cut off. A media query cannot read `env()`,
  so the two variants became container queries on the shell's root, whose content box leaves the bands out. The shell's root
  is now a size container: a fixed element inside it would be held by it; all inside it are dialogs or popovers, in the top
  layer, so none is. Where there are no insets the boxes measured the same to the pixel.
- **Insets faked through the tokens for the screenshots.** WebKit here cannot show the installed mode; since every inset is
  read through `--safe-*`, setting them on `:root` in the browser shows each device (iPhone 47/34, on its side 47 each side
  and 21 below, iPad 24/20), the unsafe bands shaded magenta.
- **Icons drawn by code**, not files of pixels: no image tool on this machine (no sharp, no rsvg), one mark for all; the
  maskable one is the same drawing to the edges, a test holding the ridge inside the circle a launcher keeps. They are
  `icon.svg`'s (dark ground, light ridge), not the orange logo of the top bar, as the issue said; the owner did not ask
  otherwise.
- **The colours in `lib/brand`, written once more.** The browser paints the splash, the bars and the icon before the
  stylesheet; `tokens-only.test.ts` forbids a raw colour in `app/` and `components/`, so the hex values live in `lib/brand`
  and a test holds them equal to `--color-ground` and `--color-text`.

## Left, and dropped

- Item 4 of #147, a hint to Add to Home Screen on iPhone Safari: Safari offers no install prompt of its own. The owner:
  "skip it for now".
- Found, not changed: on a phone on its side Find's sheet (384) fills the 390 of the screen and hides the map, as before.
- Tooltips and lists placed by script keep 8 from the screen's edge (`SCREEN_MARGIN`), not from the safe areas.
