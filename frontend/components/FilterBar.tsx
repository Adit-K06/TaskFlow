// FilterBar — client-side status + date range filters with quick presets
"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { TaskStatus } from "@/lib/types";
import { format, addDays, endOfWeek } from "date-fns";

export interface FilterState {
  statuses: TaskStatus[];
  startFrom: string;
  startTo: string;
  dueFrom: string;
  dueTo: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  ongoing: "Ongoing",
  completed: "Completed",
};

const ALL_STATUSES: TaskStatus[] = ["not_started", "ongoing", "completed"];

function todayStr() { return format(new Date(), "yyyy-MM-dd"); }
function tomorrowStr() { return format(addDays(new Date(), 1), "yyyy-MM-dd"); }
function endOfWeekStr() { return format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"); }

function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.statuses.length > 0 && f.statuses.length < 3) n++;
  if (f.startFrom || f.startTo) n++;
  if (f.dueFrom || f.dueTo) n++;
  return n;
}

type DuePreset = "all" | "today" | "tomorrow" | "week";

function activeDuePreset(f: FilterState): DuePreset | null {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  const eow = endOfWeekStr();
  if (!f.dueFrom && !f.dueTo) return "all";
  if (f.dueFrom === today && f.dueTo === today) return "today";
  if (f.dueFrom === tomorrow && f.dueTo === tomorrow) return "tomorrow";
  if (f.dueFrom === today && f.dueTo === eow) return "week";
  return null;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);
  const duePreset = activeDuePreset(filters);

  function toggleStatus(s: TaskStatus) {
    const current = filters.statuses;
    const next = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    onChange({ ...filters, statuses: next });
  }

  function setDuePreset(preset: DuePreset) {
    const today = todayStr();
    const tomorrow = tomorrowStr();
    const eow = endOfWeekStr();
    const map: Record<DuePreset, { dueFrom: string; dueTo: string }> = {
      all:      { dueFrom: "", dueTo: "" },
      today:    { dueFrom: today, dueTo: today },
      tomorrow: { dueFrom: tomorrow, dueTo: tomorrow },
      week:     { dueFrom: today, dueTo: eow },
    };
    onChange({ ...filters, ...map[preset] });
  }

  function clear() {
    onChange({ statuses: [], startFrom: "", startTo: "", dueFrom: "", dueTo: "" });
  }

  const PRESETS: { key: DuePreset; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "today",    label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "week",     label: "This Week" },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          id="filter-toggle-btn"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
          style={{
            borderColor: open || active > 0 ? "var(--accent)" : "var(--border)",
            color: open || active > 0 ? "var(--accent)" : "var(--muted)",
            backgroundColor: "var(--surface)",
          }}
        >
          <Filter size={12} />
          Filters
          {active > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {active}
            </span>
          )}
          <ChevronDown
            size={12}
            className="transition-transform duration-150"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        {active > 0 && (
          <button
            id="filter-clear-btn"
            onClick={clear}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <X size={11} />
            Clear
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute z-40 top-full mt-2 left-0 rounded-xl shadow-2xl border p-4 w-80"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Status */}
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            Status
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                id={`filter-status-${s}`}
                onClick={() => toggleStatus(s)}
                className="px-2.5 py-1 rounded text-xs font-medium border transition-colors"
                style={{
                  borderColor: filters.statuses.includes(s) ? "var(--accent)" : "var(--border)",
                  color: filters.statuses.includes(s) ? "var(--accent)" : "var(--muted)",
                  backgroundColor: filters.statuses.includes(s) ? "rgba(181,80,47,0.12)" : "transparent",
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Due Date Quick Presets */}
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            Due Date
          </p>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                id={`filter-due-preset-${key}`}
                onClick={() => setDuePreset(key)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                style={{
                  borderColor: duePreset === key ? "var(--accent)" : "var(--border)",
                  color: duePreset === key ? "#fff" : "var(--muted)",
                  backgroundColor: duePreset === key ? "var(--accent)" : "transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Manual Due Date range */}
          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={filters.dueFrom}
              onChange={(e) => onChange({ ...filters, dueFrom: e.target.value })}
              className="flex-1 text-xs rounded border px-2 py-1 outline-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
            />
            <input
              type="date"
              value={filters.dueTo}
              onChange={(e) => onChange({ ...filters, dueTo: e.target.value })}
              className="flex-1 text-xs rounded border px-2 py-1 outline-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
            />
          </div>

          {/* Start Date */}
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            Start Date
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startFrom}
              onChange={(e) => onChange({ ...filters, startFrom: e.target.value })}
              className="flex-1 text-xs rounded border px-2 py-1 outline-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
              placeholder="From"
            />
            <input
              type="date"
              value={filters.startTo}
              onChange={(e) => onChange({ ...filters, startTo: e.target.value })}
              className="flex-1 text-xs rounded border px-2 py-1 outline-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text)" }}
              placeholder="To"
            />
          </div>
        </div>
      )}
    </div>
  );
}
