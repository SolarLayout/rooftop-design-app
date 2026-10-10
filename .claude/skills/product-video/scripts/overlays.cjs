// Renders a video's text layers with the app's own fonts, through Chromium: the captions (transparent PNG, one per
// caption and cut), the end card, and the thumbnails over a frame. The words are assets/videos/<video>/captions.json.
//
//   node overlays.cjs <video> captions              -> <work>/<video>/overlays/<name>-wide.png and -square.png, end-*.png
//   node overlays.cjs <video> thumb <frame.jpg>     -> <work>/<video>/overlays/thumb-wide.png and thumb-square.png
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, playwright, videoDir, workOf, readJson } = require("./paths.cjs");
const { chromium } = playwright();

/** The app's fonts: Bricolage Grotesque for display, Geist for text, Geist Mono for the eyebrows. */
function fonts(into) {
  fs.mkdirSync(into, { recursive: true });
  // The web app's copy of geist (bun lays packages under node_modules/.bun and links them where they are depended on).
  const geist = path.join(ROOT, "apps", "web", "node_modules", "geist");
  if (!fs.existsSync(geist)) throw new Error("The geist fonts are not installed at " + geist + ": run `bun install`.");
  for (const [name, from] of [
    ["bricolage.woff2", path.join(ROOT, "apps", "web", "app", "fonts", "bricolage-grotesque-latin.woff2")],
    ["geist.woff2", path.join(geist, "dist", "fonts", "geist-sans", "Geist-Variable.woff2")],
    ["geistmono.woff2", path.join(geist, "dist", "fonts", "geist-mono", "GeistMono-Variable.woff2")],
  ]) fs.copyFileSync(from, path.join(into, name));
}

const CSS = `
@font-face { font-family: 'Bricolage'; src: url('bricolage.woff2') format('woff2'); font-weight: 200 800; }
@font-face { font-family: 'Geist'; src: url('geist.woff2') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'GeistMono'; src: url('geistmono.woff2') format('woff2'); font-weight: 100 900; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; background: transparent; }
body { font-family: 'Geist', system-ui, sans-serif; color: #F2F4F7; -webkit-font-smoothing: antialiased; }
.fade { position: absolute; left: 0; right: 0; bottom: 0; height: var(--fade-h); background: linear-gradient(to top, rgba(11,14,19,.88) 0%, rgba(11,14,19,.62) 45%, rgba(11,14,19,0) 100%); }
.caption { position: absolute; left: var(--x); bottom: var(--y); max-width: var(--w); display: flex; flex-direction: column; gap: var(--gap); }
.eyebrow { font-family: 'GeistMono', monospace; font-size: var(--eyebrow); letter-spacing: .12em; text-transform: uppercase; color: #FFB020; font-weight: 500; }
.head { font-family: 'Bricolage', sans-serif; font-weight: 600; font-size: var(--head); line-height: 1.06; letter-spacing: -0.02em; color: #F2F4F7; text-wrap: balance; }
.sub { font-size: var(--sub); line-height: 1.35; color: #C3CAD5; font-weight: 400; max-width: var(--subw); }
.mark { display: inline-flex; align-items: center; gap: .55em; font-family: 'Bricolage', sans-serif; font-weight: 600; letter-spacing: -0.01em; }
.mark svg { width: 1.15em; height: 1.15em; }
.mark .light { font-weight: 500; color: #A9B2C0; }
.ground { position: absolute; inset: 0; background: #0B0E13; }
.glow { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 60% at 50% 110%, rgba(255,176,32,.18), transparent 70%); }
.frame { position: absolute; inset: 0; background-size: cover; background-position: center; }
.shade { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(11,14,19,.92) 0%, rgba(11,14,19,.78) 38%, rgba(11,14,19,.15) 70%, rgba(11,14,19,0) 100%); }
.card { position: absolute; display: flex; flex-direction: column; gap: 10px; max-width: 860px; padding: 26px 34px 28px; border-radius: 18px; background: rgba(12,16,22,.86); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 18px 50px rgba(0,0,0,.45); }
.card .eyebrow { font-size: 19px; } .card .head { font-size: 50px; } .card .sub { font-size: 26px; color: #B7BFCB; }
.card.bl { left: 96px; bottom: 110px; } .card.bc { left: 43%; transform: translateX(-50%); bottom: 96px; min-width: 720px; } .card.tl { left: 96px; top: 150px; } .card.tr { right: 400px; top: 140px; } .card.tl-find { left: 28px; top: 104px; }
.pill { display: inline-flex; align-items: center; gap: .5em; border: 1.5px solid rgba(255,255,255,.22); border-radius: 999px; padding: .35em .9em; font-size: var(--pill); color: #E6EAF0; background: rgba(11,14,19,.35); }
.dot { width: .5em; height: .5em; border-radius: 50%; background: #3DD6A0; }
`;
/** The cards on the square cut: sized and placed for 1080 wide. */
const SQUARE_CARDS = `.card{max-width:900px;padding:22px 28px 24px} .card .head{font-size:44px} .card .sub{font-size:24px} .card .eyebrow{font-size:18px} .card.bl{left:48px;bottom:130px} .card.br{left:auto;right:48px;bottom:130px} .card.tl{left:48px;top:160px} .card.tr{right:48px;top:140px}`;
/** The mark of the product, as components/shell/Logo.tsx draws it. */
const LOGO = `<svg viewBox="0 0 26 26" fill="none"><rect x="1" y="1" width="24" height="24" rx="7" fill="#FFB020"/><path d="M6 17.5 13 8l7 9.5" stroke="#1A1204" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 17.5h7" stroke="#1A1204" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const mark = (size) => `<span class="mark" style="font-size:${size}px">${LOGO}<span>SolarLayout <span class="light">Rooftop</span></span></span>`;
const pills = (words) => (words || []).map((w) => `<span class="pill"><span class="dot"></span>${w}</span>`).join("");

/** The two cuts: wide (1920x1080) and square (1080x1080, full bleed). */
const LAYOUT = {
  wide: { w: 1920, h: 1080, vars: "--x:96px; --y:92px; --w:1200px; --gap:14px; --eyebrow:22px; --head:66px; --sub:30px; --subw:1100px; --fade-h:400px; --pill:24px" },
  square: { w: 1080, h: 1080, vars: "--x:64px; --y:84px; --w:960px; --gap:12px; --eyebrow:20px; --head:58px; --sub:28px; --subw:940px; --fade-h:420px; --pill:22px", square: true },
};

const page = (layout, style, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${style}</style></head><body style="${layout.vars}">${body}</body></html>`;

/** A caption: a card placed where the screen is empty (`place`, `sqPlace`), or the words at the bottom left over a fade. */
function captionHtml(layout, c) {
  const place = layout.square ? c.sqPlace : c.place;
  const words = `${c.eyebrow ? `<div class="eyebrow">${c.eyebrow}</div>` : ""}${c.brand ? `<div>${mark(c.brand)}</div>` : ""}<div class="head">${c.head}</div>${c.sub ? `<div class="sub">${c.sub}</div>` : ""}`;
  if (place) return page(layout, layout.square ? SQUARE_CARDS : "", `<div class="card ${place}">${words}</div>`);
  return page(layout, "", `<div class="fade"></div><div class="caption">${words}${c.pill ? `<div style="margin-top:10px"><span class="pill"><span class="dot"></span>${c.pill}</span></div>` : ""}</div>`);
}

function endHtml(layout, end) {
  const sq = Boolean(layout.square);
  const style = `.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${sq ? 26 : 30}px}
  .url{font-family:'Bricolage',sans-serif;font-weight:600;font-size:${sq ? 74 : 96}px;letter-spacing:-0.025em;color:#F2F4F7} .url b{color:#FFB020;font-weight:600}
  .line{font-size:${sq ? 28 : 32}px;color:#A9B2C0} .pills{display:flex;gap:14px;margin-top:${sq ? 6 : 10}px}`;
  return page(layout, style, `<div class="ground"></div><div class="glow"></div><div class="end"><div>${mark(sq ? 44 : 52)}</div><div class="url"><b>rooftop</b>.solarlayout.app</div><div class="line">${end.line}</div><div class="pills">${pills(end.pills)}</div></div>`);
}

function thumbHtml(layout, thumb, framePath) {
  const sq = Boolean(layout.square);
  const style = `.t{position:absolute;left:${sq ? 64 : 110}px;top:50%;transform:translateY(-50%);max-width:${sq ? 900 : 980}px;display:flex;flex-direction:column;gap:${sq ? 22 : 26}px}
  .t .head{font-size:${sq ? 96 : 118}px;line-height:1.0} .t .sub{font-size:${sq ? 34 : 40}px;color:#D5DAE2} .badge{position:absolute;right:${sq ? 56 : 96}px;bottom:${sq ? 56 : 80}px;font-size:${sq ? 26 : 30}px}`;
  const frame = `<div class="frame" style="background-image:url('file://${framePath}');background-size:cover;background-position:${sq ? thumb.squarePosition ?? "38% 50%" : thumb.position ?? "0% 50%"}"></div><div class="shade"></div>`;
  return page(layout, style, `${frame}<div class="t"><div>${mark(sq ? 40 : 46)}</div><div class="head">${thumb.head}</div><div class="sub">${thumb.sub}</div><div style="margin-top:6px;display:flex;gap:14px">${pills(thumb.pills)}</div></div><div class="badge pill">rooftop.solarlayout.app</div>`);
}

(async () => {
  const [video, what = "captions", frameArg] = process.argv.slice(2);
  const words = readJson(path.join(videoDir(video), "captions.json"));
  const work = workOf(video);
  const html = path.join(work, "html");
  const out = path.join(work, "overlays");
  fonts(html);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const [key, layout] of Object.entries(LAYOUT)) {
    const ctx = await browser.newContext({ viewport: { width: layout.w, height: layout.h }, deviceScaleFactor: 1 });
    const tab = await ctx.newPage();
    const jobs = [];
    if (what === "captions") {
      for (const c of words.captions) jobs.push({ name: `${c.name}-${key}`, html: captionHtml(layout, c), transparent: true });
      if (words.end) jobs.push({ name: `end-${key}`, html: endHtml(layout, words.end), transparent: false });
    } else if (what === "thumb") {
      const frame = path.resolve(frameArg || "");
      if (!fs.existsSync(frame) || !words.thumb) throw new Error("Usage: node overlays.cjs <video> thumb <frame.jpg> (and a \"thumb\" in captions.json)");
      jobs.push({ name: `thumb-${key}`, html: thumbHtml(layout, words.thumb, frame), transparent: false });
    } else throw new Error("Usage: node overlays.cjs <video> captions | thumb <frame.jpg>");
    for (const job of jobs) {
      const file = path.join(html, `${job.name}.html`);
      fs.writeFileSync(file, job.html);
      await tab.goto("file://" + file);
      await tab.evaluate(() => document.fonts.ready);
      await tab.waitForTimeout(150);
      await tab.screenshot({ path: path.join(out, `${job.name}.png`), omitBackground: job.transparent, type: "png" });
      console.log("rendered", job.name);
    }
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
