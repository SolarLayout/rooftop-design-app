import { describe, expect, test } from "bun:test";
import { clockOfTheTest } from "../clock-of-the-test";
import { createViewStore, isPlayingOf, sunTimeOf } from "../stores/view-store";
import { createPlay } from "./play";

// Play (plan/phase-06-plan.md, decision 4): a quarter hour every 250 ms to sunset, where it stops; Play at
// sunset begins at sunrise; under reduced motion an hour a second.
const PUNE_DEC = { from: 6.75, to: 17.25, sky: "rises and sets" } as const;

function playing({ reduced = false, hour = 16 } = {}) {
  const time = clockOfTheTest();
  const view = createViewStore();
  view.getState().setSunTime({ day: "design_day", hour });
  const play = createPlay({ view, clock: time.clock, hoursOf: () => PUNE_DEC, isReduced: () => reduced });
  const hour_ = () => sunTimeOf(view.getState()).hour;
  return { ...time, view, play, hour: hour_ };
}

describe("play", () => {
  test("moves a quarter hour every 250 ms", () => {
    const { play, pass, hour, view } = playing();

    play.play();
    expect(isPlayingOf(view.getState())).toBe(true);
    pass(250);
    expect(hour()).toBe(16.25);
    pass(250);
    expect(hour()).toBe(16.5);
  });

  test("stops at sunset, the end of the day's hours", () => {
    const { play, pass, hour, view } = playing({ hour: 17 });

    play.play();
    pass(250);
    pass(250);
    pass(250);

    expect(hour()).toBe(17.25);
    expect(isPlayingOf(view.getState())).toBe(false);
  });

  test("at sunset it begins at sunrise", () => {
    const { play, hour } = playing({ hour: 17.25 });

    play.play();

    expect(hour()).toBe(6.75);
  });

  test("under reduced motion it moves an hour a second", () => {
    const { play, pass, hour } = playing({ reduced: true, hour: 10 });

    play.play();
    pass(250);
    expect(hour()).toBe(10);
    pass(750);
    expect(hour()).toBe(11);
  });

  test("pause stops it where it is", () => {
    const { play, pass, hour, view, waiting } = playing();

    play.play();
    pass(250);
    play.pause();
    pass(1000);

    expect(hour()).toBe(16.25);
    expect(isPlayingOf(view.getState())).toBe(false);
    expect(waiting()).toBe(0);
  });

  test("a time set by anything else stops it: a drag, a key, another day", () => {
    const { play, pass, hour, view } = playing();

    play.play();
    view.getState().setSunTime({ day: "design_day", hour: 9 });
    pass(500);

    expect(hour()).toBe(9);
    expect(isPlayingOf(view.getState())).toBe(false);
  });

  test("toggle plays and pauses", () => {
    const { play, view } = playing();

    play.toggle();
    expect(isPlayingOf(view.getState())).toBe(true);
    play.toggle();
    expect(isPlayingOf(view.getState())).toBe(false);
  });

  test("without the day's hours there is nothing to play", () => {
    const time = clockOfTheTest();
    const view = createViewStore();
    const play = createPlay({ view, clock: time.clock, hoursOf: () => null, isReduced: () => false });

    play.play();

    expect(isPlayingOf(view.getState())).toBe(false);
  });
});
