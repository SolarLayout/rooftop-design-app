// Records a video's segments from the app on the test stack, a frame at a time under the page's clock, the way
// e2e/help-clips records the help's clips: a 1920x1080 window at twice the pixels, 30 frames a second, JPEG frames into
// <work>/<video>/frames/<segment>/. What is recorded is the video's script, assets/videos/<video>/record.json: segments
// of acts (references/scripting.md). Nothing is drawn by hand; the pointer is a dot drawn into the page.
//
//   node record.cjs <video>                   every segment of the script
//   node record.cjs <video> s5-sun s6-strings only these segments taken (the others run unseen, so the design is the same)
const fs = require("node:fs");
const path = require("node:path");
const { playwright, webUrl, videoDir, workOf, site, readJson } = require("./paths.cjs");
const { chromium } = playwright();

const FPS = 30;
const DT = 1000 / FPS;
/** Software WebGL, as the browser tests have it: the same picture on every machine, no GPU, about 0.4 s a frame, and
 * 12 s a frame once the imagery is the ground of the 3D view. The GPU (a headed browser) is 85 ms a frame. */
const SOFTWARE_GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

/** Into every page: the pointer drawn as a dot (headless shows none), the dev badge and Present's hint hidden, the map's
 * tips put away, the browser's full screen refused (Present asks for it; headed, it would take the screen). */
const INIT = `(() => {
  const dot = document.createElement('div');
  Object.assign(dot.style, { position: 'fixed', left: '-40px', top: '-40px', width: '18px', height: '18px', marginLeft: '-9px', marginTop: '-9px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 0 2px rgba(5,7,10,0.8), 0 2px 6px rgba(0,0,0,0.5)',
    pointerEvents: 'none', zIndex: '2147483647', transition: 'transform 80ms' });
  const add = () => document.body && document.body.appendChild(dot);
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
  addEventListener('pointermove', (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
  addEventListener('pointerdown', () => { dot.style.transform = 'scale(0.75)'; dot.style.background = 'rgba(255,176,32,0.95)'; }, true);
  addEventListener('pointerup', () => { dot.style.transform = 'scale(1)'; dot.style.background = 'rgba(255,255,255,0.92)'; }, true);
  const styled = () => { const style = document.createElement('style');
    style.textContent = 'nextjs-portal{display:none!important} [data-testid=present-hint]{display:none!important} *{cursor:none!important}';
    document.head.appendChild(style); };
  if (document.head) styled(); else addEventListener('DOMContentLoaded', styled);
  try { localStorage.setItem('rooftop.tips-gone', JSON.stringify(['roof', 'obstacle'])); } catch {}
  Element.prototype.requestFullscreen = () => Promise.reject(new Error('not while recording'));
})();`;

const eased = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
/** A name in the script: a plain string, or "/words/" for a regular expression. */
const nameOf = (name) => (typeof name === "string" && name.length > 2 && name.startsWith("/") && name.endsWith("/") ? new RegExp(name.slice(1, -1)) : name);

/** The frames taken, a segment at a time, and the hand: glides eased, presses held a few frames, as the help's clips. */
class Recorder {
  constructor(page, out, only) { this.page = page; this.out = out; this.only = only; this.pointer = { x: 40, y: 1040 }; this.segment = null; this.index = 0; this.total = 0; }
  start(name) {
    if (this.only && !this.only.includes(name)) { log("segment", name, "(unseen)"); this.segment = null; return; }
    this.segment = name; this.index = 0;
    fs.rmSync(path.join(this.out, name), { recursive: true, force: true });
    fs.mkdirSync(path.join(this.out, name), { recursive: true });
    log("segment", name);
  }
  stop() { if (this.segment) log("segment", this.segment, "done:", this.index, "frames"); this.segment = null; }
  async tick(frames = 1) {
    for (let i = 0; i < frames; i++) {
      await this.page.clock.runFor(DT);
      if (this.segment) {
        await this.page.screenshot({ path: path.join(this.out, this.segment, `${String(this.index).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 });
        this.index++; this.total++;
      }
    }
  }
  async glide(to, frames = 24) {
    const from = { ...this.pointer };
    for (let i = 1; i <= frames; i++) {
      const t = eased(i / frames);
      await this.page.mouse.move(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
      await this.tick(1);
    }
    this.pointer = { ...to };
  }
  async press() { await this.page.mouse.down(); await this.tick(4); await this.page.mouse.up(); await this.tick(2); }
  locator(act) {
    if (act.testid) return this.page.getByTestId(act.testid);
    let found = this.page.getByRole(act.role, { name: nameOf(act.name), exact: act.exact ?? false });
    if (act.first !== false) found = found.first();
    return found;
  }
  async centre(locator) {
    const box = await locator.boundingBox();
    if (!box) throw new Error("Not on the screen: " + locator);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  async until(check, max, label) {
    for (let i = 0; i < max; i++) { if (await check()) { log(label, "after", i, "frames"); return true; } await this.tick(1); }
    throw new Error(`${label}: not reached in ${max} frames.`);
  }
  /** One act of the script (references/scripting.md). */
  async act(act) {
    const page = this.page;
    switch (act.act) {
      case "rest": return this.tick(act.frames);
      case "glide": return this.glide({ x: act.x, y: act.y }, act.frames ?? 24);
      case "pointer-away": {
        // A move outside the window sends no pointer event: the drawn dot is put out of sight as well.
        await page.mouse.move(-10, -10); this.pointer = { x: -10, y: -10 };
        await page.evaluate(() => { for (const el of document.body.children) if (el instanceof HTMLElement && el.style.zIndex === "2147483647") Object.assign(el.style, { left: "-40px", top: "-40px" }); });
        return;
      }
      case "click": {
        if (act.x !== undefined) await this.glide({ x: act.x, y: act.y }, act.frames ?? 24);
        else await this.glide(await this.centre(this.locator(act)), act.frames ?? 24);
        await this.tick(act.settle ?? 6);
        return this.press();
      }
      case "type": { for (const ch of act.text) { await page.keyboard.type(ch); await this.tick(act.framesPerChar ?? 2); } return; }
      case "key": await page.keyboard.press(act.key); return this.tick(act.frames ?? 2);
      case "fill": { const field = this.locator(act); await field.fill(act.text); await field.press(act.then ?? "Enter"); return this.tick(act.frames ?? 4); }
      case "drag": {
        const from = { ...this.pointer };
        await page.mouse.down();
        const n = act.frames ?? 60;
        for (let i = 1; i <= n; i++) { const t = eased(i / n); await page.mouse.move(from.x + act.dx * t, from.y + act.dy * t); await this.tick(1); }
        this.pointer = { x: from.x + act.dx, y: from.y + act.dy };
        await page.mouse.up();
        return this.tick(act.settle ?? 2);
      }
      case "until": {
        const max = act.max ?? 300;
        if (act.url) return this.until(() => page.url().includes(act.url), max, `url has ${act.url}`);
        if (act.attr) return this.until(async () => (await this.locator(act).getAttribute(act.attr).catch(() => null)) === act.equals, max, `${act.testid ?? act.name} ${act.attr}=${act.equals}`);
        if (act.includes !== undefined) {
          const where = act.testid || act.role ? this.locator(act) : page.locator(act.in ?? "main");
          return this.until(async () => ((await where.textContent().catch(() => "")) || "").includes(act.includes), max, `"${act.includes}" shown`);
        }
        throw new Error("until: say url, attr+equals, or includes");
      }
      case "press-until": {
        // A press repeated until the words appear (the footprints come once their tile is there).
        const where = page.getByTestId(act.testid);
        for (let t = 0; t < (act.tries ?? 40); t++) {
          // Unseen, the ticks take no screenshots and pass in no real time: the tile needs real time to arrive.
          if (!this.segment) await new Promise((resolve) => setTimeout(resolve, 300));
          await this.press();
          for (let i = 0; i < (act.frames ?? 10); i++) { await this.tick(1); if (((await where.textContent().catch(() => "")) || "").includes(act.includes)) { log(`"${act.includes}" after ${t + 1} presses`); return; } }
        }
        throw new Error(`press-until: "${act.includes}" never appeared. Is the pointer on the building (site.json's click)?`);
      }
      case "unseen": {
        const seg = this.segment; this.segment = null;
        for (const inner of act.acts) await this.act(inner);
        this.segment = seg;
        return;
      }
      case "rename": {
        // The design's name, through the project switcher: the name in the top bar, Rename, the field.
        await page.getByRole("button", { name: nameOf(act.from ?? "/Untitled roof/") }).first().click();
        await this.tick(10);
        await page.getByRole("button", { name: "Rename" }).click();
        await this.tick(6);
        const field = page.getByRole("textbox", { name: "Name" });
        await field.fill(act.name); await field.press("Enter");
        await this.tick(10);
        await page.keyboard.press("Escape");
        await this.tick(15);
        await page.mouse.move(this.pointer.x, this.pointer.y);
        return;
      }
      default: throw new Error("Unknown act: " + JSON.stringify(act));
    }
  }
}

(async () => {
  const [video, ...only] = process.argv.slice(2);
  const dir = videoDir(video);
  const script = readJson(path.join(dir, "record.json"));
  const where = site(script.site);
  const web = webUrl();
  const out = path.join(workOf(video), "frames");
  fs.mkdirSync(out, { recursive: true });
  const gpu = script.gpu !== false;
  const browser = await chromium.launch(gpu ? { headless: false, args: ["--ignore-gpu-blocklist", "--window-position=0,0"] } : { args: SOFTWARE_GL });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log("pageerror", e.message));
  page.on("response", async (r) => { if (/\/api\/(design|layout|roof)/.test(r.url()) && r.status() >= 400) log("API", r.status(), r.url().slice(-24), (await r.text().catch(() => "")).slice(0, 200)); });
  await page.addInitScript(INIT);
  // The Esri key is restricted to the dev profile's origin: the geocoder is asked with that referrer.
  await page.route(/geocode-api\.arcgis\.com/, (route) => route.continue({ headers: { ...route.request().headers(), referer: where.geocoderReferrer } }));
  // The test stack's API has weather downloads off: the site's weather, fetched once (weather.py), is served here.
  await page.route("**/api/weather", (route) => { const a = route.request().postDataJSON() || {}; if (a.source === "pvgis") return route.fulfill({ path: where.weatherFile, contentType: "application/json" }); return route.continue(); });

  // The first page, loaded before the clock is installed: Home's hydration waits on timers the fake clock would hold.
  await page.goto(web + (script.start?.path ?? "/"));
  const waits = script.start?.waitFor ?? { role: "link", name: "Find my roof" };
  await page.getByRole(waits.role, { name: nameOf(waits.name) }).first().waitFor({ timeout: 120000 });
  await page.waitForTimeout(2000);
  const clock = new Date(where.clock);
  await page.clock.install({ time: clock });
  await page.clock.pauseAt(new Date(clock.getTime() + 1000));
  log("started on", script.start?.path ?? "/", gpu ? "(GPU, a window on the screen: leave it alone)" : "(software WebGL)");

  const r = new Recorder(page, out, only.length ? only : null);
  await page.mouse.move(r.pointer.x, r.pointer.y);
  await r.tick(5);
  // The words of the site stand in for their names in the script: {place}, {name}, {click.x}, {click.y}.
  const filled = (act) => JSON.parse(JSON.stringify(act).replace(/\{(place|name)\}/g, (_, k) => where[k]).replace(/"\{click\.(x|y)\}"/g, (_, k) => where.click[k]));
  for (const segment of script.segments) {
    r.start(segment.name);
    for (const act of segment.acts) await r.act(filled(act));
    r.stop();
  }
  log("frames in all:", r.total, "->", out);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
