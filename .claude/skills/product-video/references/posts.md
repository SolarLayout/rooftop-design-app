# The post that goes with a video

A video made for LinkedIn, Twitter or an email is not delivered alone: the post, the tweet or the email it will be posted
with is written with it, in the video's folder as `post-<channel>.md` (`post-linkedin.md`, `post-twitter.md`,
`post-email.md`), committed with the captions and the narration, and copied beside the cuts at delivery. The owner set
this on 2026-10-10: the words are half the work, and a video handed over without them is posted late or posted badly.
The launch's post, `assets/videos/launch/post-linkedin.md`, is the model, approved by the owner.

The words follow the rule of every copy here: plain, direct, natural full sentences, nothing flowery, dramatic or clipped,
nothing said twice. "Free, no account needed" is the agreed wording; "rooftop solar" is the industry's phrase, never a
bare "rooftops"; the word "bankable" is never used; no business is named; a real roof is "a real roof in <city>".
Numbers in a post are the app's own, from the video's run, and the notes say which and when, so they are checked again
before posting if the engine has changed.

## LinkedIn (`post-linkedin.md`)

- Two versions: A, about 800 to 1,000 characters, what the video shows in the order it shows it, then the roof, then
  "free, no account needed, in the browser"; B, about 400 to 500 characters, the same in one paragraph.
- No outbound link in the post (LinkedIn shows a post with a link to fewer people): "The link is in the first comment",
  and the first comment written out, with the app's address and the docs'.
- Four to seven hashtags on their own line, the industry's: #solar #rooftopsolar #pvdesign #solarenergy, and the
  feature's where there is one.
- Notes for posting: which cut to upload (the voice cut, native video; the square one for the mobile feed), the
  thumbnail to set, the link in the first comment within a minute, the numbers on screen and their date.

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

Read it once aloud in your head: every sentence a complete one, nothing twice, no word of marketing. Count the
characters of the version with a limit (`wc -m`). Confirm every number against the frames of the video. Say in the
delivery which versions were written and that the owner approves the words before posting.
