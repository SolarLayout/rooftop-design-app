# Keeping the help true

The in-app help (`apps/web/content/help`) describes in words what the engine decides and what the screens do. No test fails
when that changes under a topic: the gate (`tools/help`) checks links, keys and typed numbers, not whether a sentence is still
true. So every change that the user meets is checked against the help, in the same pull request, by these steps.

Why it is written down: #164 changed which string lengths the run tries, and the Options topic went on saying "one shorter
than the longest" until the help was read by hand afterwards (#166, session 23).

## When

Every pull request that changes any of these:

- what the engine decides or works out (`apps/api/src/rooftop_core`): layout, shading, sizing, strings, options, energy, the
  read-outs and their words;
- a rule or a limit of the API that the user meets: a refusal, a range, a size;
- words, controls, states or screens of the web app (`apps/web`), the order of things included.

Not needed for a change with no effect the user can see (a refactor, tests, the check, documents) — say so in the pull
request.

## How

1. **Say what changed for the user**, one line each, in the user's terms: "the run tries the length that places the most
   modules", "a CSV over 3 MB is refused".
2. **Find the topics.** The topic of each section the change touches (the `?` beside its heading; its key is its path, as
   `docs/help-content.md` says). Then search every topic for the words and the ideas the change touches, the old wording
   included:
   `git grep -n -i -E "<words>|<ideas>" -- apps/web/content/help`
   For an engine change, search for the ideas too ("row", "length", "inverter", "target"), not only the names.
3. **Read each topic found, whole, claim by claim**, against the code as it is after the change: the engine function or
   the component the claim describes. A claim that is no longer true is changed; one that is now incomplete in a way the
   user would act on is completed. Nothing else is rewritten.
4. **Fix it in the same pull request** as the change, following `docs/help-content.md` ("The steps, every time": the
   manifest, the gate, the topic opened at 1440, 834 and 390, its screenshots in the pull request).
5. **A new section, control or state without a topic**: D80 says which need one (every section heading of an input panel;
   the coverage gate enforces it). Anything else: say in the pull request whether a topic would help, and leave the
   decision to the owner.
6. **Say it in the pull request**, under "How it was checked": `Help: read <topics>; changed <topics>` or
   `Help: no topic describes this (searched: <words>)`.

## The same goes for the boards

When words or a screen that a board shows change, the board follows: its builder in `docs/design/mockups`, the `.dc.html`
it writes, its preview in `docs/design/previews`, and its copy on the canvas, as `docs/screenshots.md` ("Boards") and
`docs/design/README.md` say. Those are documents: one commit to `main` after the pull request is merged (D26).
