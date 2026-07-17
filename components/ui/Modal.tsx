"use client";

import {useEffect, useId} from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Panel width. The panel is otherwise fixed, so this is the only knob. */
  panelClassName?: string;
  children: React.ReactNode;
};

/**
 * A centred, dismissable dialog: overlay click and Escape both close it.
 *
 * Renders the heading itself rather than taking it as a child, so every dialog
 * is labelled for screen readers (`aria-labelledby`) without each caller having
 * to remember to wire an id up.
 */
const Modal = ({
  open,
  onClose,
  title,
  panelClassName = "max-w-sm",
  children,
}: Props) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl ${panelClassName}`}
      >
        <h2 id={titleId} className="text-base font-semibold text-neutral-900">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
