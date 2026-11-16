"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { menuPanelClassName, secondaryButtonClassName } from "@/components/button-styles";

export function ActionMenu({
  label,
  ariaLabel,
  children,
}: {
  label: string;
  ariaLabel?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const accessibleName = ariaLabel ?? label;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={accessibleName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={secondaryButtonClassName}
      >
        {label}
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label={accessibleName} className={menuPanelClassName}>
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
