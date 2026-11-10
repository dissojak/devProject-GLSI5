// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { menuAnchor } from "@/utils/menu-anchor";

function restore() {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
}

afterEach(restore);

describe("menuAnchor", () => {
  it("places the popup below the trigger when clearance allows", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return { top: 100, bottom: 130, left: 900, right: 930 } as DOMRect;
    });

    const anchor = menuAnchor(trigger, { width: 1280, height: 800 });

    expect(anchor.flipUp).toBe(false);
    expect(anchor.topEdge).toBe(136); // trigger bottom + gap
    expect(anchor.bottomEdge).toBeUndefined();
    expect(anchor.right).toBe(350); // viewport width − trigger right
  });

  it("flips above the trigger when a clipping ancestor ends too close", () => {
    const clipper = document.createElement("div");
    clipper.style.overflow = "hidden";
    clipper.style.height = "360px";
    clipper.style.top = "40px"; // bottom edge at 400
    document.body.append(clipper);
    const trigger = document.createElement("button");
    clipper.append(trigger);

    const rects: Record<string, { top: number; bottom: number; left: number; right: number }> = {
      DIV: { top: 40, bottom: 400, left: 0, right: 1280 },
      BUTTON: { top: 330, bottom: 360, left: 900, right: 930 },
    };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return rects[this.tagName] as DOMRect;
    });

    const anchor = menuAnchor(trigger, { width: 1280, height: 800 });

    expect(anchor.flipUp).toBe(true);
    expect(anchor.bottomEdge).toBe(476); // viewport − (trigger top − gap)
    expect(anchor.topEdge).toBeUndefined();
    expect(anchor.right).toBe(350);
  });

  it("walks past ancestors that do not clip", () => {
    const middle = document.createElement("div");
    middle.style.overflow = "auto"; // scrollable, not clipped -> ignored
    document.body.append(middle);
    const trigger = document.createElement("button");
    middle.append(trigger);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      return { top: 500, bottom: 530, left: 0, right: 30 } as DOMRect;
    });

    const anchor = menuAnchor(trigger, { width: 1280, height: 900 });

    expect(anchor.flipUp).toBe(false); // 900 − 530 = 370 ≥ clearance
    expect(anchor.topEdge).toBe(536);
  });

  it("degrades to a top-left placement without a trigger rect", () => {
    const anchor = menuAnchor(null, { width: 1280, height: 800 });
    expect(anchor.flipUp).toBe(false);
    expect(anchor.topEdge).toBe(0);
    expect(anchor.right).toBe(0);
  });
});
