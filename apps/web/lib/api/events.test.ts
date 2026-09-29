import { describe, expect, test } from "bun:test";
import { readEvents, type ServerEvent } from "./events";

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function all(stream: ReadableStream<Uint8Array>): Promise<ServerEvent[]> {
  const events: ServerEvent[] = [];
  for await (const event of readEvents(stream)) events.push(event);
  return events;
}

describe("readEvents", () => {
  test("reads the events of a stream in order", async () => {
    const text = 'event: progress\ndata: {"a":1}\n\nevent: result\ndata: {"b":2}\n\n';
    expect(await all(streamOf(text))).toEqual([
      { event: "progress", data: '{"a":1}' },
      { event: "result", data: '{"b":2}' },
    ]);
  });

  test("puts together an event that arrives in pieces, cut anywhere", async () => {
    const text = 'event: progress\ndata: {"step":"Fitting"}\n\nevent: result\ndata: {"ok":true}\n\n';
    for (let cut = 1; cut < text.length; cut++) {
      const events = await all(streamOf(text.slice(0, cut), text.slice(cut)));
      expect(events, `cut at ${cut}`).toEqual([
        { event: "progress", data: '{"step":"Fitting"}' },
        { event: "result", data: '{"ok":true}' },
      ]);
    }
  });

  test("puts together a character of several bytes that is cut in two", async () => {
    const bytes = new TextEncoder().encode('event: result\ndata: "4 mm² Cu · 15°"\n\n');
    const cut = bytes.indexOf(0xc2) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, cut));
        controller.enqueue(bytes.slice(cut));
        controller.close();
      },
    });
    expect(await all(stream)).toEqual([{ event: "result", data: '"4 mm² Cu · 15°"' }]);
  });

  test("takes line ends of every kind", async () => {
    const events = await all(streamOf("event: a\r\ndata: 1\r\n\r\nevent: b\rdata: 2\r\revent: c\ndata: 3\n\n"));
    expect(events.map((event) => event.event)).toEqual(["a", "b", "c"]);
    expect(events.map((event) => event.data)).toEqual(["1", "2", "3"]);
  });

  test("joins the lines of data with a line end", async () => {
    expect(await all(streamOf("data: one\ndata: two\n\n"))).toEqual([{ event: "message", data: "one\ntwo" }]);
  });

  test("leaves out comments that keep the line open, and fields it does not know", async () => {
    const events = await all(streamOf(": ping\n\n: ping\nevent: progress\nid: 7\nretry: 100\ndata: 1\n\n"));
    expect(events).toEqual([{ event: "progress", data: "1" }]);
  });

  test("takes a field without a space after the colon, and keeps the second space", async () => {
    expect(await all(streamOf("event:a\ndata:  x\n\n"))).toEqual([{ event: "a", data: " x" }]);
  });

  test("drops an event that the end of the stream cut off", async () => {
    expect(await all(streamOf('event: progress\ndata: 1\n\nevent: result\ndata: {"half'))).toEqual([
      { event: "progress", data: "1" },
    ]);
  });

  test("an empty stream has no events", async () => {
    expect(await all(streamOf())).toEqual([]);
  });
});
