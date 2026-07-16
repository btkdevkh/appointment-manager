// @vitest-environment jsdom
// Only this file (and useNow) needs a DOM; the rest of the suite stays on the
// faster `node` environment configured in vitest.config.ts.
import {afterEach, describe, expect, it, vi} from "vitest";
import {renderHook} from "@testing-library/react";
import {useClickOutside} from "@/hooks/useClickOutside";

function press(target: Element) {
  target.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
}

function setup({active = true} = {}) {
  const inside = document.createElement("div");
  const child = document.createElement("button");
  inside.append(child);
  const outside = document.createElement("div");
  document.body.append(inside, outside);

  const ref = {current: inside};
  const onOutside = vi.fn();

  const view = renderHook(
    ({cb, on}: {cb: () => void; on: boolean}) => useClickOutside(ref, cb, on),
    {initialProps: {cb: onOutside, on: active}}
  );

  return {inside, child, outside, onOutside, view};
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useClickOutside", () => {
  it("fires when the press lands outside the ref", () => {
    const {outside, onOutside} = setup();

    press(outside);

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("ignores a press on the ref itself", () => {
    const {inside, onOutside} = setup();

    press(inside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  // The popup's own contents are nested inside the ref, so pressing a day or an
  // hour button must not dismiss it before the click registers.
  it("ignores a press on a descendant of the ref", () => {
    const {child, onOutside} = setup();

    press(child);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("does not listen while inactive", () => {
    const {outside, onOutside} = setup({active: false});

    press(outside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("starts listening once it becomes active", () => {
    const {outside, onOutside, view} = setup({active: false});

    view.rerender({cb: onOutside, on: true});
    press(outside);

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("stops listening once it goes inactive", () => {
    const {outside, onOutside, view} = setup({active: true});

    view.rerender({cb: onOutside, on: false});
    press(outside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("detaches its listener on unmount", () => {
    const {outside, onOutside, view} = setup();

    view.unmount();
    press(outside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  // Callers pass an inline arrow, so the hook holds a callback that is a new
  // function on every render. It must call the current one, not the first.
  it("calls the latest callback, not the one it mounted with", () => {
    const {outside, onOutside, view} = setup();
    const replacement = vi.fn();

    view.rerender({cb: replacement, on: true});
    press(outside);

    expect(replacement).toHaveBeenCalledTimes(1);
    expect(onOutside).not.toHaveBeenCalled();
  });
});
