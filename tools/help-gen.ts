// bun help:gen: the topics of apps/web/content/help read, checked for form, and the typed manifest written
// (apps/web/lib/help/manifest.gen.ts). Commit the topic and the manifest together; the gate (tools/help/content.test.ts)
// fails while the manifest is stale.
import { writeFileSync } from "node:fs";
import { MANIFEST_PATH, manifestOf, readTopics } from "./help/generate";
import { OPTIONS_OF } from "./help/options";

const topics = readTopics();
writeFileSync(MANIFEST_PATH, manifestOf(topics, (key) => OPTIONS_OF[key]?.()));
console.info(`help:gen: ${topics.length} topic(s) → ${MANIFEST_PATH}`);
