import { describe, expect, test } from "bun:test";
import { clockOfTheTest } from "../../lib/clock-of-the-test";
import { createToasts } from "./toast-queue";

function queue() {
  const time = clockOfTheTest();
  return { ...time, toasts: createToasts(time.clock) };
}

describe("the queue of toasts", () => {
  test("nothing is shown before anything was said", () => {
    expect(queue().toasts.shown()).toBeNull();
  });

  test("a toast is shown at once", () => {
    const { toasts } = queue();

    toasts.show({ kind: "done", words: "pune-demo-roof.rtd was saved" });

    expect(toasts.shown()).toMatchObject({ kind: "done", words: "pune-demo-roof.rtd was saved" });
  });

  test("a toast of something done leaves after 5 s", () => {
    const { toasts, pass } = queue();
    toasts.show({ kind: "done", words: "Saved" });

    pass(4999);
    expect(toasts.shown()).not.toBeNull();
    pass(1);
    expect(toasts.shown()).toBeNull();
  });

  test("a toast with a note stays until it is closed", () => {
    const { toasts, pass, waiting } = queue();
    const id = toasts.show({ kind: "note", words: "The map was not loaded. Enter the dimensions by hand." });

    pass(60_000);
    expect(toasts.shown()?.id).toBe(id);
    expect(waiting()).toBe(0);

    toasts.close(id);
    expect(toasts.shown()).toBeNull();
  });

  test("one is shown at a time, in the order they came", () => {
    const { toasts, pass } = queue();
    toasts.show({ kind: "done", words: "first" });
    toasts.show({ kind: "done", words: "second" });
    toasts.show({ kind: "done", words: "third" });

    expect(toasts.shown()?.words).toBe("first");
    pass(5000);
    expect(toasts.shown()?.words).toBe("second");
    pass(5000);
    expect(toasts.shown()?.words).toBe("third");
    pass(5000);
    expect(toasts.shown()).toBeNull();
  });

  test("the 5 s of a toast begin when it is shown, not when it was said", () => {
    const { toasts, pass } = queue();
    toasts.show({ kind: "done", words: "first" });
    toasts.show({ kind: "done", words: "second" });

    pass(4000);
    toasts.close(toasts.shown()!.id);
    expect(toasts.shown()?.words).toBe("second");
    pass(4999);
    expect(toasts.shown()?.words).toBe("second");
    pass(1);
    expect(toasts.shown()).toBeNull();
  });

  test("it stays while it is held: under the pointer, or with the focus inside", () => {
    const { toasts, pass } = queue();
    const id = toasts.show({ kind: "done", words: "Stair room was removed" });

    pass(3000);
    toasts.hold(id);
    pass(60_000);
    expect(toasts.shown()?.id).toBe(id);
  });

  test("let go, it has 5 s again", () => {
    const { toasts, pass } = queue();
    const id = toasts.show({ kind: "done", words: "Stair room was removed" });
    pass(3000);
    toasts.hold(id);
    pass(60_000);

    toasts.release(id);
    pass(4999);
    expect(toasts.shown()?.id).toBe(id);
    pass(1);
    expect(toasts.shown()).toBeNull();
  });

  test("held twice, by the pointer and by the focus, it stays until both let go", () => {
    const { toasts, pass } = queue();
    const id = toasts.show({ kind: "done", words: "Saved" });
    toasts.hold(id);
    toasts.hold(id);

    toasts.release(id);
    pass(60_000);
    expect(toasts.shown()?.id).toBe(id);

    toasts.release(id);
    pass(5000);
    expect(toasts.shown()).toBeNull();
  });

  test("a toast that waits can be closed before it was shown", () => {
    const { toasts, pass } = queue();
    toasts.show({ kind: "done", words: "first" });
    const second = toasts.show({ kind: "done", words: "second" });
    toasts.show({ kind: "done", words: "third" });

    toasts.close(second);
    pass(5000);

    expect(toasts.shown()?.words).toBe("third");
  });

  test("closing, holding or letting go of one that is not there changes nothing", () => {
    const { toasts, pass } = queue();
    toasts.show({ kind: "done", words: "Saved" });

    toasts.close(99);
    toasts.hold(99);
    toasts.release(99);
    expect(toasts.shown()?.words).toBe("Saved");
    pass(5000);
    expect(toasts.shown()).toBeNull();
  });

  test("no clock goes on after the last toast left", () => {
    const { toasts, pass, waiting } = queue();
    const id = toasts.show({ kind: "done", words: "Saved" });

    toasts.close(id);

    expect(waiting()).toBe(0);
    pass(5000);
    expect(toasts.shown()).toBeNull();
  });

  test("who listens hears every change, and no more after it stopped listening", () => {
    const { toasts, pass } = queue();
    let heard = 0;
    const stop = toasts.subscribe(() => {
      heard += 1;
    });

    toasts.show({ kind: "done", words: "Saved" });
    expect(heard).toBe(1);
    pass(5000);
    expect(heard).toBe(2);

    stop();
    toasts.show({ kind: "done", words: "Saved again" });
    expect(heard).toBe(2);
  });

  test("what is shown is the same object until it changes, so that React does not draw in a circle", () => {
    const { toasts } = queue();
    toasts.show({ kind: "done", words: "Saved" });

    expect(toasts.shown()).toBe(toasts.shown());
  });

  test("an action of a toast is kept with it", () => {
    const { toasts } = queue();
    let undone = false;
    toasts.show({ kind: "done", words: "Stair room was removed", action: { label: "Undo", run: () => (undone = true) } });

    toasts.shown()?.action?.run();

    expect(undone).toBe(true);
  });
});
