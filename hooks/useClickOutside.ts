"use client";

import {useEffect, useRef, type RefObject} from "react";

/**
 * Calls `onOutside` when a pointer press lands outside `ref`.
 *
 * Pass `active: false` while the popup is closed — there is nothing to dismiss
 * then, and the listener would otherwise run on every click on the page.
 *
 * Listens on `mousedown` rather than `click`: a press that starts outside
 * should dismiss even if the release lands elsewhere, and it fires before the
 * trigger's own click handler, so the toggle isn't reopened by its own press.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active = true
) {
  // Callers pass an inline arrow, so its identity changes every render. Reading
  // it from a ref keeps the listener subscribed once per open instead of
  // re-binding on each render — without making every caller wrap it.
  const callback = useRef(onOutside);
  useEffect(() => {
    callback.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!active) return;

    function handle(event: MouseEvent) {
      const element = ref.current;
      if (element && !element.contains(event.target as Node)) callback.current();
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, active]);
}
