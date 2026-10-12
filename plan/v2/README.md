# V2: the product made usable by a new user alone

Opened 2026-10-12 by the owner. The end goal, in his words: new users can use it on their own immediately; they
just "get it". The UI, the UX, the visual design and the information architecture are revised to that end, with
progressive disclosure, the next step always in view, and a clear way out of every problem. The user-facing
language is standard and direct, never tautological, flowery, emotional, dramatic or sentimental; the bar is
Stripe's and Vercel's.

| File | What it is |
|---|---|
| `audit.md` | The first deliverable: every issue found in a walk of the whole app at three sizes and a reading of every string, in eleven categories with a priority each (103 issues, 11 of them P0). Its "ten that matter most" is the order of work |
| `voice.md` | The second deliverable: the voice, as rules with examples from the app; the vocabulary (one name per thing); a checklist for every pull request that changes a word |
| `strings-inventory.md` | The evidence behind the audit's language category: every user-facing string with its file and line |

The audit's directions are proposals. Each screen of V2 is designed on the canvas and approved before it is built, as
every screen of this product is (`docs/design/README.md`); the vocabulary's renames in `voice.md` §6 are proposals
too, each to be approved before the word changes. Decisions closed in `plan/STATE.md` stay closed.

What comes next, once the owner has read both: the order of work agreed, then the design of the first screens (the
first open of the Studio, Find's first step, the problem states) as boards, then the build, one pull request per
screen, the help kept true with it (`docs/help-upkeep.md`).
