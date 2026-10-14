# The post that goes with a video

A video made for LinkedIn, Twitter or an email is not delivered alone: the post, the tweet or the email it will be posted
with is written with it, in the video's folder as `post-<channel>.md` (`post-linkedin.md`, `post-twitter.md`,
`post-email.md`), committed with the captions and the narration, and copied beside the cuts at delivery. The owner set
this on 2026-10-10: the words are half the work, and a video handed over without them is posted late or posted badly.
The launch's post on V2, `assets/videos/launch-v2/post-linkedin.md`, is the model for a LinkedIn post (the owner,
2026-10-14: a launch post reads like one, in the form OpenAI, Anthropic, Vercel and Stripe use); October's
`assets/videos/launch/post-linkedin.md`, a description in paragraphs, is kept as the record of that campaign.

The words follow the rule of every copy here: plain, direct, natural full sentences, nothing flowery, dramatic or clipped,
nothing said twice. "Free, no account needed" is the agreed wording; "rooftop solar" is the industry's phrase, never a
bare "rooftops"; the word "bankable" is never used; no business is named; a real roof is "a real roof in <city>".
Numbers in a post are the app's own, from the video's run, and the notes say which and when, so they are checked again
before posting if the engine has changed.

## LinkedIn (`post-linkedin.md`)

A launch or a feature post has four parts, in this order:

- **The hook**, one full, standard sentence that names the product or the feature and what it is: "Introducing
  SolarLayout Rooftop, an app for designing rooftop PV systems in the browser." A feature: "<Product> now <does what>."
  Under it, one sentence that says what the reader most wants to know next (for the launch, "It is free, and no account
  is needed."). The two fit in the 160 characters LinkedIn shows before "…see more" on a phone. Never a slogan or a
  phrase in place of a sentence ("from the roof on the map to the drawings" was rejected, 2026-10-14), a question, a
  teaser or a superlative.
- **The body**: one sentence on how it starts, then what you get as a list of four to eight bullets (typed "•"), in the
  order the video shows it, each one short full sentence ("It works out the shade on the modules over a year."); then the proof, one or two sentences
  on the roof in the video and its numbers.
- **The availability**: "<Product> is available today", where it runs, and what the reader should know about their
  data, then "The link is in the first comment." (no outbound link in the post: LinkedIn shows a post with one to fewer
  people). Four to seven hashtags on their own line, the industry's: #solar #rooftopsolar #pvdesign #solarenergy, and
  the feature's where there is one.
- **The first comment**, written out, posted within a minute and pinned: the app's link and the docs' link, each on its
  own line as a sentence ("You can open SolarLayout Rooftop at …", "The documentation is at …"), and one sentence asking
  for what is missing.

Two versions: A, about 1,000 to 1,300 characters, the whole form; B, about 500 to 600, the same hook and line, the body
in one paragraph. Count each without its line breaks. Notes for posting: which cut to upload (the voice cut, native
video; the square one for the mobile feed), the thumbnail to set, the first comment and its pin, the bullets pasted as
plain text, the numbers on screen and their date.

## Twitter (`post-twitter.md`)

- One tweet of at most 280 characters with the link in it (Twitter counts a link as 23 characters), the video attached
  (the wide voice cut; under 2 minutes 20 seconds and 512 MB, which every cut here is). One or two hashtags at most.
- A second version as a thread of three: what it is, what the video shows, the link; each tweet whole on its own.
- Notes for posting: the cut, the thumbnail (Twitter takes one from the video, so the first second must read; the fade in
  from black is 0.5 s, say so), the time.

## Email (`post-email.md`)

- The subject (under 50 characters, plain, no exclamation), the preheader (under 90), and the body: the GIF as the hero
  at the top linking to the app (the email GIF of `plan-gif-640.json`, hosted at `solarlayout.app/email/<name>.gif`;
  the first frame stands alone because Outlook shows only the first frame), three or four short paragraphs, one button or
  link to the app, one line to the docs, and the sender's line. Plain text and the HTML both, if the campaign tool takes
  both.
- Notes for sending: the GIF's weight (the 640 at about 2 MB, the 800 only if the weight is accepted), the alt text of
  the GIF (the hook caption's words), the link with its campaign parameters if the owner uses them.

## Checking a post

Read it once aloud in your head: every sentence a complete one, nothing twice, no word of marketing, and none of the
absolutes the owner rejected (2026-10-14): "every", "each", "whole", "entire", "all" and the like, where the plain noun
says it ("the shade on the modules over a year", not "the shade on every module for the whole year"). Count the
characters of the version with a limit (`wc -m`). Confirm every number against the frames of the video. Say in the
delivery which versions were written and that the owner approves the words before posting.
