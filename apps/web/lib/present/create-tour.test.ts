import { describe, expect, test } from "bun:test";
import { clockOfTheTest } from "../clock-of-the-test";
import type { DayHours } from "../flow/sun-day";
import { cameraFromOf, cameraMoveOf, cameraOf, cameraRequestOf, createViewStore, presentationOf, sunTimeOf } from "../stores/view-store";
import { createTour, TICK } from "./create-tour";
import { LOOP } from "./tour";

// The tour driven on the app's clock (plan/phase-10-plan.md, step 18, decisions 8 to 10): it writes the script's state
// of the moment into the view store, tick by tick, looping, and takes the view back to where it was when it stops.
// Made of the view, the clock, the day's hours and the motion setting alone: nothing of the API is near it.

const PUNE_DEC: DayHours = { from: 6.75, to: 17.25, sky: "rises and sets" };

function touring({ reduced = false, hours = PUNE_DEC as DayHours | null, hour = 10.5 } = {}) {
  const time = clockOfTheTest();
  const view = createViewStore();
  view.getState().setSunTime({ day: "design_day", hour });
  const tour = createTour({ view, clock: time.clock, hoursOf: () => hours, isReduced: () => reduced });
  // The clock of the tests runs what is due when it is told to, once: a tick that sets the next waits for the next pass.
  const pass = (milliseconds: number) => {
    for (let passed = 0; passed < milliseconds; passed += TICK) time.pass(TICK);
  };
  return { view, tour, pass, waiting: time.waiting, hourShown: () => sunTimeOf(view.getState()).hour };
}

describe("the tour", () => {
  test("at the start: the satellite, nothing revealed, the camera from the plan into 3D over its scene, the hour held", () => {
    const { tour, view, hourShown } = touring();
    const requests = cameraRequestOf(view.getState());

    tour.start();

    expect(presentationOf(view.getState())).toEqual({ reveal: { building: 0, obstacles: 0, modules: 0 }, colouring: null, sunPath: false });
    expect(cameraOf(view.getState())).toBe("3d");
    expect(cameraFromOf(view.getState())).toBe("plan");
    expect(cameraMoveOf(view.getState())).toBe(4000);
    expect(cameraRequestOf(view.getState())).toBe(requests + 2);
    expect(hourShown()).toBe(10.5);
    expect(tour.view.getState()).toEqual({ isRunning: true, isPaused: false, scene: "satellite", index: 0, words: "The roof from above", figures: 0, loop: 0, into: 0, share: 0, isReduced: false });
  });

  test("the scenes follow on the clock, a tick at a time; the camera is asked for once a scene, and only when it must change", () => {
    const { tour, view, pass } = touring();
    tour.start();
    const requests = cameraRequestOf(view.getState());

    pass(5000);
    expect(tour.view.getState().scene).toBe("rising");
    expect(presentationOf(view.getState())?.reveal).toEqual({ building: 0.5, obstacles: 0, modules: 0 });
    expect(cameraRequestOf(view.getState())).toBe(requests);

    pass(6000);
    expect(tour.view.getState().scene).toBe("filling");
    expect(presentationOf(view.getState())?.reveal.modules).toBe(0.5);
  });

  test("the ticks are fine enough for a reveal to be seen moving", () => {
    expect(TICK).toBeLessThanOrEqual(50);
    expect(LOOP % TICK).toBe(0);
  });

  test("the day scene plays the hour from sunrise to sunset; the strings scene holds the hour of before again, coloured by MPPT", () => {
    const { tour, view, pass, hourShown } = touring();
    tour.start();

    pass(14000);
    expect(hourShown()).toBe(6.75);
    pass(6000);
    expect(hourShown()).toBe(12);
    pass(6000);
    expect(tour.view.getState().scene).toBe("strings");
    expect(hourShown()).toBe(10.5);
    expect(presentationOf(view.getState())?.colouring).toBe("mppt");
  });

  test("without the day's hours the hour is held throughout", () => {
    const { tour, pass, hourShown } = touring({ hours: null });
    tour.start();

    pass(20000);

    expect(hourShown()).toBe(10.5);
  });

  test("the energy's count is in the tour's own view, for the figures", () => {
    const { tour, pass } = touring();
    tour.start();

    pass(33000);

    expect(tour.view.getState().scene).toBe("energy");
    expect(tour.view.getState().figures).toBe(0.5);
  });

  test("it loops: the loops that are over are counted, and the camera tilts from the plan again", () => {
    const { tour, view, pass } = touring();
    tour.start();

    pass(LOOP);

    expect(tour.view.getState().scene).toBe("satellite");
    expect(tour.view.getState().loop).toBe(1);
    expect(cameraFromOf(view.getState())).toBe("plan");
    expect(cameraMoveOf(view.getState())).toBe(4000);
  });

  test("stopped, it takes the view back: no presentation, the hour and the camera of before, nothing waiting", () => {
    const { tour, view, pass, hourShown, waiting } = touring();
    view.getState().setCamera("sun-eye");
    tour.start();
    pass(20000);
    expect(hourShown()).toBe(12);

    tour.stop();

    expect(presentationOf(view.getState())).toBeNull();
    expect(hourShown()).toBe(10.5);
    expect(cameraOf(view.getState())).toBe("sun-eye");
    expect(cameraMoveOf(view.getState())).toBe(0);
    expect(waiting()).toBe(0);
    expect(tour.view.getState().isRunning).toBe(false);
    pass(5000);
    expect(presentationOf(view.getState())).toBeNull();
  });

  test("started twice runs once; stopped twice is nothing", () => {
    const { tour, view, pass } = touring();
    tour.start();
    tour.start();
    pass(TICK);

    expect(cameraRequestOf(view.getState())).toBe(2);
    tour.stop();
    tour.stop();
    expect(presentationOf(view.getState())).toBeNull();
  });

  test("under reduced motion the camera cuts to the plan, then to 3D; the building stands whole at once", () => {
    const { tour, view, pass } = touring({ reduced: true });
    tour.start();

    expect(cameraOf(view.getState())).toBe("plan");
    expect(cameraMoveOf(view.getState())).toBe(0);
    expect(tour.view.getState().isReduced).toBe(true);

    pass(4000);
    expect(cameraOf(view.getState())).toBe("3d");
    expect(cameraMoveOf(view.getState())).toBe(0);
    expect(presentationOf(view.getState())?.reveal).toEqual({ building: 1, obstacles: 1, modules: 0 });
  });

  test("paused, it stands where it is, nothing waiting; played, it goes on from there", () => {
    const { tour, view, pass, waiting } = touring();
    tour.start();
    pass(5000);

    tour.pause();
    pass(10000);

    expect(tour.view.getState()).toMatchObject({ isPaused: true, scene: "rising", into: 1000 });
    expect(presentationOf(view.getState())?.reveal).toEqual({ building: 0.5, obstacles: 0, modules: 0 });
    expect(waiting()).toBe(0);

    tour.play();
    pass(3000);
    expect(tour.view.getState()).toMatchObject({ isPaused: false, scene: "filling", into: 0 });
  });

  test("the scene after and before, each from its beginning; the first again tilts the camera from the plan", () => {
    const { tour, view, pass } = touring();
    tour.start();
    pass(1000);

    tour.after();
    expect(tour.view.getState()).toMatchObject({ scene: "rising", index: 1, into: 0 });
    tour.before();
    expect(tour.view.getState()).toMatchObject({ scene: "satellite", into: 0 });
    expect(cameraFromOf(view.getState())).toBe("plan");
    expect(cameraMoveOf(view.getState())).toBe(4000);
    pass(1000);
    expect(tour.view.getState().into).toBe(1000);
  });

  test("going to a scene starts it from its beginning; paused, it stays paused there", () => {
    const { tour, pass, hourShown } = touring();
    tour.start();
    tour.pause();

    tour.goTo(3);
    expect(tour.view.getState()).toMatchObject({ scene: "day", into: 0, isPaused: true });
    expect(hourShown()).toBe(6.75);
    pass(5000);
    expect(tour.view.getState().into).toBe(0);

    tour.goTo(5);
    expect(tour.view.getState()).toMatchObject({ scene: "energy", figures: 0 });
    expect(hourShown()).toBe(10.5);
  });

  test("after the last scene the loop goes on", () => {
    const { tour } = touring();
    tour.start();
    tour.goTo(5);

    tour.after();

    expect(tour.view.getState()).toMatchObject({ scene: "satellite", loop: 1 });
  });

  test("before the start, the presenter's presses are nothing", () => {
    const { tour, view } = touring();
    const requests = cameraRequestOf(view.getState());

    tour.pause();
    tour.after();
    tour.goTo(2);

    expect(tour.view.getState().isRunning).toBe(false);
    expect(cameraRequestOf(view.getState())).toBe(requests);
  });
});
