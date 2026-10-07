import { spawnSync } from "node:child_process";
import path from "node:path";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import type { Page } from "@playwright/test";
import { framesOf, glidePath, lengthOf, PACE, type ClipAct } from "../../tools/help/clips";
import { arcFrom, HOW_TOS, placeOnScreen, pointOf, type Clip, type Point } from "../../tools/help/pictures";
import { test } from "../fixtures";
import { act, centreOf, obstacleMiddle, PUBLIC_HELP, readied, roofBox, type OnTheMap } from "../help-pictures/on-find";
import { DRAW_THE_POINTER } from "./pointer";

// Records the clips of the how-tos (Phase 15; README.md beside this file): each clip's how-to begun as for its pictures, the
// map put where its step begins, the pointer drawn in, then each act of the hand a frame at a time, a screenshot of the part
// kept after every step; the frames encoded to H.264 in MP4 by the pinned encoder (D83) into apps/web/public/help/<dir>/<n>.mp4.

/** The encoder's settings (D83): H.264 for every browser, tuned for flat pictures, the index at the front to start at once. */
const ENCODE = ["-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];

/** One clip's recording: the frames taken so far, and the pointer where it is. */
type Recording = { page: Page; clip: Clip; frames: Buffer[]; pointer: Point };

async function shot(r: Recording) {
  r.frames.push(await r.page.screenshot({ clip: r.clip, type: "jpeg", quality: 92 }));
}

async function hold(r: Recording, seconds: number) {
  for (let i = 0; i < framesOf(seconds); i++) await shot(r);
}

async function glide(r: Recording, to: Point, seconds: number) {
  for (const point of glidePath(r.pointer, to, framesOf(seconds))) {
    await r.page.mouse.move(point.x, point.y);
    await shot(r);
  }
  r.pointer = to;
}

async function along(r: Recording, points: readonly Point[]) {
  for (const point of points) {
    await r.page.mouse.move(point.x, point.y);
    await shot(r);
  }
  r.pointer = points.at(-1) ?? r.pointer;
}

async function recorded(r: Recording, map: OnTheMap, done: ClipAct) {
  const at = async (place: Parameters<typeof placeOnScreen>[0]) => placeOnScreen(place, "across" in place ? await roofBox(r.page) : null, map);
  switch (done.kind) {
    case "rest":
      return hold(r, done.seconds);
    case "click": {
      await glide(r, await at(done.at), PACE.glide);
      await hold(r, PACE.settle);
      await r.page.mouse.down();
      await hold(r, PACE.press);
      await r.page.mouse.up();
      return hold(r, PACE.settle);
    }
    case "drag": {
      const from = await at(done.from);
      await glide(r, from, PACE.glide);
      await hold(r, PACE.settle);
      await r.page.mouse.down();
      await glide(r, { x: from.x + done.by.x, y: from.y + done.by.y }, PACE.drag);
      await hold(r, PACE.hold);
      if (done.back) await glide(r, from, PACE.drag);
      await r.page.mouse.up();
      return hold(r, PACE.settle);
    }
    case "turn": {
      const middle = done.around === "obstacle" ? await obstacleMiddle(r.page) : pointOf(await roofBox(r.page), { across: 0.5, down: 0.5 });
      const handle = await centreOf(r.page, done.handle);
      await glide(r, handle, PACE.glide);
      await hold(r, PACE.settle);
      await r.page.mouse.down();
      const turned = arcFrom(middle, handle, done.degrees, framesOf(PACE.turn));
      await along(r, turned);
      await hold(r, PACE.hold);
      if (done.back) await along(r, [...turned].reverse().slice(1).concat(handle));
      await r.page.mouse.up();
      return hold(r, PACE.settle);
    }
  }
}

function encoded(frames: readonly Buffer[], to: string) {
  const run = spawnSync(ffmpeg.path, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", ...ENCODE, to], {
    input: Buffer.concat(frames),
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.status !== 0) throw new Error(`The encoder (${ffmpeg.path}) failed: ${run.stderr.toString().trim() || run.error?.message}`);
}

for (const howTo of HOW_TOS) {
  for (const spec of howTo.clips ?? []) {
    test(`${howTo.dir}/${spec.name}`, async ({ page }) => {
      const { map, clip } = await readied(page, howTo);
      for (const done of spec.before) await act(page, map, done);
      await page.evaluate(DRAW_THE_POINTER);
      // The pointer comes in from the part's lower left, inside it.
      const home = { x: clip.x + 24, y: clip.y + clip.height - 24 };
      await page.mouse.move(home.x, home.y);
      await page.waitForTimeout(600);
      const recording: Recording = { page, clip, frames: [], pointer: home };
      for (const done of spec.acts) await recorded(recording, map, done);
      // Home again, so that the loop begins where it ends.
      await glide(recording, home, PACE.glide);
      const to = path.join(PUBLIC_HELP, howTo.dir, `${spec.name}.mp4`);
      encoded(recording.frames, to);
      console.log(`${howTo.dir}/${spec.name}.mp4: ${recording.frames.length} frames, ${lengthOf(recording.frames.length)}`);
    });
  }
}
