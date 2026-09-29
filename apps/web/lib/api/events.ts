// Server-sent events read from the body of an answer. The browser's EventSource cannot send a
// request body, and a design run is a POST.

export type ServerEvent = {
  /** The name of the event; "message" when the server gave none. */
  event: string;
  /** Its data as text. Several lines of data are joined by a line end. */
  data: string;
};

const LINE_END = /\r\n|\r|\n/;

/** The events of *stream* as they arrive. An event that the end of the stream cuts off is dropped. */
export async function* readEvents(stream: ReadableStream<Uint8Array>): AsyncGenerator<ServerEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let text = "";
  let pending = emptyEvent();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      text += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = text.split(LINE_END);
      // The last piece is a line that may go on. A carriage return at its end may be half of a line end.
      text = lines.pop() ?? "";
      if (!done && text === "" && lines.length > 0 && value && value[value.length - 1] === 0x0d) {
        text = (lines.pop() ?? "") + "\r";
      }
      for (const line of lines) {
        if (line === "") {
          if (pending.data.length > 0) yield { event: pending.event || "message", data: pending.data.join("\n") };
          pending = emptyEvent();
        } else {
          take(line, pending);
        }
      }
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}

type Pending = { event: string; data: string[] };

function emptyEvent(): Pending {
  return { event: "", data: [] };
}

function take(line: string, pending: Pending): void {
  if (line.startsWith(":")) return;
  const colon = line.indexOf(":");
  const field = colon === -1 ? line : line.slice(0, colon);
  const rest = colon === -1 ? "" : line.slice(colon + 1);
  const value = rest.startsWith(" ") ? rest.slice(1) : rest;
  if (field === "event") pending.event = value;
  else if (field === "data") pending.data.push(value);
}
