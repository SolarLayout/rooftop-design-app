// Where things are, for every script of the skill: the repository, a video's assets and work folder, the sites, the
// test stack's address, Playwright and the encoder of the e2e workspace. Run alone it prints one: `node paths.cjs ffmpeg`.
const fs = require("node:fs");
const path = require("node:path");

/** The repository: the skill lives in .claude/skills/product-video. */
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const SKILL = path.resolve(__dirname, "..");
const ASSETS = path.join(SKILL, "assets");
/** Frames, overlays, cuts, audio and the key: gitignored, kept between runs so that a cut can be remade without recording. */
const WORK = process.env.PRODUCT_VIDEO_WORK ? path.resolve(process.env.PRODUCT_VIDEO_WORK) : path.join(ROOT, ".product-video");
const E2E_MODULES = path.join(ROOT, "e2e", "node_modules");

const playwright = () => require(path.join(E2E_MODULES, "@playwright", "test"));
const ffmpeg = () => require(path.join(E2E_MODULES, "@ffmpeg-installer", "ffmpeg")).path;

/** A video's assets: assets/videos/<name>/ (record.json, plan.json, captions.json, narration.json ...). */
function videoDir(name) {
  const dir = path.join(ASSETS, "videos", name);
  if (!name || !fs.existsSync(dir)) throw new Error(`No video "${name}": the videos are ${fs.readdirSync(path.join(ASSETS, "videos")).join(", ")}.`);
  return dir;
}

/** A video's work: <work>/<name>/{frames,overlays,html,out,audio}. */
const workOf = (name) => path.join(WORK, name);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

/** A site: assets/sites/<name>.json, with its weather file beside it. */
function site(name) {
  const file = path.join(ASSETS, "sites", `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`No site "${name}" in ${path.join(ASSETS, "sites")}.`);
  const data = readJson(file);
  return { ...data, weatherFile: path.join(ASSETS, "sites", data.weather) };
}

/** The web of the test stack, by the port tools/dev.ts wrote down (never a port written in code). */
function webUrl() {
  const file = path.join(ROOT, ".dev", "test", "pids.json");
  if (!fs.existsSync(file)) throw new Error("The test stack is not running: `bun dev:bg --profile test` first (" + file + " is missing).");
  const port = readJson(file).ports?.web;
  if (!Number.isInteger(port)) throw new Error("The test stack's pid file names no web port: " + file);
  return `http://localhost:${port}`;
}

module.exports = { ROOT, SKILL, ASSETS, WORK, playwright, ffmpeg, webUrl, videoDir, workOf, site, readJson };

if (require.main === module) {
  const what = process.argv[2];
  const answers = { ffmpeg, work: () => WORK, root: () => ROOT, web: webUrl, assets: () => ASSETS };
  if (!answers[what]) {
    console.error("Usage: node paths.cjs ffmpeg|work|root|web|assets");
    process.exit(2);
  }
  console.log(answers[what]());
}
