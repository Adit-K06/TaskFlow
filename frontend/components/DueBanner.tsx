// DueBanner — in-memory banner for tasks due today & tomorrow
// - Dismiss lasts only until: page refresh, OR a new urgent task is added
// - No localStorage/sessionStorage — always re-evaluates from live task data
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bell } from "lucide-react";
import { Task } from "@/lib/types";
import { differenceInCalendarDays, parseISO } from "date-fns";

interface DueBannerProps {
  tasks: Task[];
  onScrollToToday: () => void;
  onScrollToTomorrow: () => void;
}

export default function DueBanner({ tasks, onScrollToToday, onScrollToTomorrow }: DueBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  // Track the previous urgent count so we can re-show when it increases
  const prevUrgentCount = useRef(0);

  const today = tasks.filter(
    (t) =>
      !t.is_completed &&
      t.due_date &&
      differenceInCalendarDays(parseISO(t.due_date), new Date()) === 0
  ).length;

  const tomorrow = tasks.filter(
    (t) =>
      !t.is_completed &&
      t.due_date &&
      differenceInCalendarDays(parseISO(t.due_date), new Date()) === 1
  ).length;

  const urgentCount = today + tomorrow;

  // Re-show banner whenever a new urgent task appears (count increases)
  useEffect(() => {
    if (urgentCount > prevUrgentCount.current) {
      setDismissed(false);
    }
    prevUrgentCount.current = urgentCount;
  }, [urgentCount]);

  if (dismissed || urgentCount === 0) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 text-sm relative"
      style={{
        backgroundColor: "rgba(181,80,47,0.12)",
        borderColor: "rgba(181,80,47,0.40)",
        color: "var(--text)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <Bell size={15} className="shrink-0" style={{ color: "var(--accent)" }} />

      <p className="flex-1 leading-relaxed">
        You have{" "}
        {today > 0 && (
          <>
            <button
              id="banner-scroll-today"
              onClick={onScrollToToday}
              className="font-bold underline underline-offset-2 hover:no-underline transition-all"
              style={{ color: "var(--accent)" }}
            >
              {today} task{today !== 1 ? "s" : ""}
            </button>{" "}
            due <strong>today</strong>
          </>
        )}
        {today > 0 && tomorrow > 0 && " and "}
        {tomorrow > 0 && (
          <>
            <button
              id="banner-scroll-tomorrow"
              onClick={onScrollToTomorrow}
              className="font-bold underline underline-offset-2 hover:no-underline transition-all"
              style={{ color: "var(--due-warning)" }}
            >
              {tomorrow} task{tomorrow !== 1 ? "s" : ""}
            </button>{" "}
            due <strong>tomorrow</strong>
          </>
        )}{" "}
        across all clients.
      </p>

      <button
        id="banner-dismiss-btn"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
        style={{ color: "var(--muted)" }}
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
