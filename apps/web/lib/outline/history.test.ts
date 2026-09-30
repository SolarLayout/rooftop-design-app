import { describe, expect, test } from "bun:test";
import { canRedo, canUndo, cleared, historyOf, redone, undone, withNext } from "./history";

// Undo, redo, clear, of whatever is drawn. A drag is one step: what is pushed is the state after it.

describe("the history of the outline", () => {
  test("it begins with what it is given, and nothing to undo or redo", () => {
    const history = historyOf([]);

    expect(history.present).toEqual([]);
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  test("a next state can be undone, and the undo redone", () => {
    const one = withNext(historyOf([]), [1]);
    const two = withNext(one, [1, 2]);

    expect(two.present).toEqual([1, 2]);
    expect(canUndo(two)).toBe(true);
    const back = undone(two);
    expect(back.present).toEqual([1]);
    expect(canRedo(back)).toBe(true);
    expect(redone(back).present).toEqual([1, 2]);
  });

  test("a new step after an undo forgets what could have been redone", () => {
    const back = undone(withNext(historyOf([]), [1]));

    const other = withNext(back, [9]);

    expect(canRedo(other)).toBe(false);
    expect(undone(other).present).toEqual([]);
  });

  test("undoing with nothing to undo, and redoing with nothing to redo, change nothing", () => {
    const history = historyOf([1]);

    expect(undone(history)).toBe(history);
    expect(redone(history)).toBe(history);
  });

  test("a next state that is the same as the present is no step", () => {
    const history = historyOf([1]);
    const same = [1];

    expect(withNext(history, history.present)).toBe(history);
    expect(withNext(history, same).past).toHaveLength(1);
  });

  test("clear is a step too: it can be undone", () => {
    const drawn = withNext(historyOf([]), [1, 2, 3]);

    const empty = cleared(drawn, []);

    expect(empty.present).toEqual([]);
    expect(undone(empty).present).toEqual([1, 2, 3]);
  });
});
