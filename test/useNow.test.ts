// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useNow} from "@/hooks/useNow";

const START = new Date("2026-07-16T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useNow", () => {
  it("starts at the current time", () => {
    const {result} = renderHook(() => useNow());

    expect(result.current).toEqual(START);
  });

  it("does not change before the interval elapses", () => {
    const {result} = renderHook(() => useNow(60_000));

    act(() => {
      vi.advanceTimersByTime(59_000);
    });

    expect(result.current).toEqual(START);
  });

  // The whole point: "à venir" has to become "en retard" in an open tab, with
  // nobody refreshing it.
  it("advances once the interval elapses", () => {
    const {result} = renderHook(() => useNow(60_000));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toEqual(new Date("2026-07-16T12:01:00.000Z"));
  });

  it("keeps ticking", () => {
    const {result} = renderHook(() => useNow(60_000));

    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(result.current).toEqual(new Date("2026-07-16T12:03:00.000Z"));
  });

  it("honours a custom interval", () => {
    const {result} = renderHook(() => useNow(1_000));

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current).toEqual(new Date("2026-07-16T12:00:01.000Z"));
  });

  it("clears its interval on unmount", () => {
    const clear = vi.spyOn(globalThis, "clearInterval");
    const {unmount} = renderHook(() => useNow());

    unmount();

    expect(clear).toHaveBeenCalled();
  });
});
