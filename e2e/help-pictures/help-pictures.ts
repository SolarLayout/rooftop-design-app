import path from "node:path";
import { HOW_TOS } from "../../tools/help/pictures";
import { test } from "../fixtures";
import { act, dialogClip, PUBLIC_HELP, readied } from "./on-find";

// Takes the pictures of the how-tos (D81) from the app as it is (docs/help-content.md, "Pictures"): each picture's acts done
// on Find (./on-find.ts), the part of the screen kept written to apps/web/public/help/<dir>/<n>.jpg.

for (const howTo of HOW_TOS) {
  test(howTo.dir, async ({ page }) => {
    const { map, clip } = await readied(page, howTo);
    for (const shot of howTo.shots) {
      const takeBack: (() => Promise<void>)[] = [];
      for (const done of shot.acts) {
        const back = await act(page, map, done);
        if (back) takeBack.push(back);
      }
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(PUBLIC_HELP, howTo.dir, `${shot.name}.jpg`), clip: shot.keep === "dialog" ? await dialogClip(page) : clip, type: "jpeg", quality: 82 });
      for (const back of takeBack.reverse()) await back();
    }
  });
}
