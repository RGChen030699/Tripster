"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const inputClassName =
  "mt-1 w-full rounded-md border border-sand bg-panel px-3 py-2 font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateField({
  id,
  label,
  name,
  defaultValue = "",
  required = false,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => monthFromValue(defaultValue) ?? currentMonth());

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) {
      return;
    }
    function onReset() {
      setValue(defaultValue);
      setOpen(false);
      setView(monthFromValue(defaultValue) ?? currentMonth());
    }
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
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

  const cells = useMemo(() => buildMonthCells(view.year, view.month), [view.year, view.month]);
  const monthLabel = new Date(Date.UTC(view.year, view.month, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={value}
        placeholder="YYYY-MM-DD"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listboxId}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          const parsed = monthFromValue(next);
          if (parsed) {
            setView(parsed);
            setOpen(false);
          }
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) {
              setOpen(false);
            }
          }, 0);
        }}
        className={inputClassName}
      />
      {open ? (
        <div
          id={listboxId}
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute z-20 mt-2 w-full rounded-md border border-sand bg-panel p-3 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView((current) => shiftMonth(current, -1))}
              className="rounded-md border border-sand px-2 py-1 text-sm outline-none hover:bg-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Prev
            </button>
            <p className="text-sm font-bold text-ink">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView((current) => shiftMonth(current, 1))}
              className="rounded-md border border-sand px-2 py-1 text-sm outline-none hover:bg-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink-muted">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell}
                  type="button"
                  aria-label={cell}
                  aria-current={cell === value ? "date" : undefined}
                  onClick={() => {
                    setValue(cell);
                    setOpen(false);
                  }}
                  className={
                    cell === value
                      ? "rounded-md border border-sage bg-sage px-1 py-1.5 text-sm font-bold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      : "rounded-md px-1 py-1.5 text-sm text-ink outline-none hover:bg-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  }
                >
                  {Number(cell.slice(-2))}
                </button>
              ) : (
                <span key={`empty-${index}`} className="px-1 py-1.5" />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function currentMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthFromValue(value: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7)) - 1;
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month };
}

function shiftMonth(
  current: { year: number; month: number },
  delta: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(current.year, current.month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

function buildMonthCells(year: number, month: number): Array<string | null> {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = first.getUTCDay();
  const cells: Array<string | null> = [];
  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}
