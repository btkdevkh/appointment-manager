"use client";

import {useEffect, useRef, useState} from "react";
import {Clock} from "lucide-react";
import {useClickOutside} from "@/hooks/useClickOutside";

type Props = {
  id?: string;
  value: string; // "HH:mm" or ""
  onChange: (value: string) => void;
};

const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({length: 60}, (_, i) => String(i).padStart(2, "0"));

const cellClass = (selected: boolean) =>
  `cursor-pointer rounded-md px-2 py-1 text-center text-sm ${
    selected
      ? "bg-neutral-900 text-white"
      : "text-neutral-500 hover:bg-neutral-100"
  }`;

const TimePicker = ({id, value, onChange}: Props) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLButtonElement>(null);
  const minuteRef = useRef<HTMLButtonElement>(null);

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""];

  useClickOutside(containerRef, () => setOpen(false), open);

  // Scroll the current selection into view when the popup opens.
  useEffect(() => {
    if (!open) return;
    hourRef.current?.scrollIntoView({block: "center"});
    minuteRef.current?.scrollIntoView({block: "center"});
  }, [open]);

  const pickHour = (hour: string) => {
    onChange(`${hour}:${selectedMinute || "00"}`);
  };

  const pickMinute = (minute: string) => {
    onChange(`${selectedHour || "00"}:${minute}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      >
        <Clock size={16} className="text-neutral-400" />
        <span className={value ? "text-neutral-800" : "text-neutral-400"}>
          {value || "--:--"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 flex gap-1 rounded-xl border border-neutral-200 bg-white p-1.5 text-neutral-800 shadow-lg">
          <ul className="h-48 w-14 overflow-y-auto">
            {hours.map((hour) => (
              <li key={hour}>
                <button
                  type="button"
                  ref={hour === selectedHour ? hourRef : undefined}
                  onClick={() => pickHour(hour)}
                  className={cellClass(hour === selectedHour)}
                  style={{width: "100%"}}
                >
                  {hour}
                </button>
              </li>
            ))}
          </ul>
          <ul className="h-48 w-14 overflow-y-auto">
            {minutes.map((minute) => (
              <li key={minute}>
                <button
                  type="button"
                  ref={minute === selectedMinute ? minuteRef : undefined}
                  onClick={() => pickMinute(minute)}
                  className={cellClass(minute === selectedMinute)}
                  style={{width: "100%"}}
                >
                  {minute}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
