"use client";

import {useRef, useState} from "react";
import {DayPicker} from "react-day-picker";
import {fr} from "date-fns/locale";
import {format} from "date-fns";
import {Calendar} from "lucide-react";
import {useClickOutside} from "@/hooks/useClickOutside";
import "react-day-picker/style.css";

type Props = {
  id?: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
};

const DatePicker = ({id, value, onChange}: Props) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      >
        <Calendar size={16} className="text-neutral-400" />
        <span className={value ? "text-neutral-800" : "text-neutral-400"}>
          {value ? format(value, "dd/MM/yyyy") : "JJ/MM/AAAA"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-fit rounded-xl border border-neutral-200 bg-white p-1.5 text-neutral-800 shadow-lg">
          <DayPicker
            mode="single"
            locale={fr}
            weekStartsOn={1}
            selected={value}
            defaultMonth={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;
