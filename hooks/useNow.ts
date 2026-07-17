"use client";

import {useEffect, useState} from "react";

/**
 * The current time, re-rendered every `intervalMs`.
 *
 * Appointment status is derived from `startsAt` vs. now rather than stored, so
 * without a tick an open tab would show an appointment as "à venir" long after
 * it had passed. Sixty seconds is enough: nothing here displays seconds.
 */
export const useNow = (intervalMs = 60_000): Date => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};
