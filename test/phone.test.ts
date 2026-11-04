import { aimStick, createStick, moveStick, pressStick, STICK_DEAD, STICK_R } from "../src/shell/stick";
import {
  DESK_JOY_R,
  isPhone,
  JOY_INSET,
  lockPlayGestures,
  PHONE_JOY_R,
  PHONE_MAX_W,
  phoneChrome,
  playGestureTarget,
} from "../src/shell/phone";

describe("phone chrome", () => {
  it("treats a narrow viewport as a phone", () => {
    expect(isPhone(390)).toBe(true);
    expect(isPhone(PHONE_MAX_W)).toBe(true);
    expect(isPhone(PHONE_MAX_W + 1)).toBe(false);
  });

  it("rests the stick in the lower left with a larger phone radius", () => {
    const desk = phoneChrome(1280, 800);
    expect(desk.phone).toBe(false);
    expect(desk.joyR).toBe(DESK_JOY_R);
    expect(desk.restX).toBe(JOY_INSET + DESK_JOY_R);
    expect(desk.restY).toBe(800 - JOY_INSET - DESK_JOY_R);
    const phone = phoneChrome(390, 844, 12, 20);
    expect(phone.phone).toBe(true);
    expect(phone.joyR).toBe(PHONE_JOY_R);
    expect(phone.restX).toBe(12 + JOY_INSET + PHONE_JOY_R);
    expect(phone.restY).toBe(844 - 20 - JOY_INSET - PHONE_JOY_R);
    expect(phone.knobTravel).toBeCloseTo(PHONE_JOY_R * 0.625);
  });
});

describe("stick deadzone", () => {
  it("maps full throw to the drawn radius, not the old 56px handle", () => {
    const s = createStick();
    pressStick(s, 0, 0);
    moveStick(s, PHONE_JOY_R * 0.5, 0, PHONE_JOY_R);
    expect(s.dx).toBeCloseTo(0.5);
    moveStick(s, PHONE_JOY_R, 0, PHONE_JOY_R);
    expect(s.dx).toBe(1);
    moveStick(s, PHONE_JOY_R * 0.7, 0, PHONE_JOY_R);
    expect(s.dx).toBeCloseTo(0.7);
    expect(s.dx).toBeLessThan(1);
  });

  it("ignores a nudge inside the deadzone and still maps the rim", () => {
    const quiet = aimStick(0, 0, STICK_R * STICK_DEAD * 0.5, 0, STICK_R);
    expect(quiet.dx).toBe(0);
    expect(quiet.dy).toBe(0);
    const rim = aimStick(0, 0, STICK_R, 0, STICK_R);
    expect(rim.dx).toBe(1);
    expect(rim.dy).toBe(0);
  });
});

describe("play gesture lock", () => {
  it("lets menu chrome scroll and locks the playfield", () => {
    expect(playGestureTarget(null)).toBe(true);
    expect(playGestureTarget({} as unknown as EventTarget)).toBe(true);
    const panel = { closest: (sel: string) => (sel.includes("#panel") ? {} : null) };
    expect(playGestureTarget(panel as unknown as EventTarget)).toBe(false);
  });

  it("prevents default on pinch and pan gestures and can unsubscribe", () => {
    const listeners = new Map<string, Set<(e: Event) => void>>();
    const target = {
      addEventListener(type: string, fn: EventListenerOrEventListenerObject) {
        const set = listeners.get(type) ?? new Set<(e: Event) => void>();
        if (typeof fn === "function") set.add(fn);
        listeners.set(type, set);
      },
      removeEventListener(type: string, fn: EventListenerOrEventListenerObject) {
        if (typeof fn === "function") listeners.get(type)?.delete(fn);
      },
      dispatchEvent(event: Event) {
        listeners.get(event.type)?.forEach((fn) => fn(event));
        return !event.defaultPrevented;
      },
    };
    const fire = (type: string) => {
      const event = {
        type,
        cancelable: true,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
      } as Event & { defaultPrevented: boolean };
      target.dispatchEvent(event);
      return event;
    };
    const unlock = lockPlayGestures(target);
    expect(fire("gesturestart").defaultPrevented).toBe(true);
    expect(fire("touchmove").defaultPrevented).toBe(true);
    unlock();
    expect(fire("touchmove").defaultPrevented).toBe(false);
  });
});
