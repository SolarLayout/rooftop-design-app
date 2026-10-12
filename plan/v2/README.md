# V2: the product made usable by a new user alone

Opened 2026-10-12 by the owner. The end goal, in his words: new users can use it on their own immediately; they
just "get it". V2 is the build of the version that fixes every issue in `audit.md` and applies the voice of
`voice.md` to every word the user meets: the UI, the UX, the visual design and the information architecture revised
with progressive disclosure, the next step always in view, a clear way out of every problem, and language that is
standard and direct, never tautological, flowery, emotional, dramatic or sentimental, at the bar of Stripe and
Vercel.

| File | What it is |
|---|---|
| `audit.md` | What V2 fixes: every issue found in a walk of the whole app at three sizes, a reading of every string and a measurement of type, colour, spacing and placement, in twelve categories with a priority each (121 issues, 11 of them P0). Its "ten that matter most" is the order of work |
| `voice.md` | The voice V2 applies: rules with examples from the app; the vocabulary (one name per thing); a checklist for every pull request that changes a word |
| `strings-inventory.md` | The evidence behind the audit's language category and the worklist for applying the voice: every user-facing string with its file and line |

The audit's directions are proposals. Each screen of V2 is designed on the canvas and approved before it is built, as
every screen of this product is (`docs/design/README.md`); the vocabulary's renames in `voice.md` §6 are proposals
too, each to be approved before the word changes. Decisions closed in `plan/STATE.md` stay closed.

The order of work: the V2 design as boards on a page of the design canvas (resume prompt `plan/resume/020-v2-design.md`),
approved or tweaked by the owner; then the GitHub epic and its issues, one per screen or part, each naming the audit's
issues it closes; then the build, one pull request per issue, the help kept true with it (`docs/help-upkeep.md`).
