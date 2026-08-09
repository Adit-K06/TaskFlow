// DueBanner — dismissible session banner showing today/tomorrow due counts
"use client";

import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";
import { Task } from "@/lib/types";
import { differenceInCalendarDays, parseISO } from "date-fns";

const BANNER_KEY = "tf_banner_dismissed";

interface DueBannerProps {
  tasks: Task[];
  onScrollToToday: () => void;
  onScrollToTomorrow: () => void;
}

export default function DueBanner({ tasks, onScrollToToday, onScrollToTomorrow }: DueBannerProps) {
  const [dismissed, setDismissed] = useState(true); // start dismissed, check on mount

  useEffect(() => {
    const val = sessionStorage.getItem(BANNER_KEY);
    if (!val) setDismissed(false);
  }, []);

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

  if (dismissed || (today === 0 && tomorrow === 0)) return null;

  function dismiss() {
    sessionStorage.setItem(BANNER_KEY, "1");
    setDismissed(true);
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 text-sm relative"
      style={{
        backgroundColor: "rgba(181,80,47,0.12)",
        borderColor: "rgba(181,80,47,0.35)",
        color: "var(--text)",
      }}
    >
      <Bell size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />

      <p className="flex-1">
        You have{" "}
        {today > 0 && (
          <>
            <button
              onClick={onScrollToToday}
              className="font-bold underline underline-offset-2 hover:no-underline transition-all"
              style={{ color: "var(--accent)" }}
            >
              {today} task{today !== 1 ? "s" : ""}
            </button>{" "}
            due today
          </>
        )}
        {today > 0 && tomorrow > 0 && " and "}
        {tomorrow > 0 && (
          <>
            <button
              onClick={onScrollToTomorrow}
              className="font-bold underline underline-offset-2 hover:no-underline transition-all"
              style={{ color: "var(--due-warning)" }}
            >
              {tomorrow} task{tomorrow !== 1 ? "s" : ""}
            </button>{" "}
            due tomorrow
          </>
        )}{" "}
        across all clients.
      </p>

      <button
        id="banner-dismiss-btn"
        onClick={dismiss}
        className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
        style={{ color: "var(--muted)" }}
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
