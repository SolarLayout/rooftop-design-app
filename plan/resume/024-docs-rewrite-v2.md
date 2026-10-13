# 024: The Rooftop docs rewritten for V2 (solarlayout_desktop_docs, `/docs/rooftop`)
Written: 2026-10-13, by the session that built V2 (#207, merged in #221 to #239) and fixed #238 (#240 to #246), at the
owner's request. Status: open.

## Paste this

Start the session in `/Users/arunkpatra/codebase/solarlayout_desktop_docs`, with `/Users/arunkpatra/codebase/rooftop-design-app`
added as a working directory.

```
You are rewriting the SolarLayout Rooftop docs (`content/rooftop/**`, served at /docs/rooftop) in this repo,
solarlayout_desktop_docs, for V2 of the app. The product repo is ../rooftop-design-app (the browser app apps/web, its in-app
help apps/web/content/help, the API apps/api/src/rooftop_api, the engine apps/api/src/rooftop_core).

Why: the docs were written at rooftop-design-app 5d710ae (2026-10-09). V2 rebuilt the app since: the five steps (Roof, Array,
Strings, Performance, Handover) with Find as Roof's first part, Sun a view on any step, the result chip in place of the
vitals bar, the words of each screen (the vocabulary, D108, D112), Performance, Handover and Home, Present's controls, the help's
32 topics. The owner's words: "The Docs in the docs repo for rooftop needs to be completely re-written since the whole app
in V2 has changed." This is a rewrite, not an update: do not patch the old pages.

Read first, here: CLAUDE.md, docs/WRITING_GUIDE.md ("Writing for the SolarLayout Rooftop tree"),
.claude/skills/update-docs/SKILL.md and references/rooftop.md (the rules, the reader, the screenshots, the gates).
In ../rooftop-design-app: plan/STATE.md, plan/README.md (decisions D94 to D114), plan/v2/voice.md (the voice and §6's one
name a thing), docs/design/information-architecture.md, apps/web/content/help (the 32 topics: the app's own words, which
the docs go deeper than and never contradict), apps/web/lib/docs/docs.ts (how the app links into the docs).

The work, in this order:
1. The fact sheet first. Write docs/PRODUCT_FACTS.rooftop.md again from the code at rooftop-design-app's main (verify the
   sha; record "Verified against main at <sha>"), each fact cited file:line; keep the sheet's form (Known-stale, Facts we do
   not have, Product issues noticed). Use sub-agents by area, each reviewed by another; the citation check:
   `node scripts/check-rooftop-facts-citations.mjs`.
2. The tree, for the owner's approval before any page: the pages and their `##` headings, following V2's places and the help's
   topics (D111: each topic links to its page and section). Show it as a short list; ask one question at a time.
3. The pages, from the sheet alone, in the voice of the writing guide and plan/v2/voice.md. What's new: one dated entry.
4. Screenshots: all of them are retaken, none kept: V2 changed the interface across the app, so each existing image
   under public/screenshots/rooftop/ is stale. Take what the new pages need, by Playwright from production (rooftop.solarlayout.app) for what is deployed, else the product repo's test stack
   (`bun dev:bg --profile test` there; never start or stop its dev profile), at 1440 × 900 (scale 2), 834 × 1194 or 390 × 844
   with touch. Delete the stale images; the manifest content/rooftop/screenshots.ts has a PNG for each id.
5. The gates: `node .claude/skills/update-docs/scripts/check-pages.mjs --product rooftop`, then
   `bun run lint && bun run typecheck && bun run build`, and the e2e suite locally before a deploy.
6. The app's links (issue #238 item 24 of rooftop-design-app): the help topics link by page and heading
   (apps/web/lib/docs/docs.ts DOCS_PAGES, each topic's `docs:` front matter; the gate `badDocsPlaces` refuses a place the
   docs lack). Once the new tree's headings are settled, open one pull request in rooftop-design-app that changes docs.ts
   and the topics' `docs:` to them, with `bun help:gen`; it merges when the docs are live (links break in between
   otherwise: say so to the owner and agree the order). Then close #238.

Rules: one product, one PR in this repo for the rewrite unless the owner says otherwise; ask before merging here (the
owner's git authority is for rooftop-design-app). Deployment of the docs is manual (the Deploy workflow): the owner's.
Words: SolarLayout Rooftop, then Rooftop; Open Rooftop; added to the home screen, never installed; never "bankable"; never
"every" (the owner, 2026-10-13); the roof types by D112 ("Flat, rows facing south", "Flat, rows facing east and west",
"Sloped"; on the Roof step's buttons "Tilted rows", "East-west", "Sloped"); "Modules per string"; no change-log prose on a page.
Be brief with the owner: bullets, no chatter; decide small things, ask the major ones one at a time; show each part.
```

## Notes for the owner
- The first stop is the tree (step 2), for your approval; the fact sheet comes before it and takes the longest.
- The app's help links to the docs by heading: the rooftop-design-app pull request of step 6 and the docs deploy go
  together, in the order you choose.
