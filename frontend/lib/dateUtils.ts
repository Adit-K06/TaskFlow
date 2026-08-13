// Date utility helpers — all date logic lives here, never inline in components
// Uses date-fns exclusively — no new Date().toLocaleDateString()
import {
  parseISO,
  format,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { Task } from "./types";

/** Parse an ISO date string "YYYY-MM-DD" safely. Returns null if falsy. */
export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  return parseISO(iso);
}

/** Format a date for display in the table, e.g. "14 Aug" */
export function formatShort(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return "—";
  return format(d, "d MMM");
}

/** Format a month group header, e.g. "August 2026" */
export function formatMonthHeader(iso: string): string {
  return format(parseISO(iso), "MMMM yyyy");
}

/** Returns the month key "YYYY-MM" from a due_date ISO string, or "no-date". */
export function monthKey(dueDate: string | null): string {
  if (!dueDate) return "no-date";
  return dueDate.slice(0, 7); // "YYYY-MM"
}

/** Month label from key, e.g. "2026-08" → "August 2026" */
export function monthLabelFromKey(key: string): string {
  if (key === "no-date") return "No Due Date";
  return format(parseISO(`${key}-01`), "MMMM yyyy");
}

/** Returns the year key "YYYY" from a due_date ISO string, or "no-date". */
export function yearKey(dueDate: string | null): string {
  if (!dueDate) return "no-date";
  return dueDate.slice(0, 4); // "YYYY"
}

/** Year label from key, e.g. "2026" → "2026" */
export function yearLabelFromKey(key: string): string {
  if (key === "no-date") return "No Due Date";
  return key;
}

/**
 * Group tasks by their due_date year.
 * Returns an ordered array of { key, label, tasks } — chronological, "no-date" last.
 */
export function groupByYear(
  tasks: Task[]
): { key: string; label: string; tasks: Task[] }[] {
  const map = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = yearKey(task.due_date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }

  const dated = Array.from(map.entries())
    .filter(([k]) => k !== "no-date")
    .sort(([a], [b]) => a.localeCompare(b));

  const noDue = map.has("no-date")
    ? [["no-date", map.get("no-date")!] as [string, Task[]]]
    : [];

  return [...dated, ...noDue].map(([key, tasks]) => ({
    key,
    label: yearLabelFromKey(key),
    tasks,
  }));
}

/**
 * Group tasks by their due_date month.
 * Returns an ordered array of { key, label, tasks } — chronological, "no-date" last.
 */
export function groupByMonth(
  tasks: Task[]
): { key: string; label: string; tasks: Task[] }[] {
  const map = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = monthKey(task.due_date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }

  const dated = Array.from(map.entries())
    .filter(([k]) => k !== "no-date")
    .sort(([a], [b]) => a.localeCompare(b));

  const noDue = map.has("no-date")
    ? [["no-date", map.get("no-date")!] as [string, Task[]]]
    : [];

  return [...dated, ...noDue].map(([key, tasks]) => ({
    key,
    label: monthLabelFromKey(key),
    tasks,
  }));
}

/** Due-date urgency classification — maps to CSS custom property names. */
export type DueColorClass =
  | "due-done"
  | "due-none"
  | "due-overdue"
  | "due-soon"
  | "due-warning"
  | "due-ok";

export function getDueColorClass(
  dueDate: string | null,
  isCompleted: boolean
): DueColorClass {
  if (isCompleted) return "due-done";
  if (!dueDate) return "due-none";
  const days = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (days < 0) return "due-overdue";
  if (days <= 2) return "due-soon";
  if (days <= 6) return "due-warning";
  return "due-ok";
}

/** Human-readable tooltip for due date, e.g. "Overdue by 3 days", "Due in 2 days" */
export function getDueLabel(dueDate: string | null, isCompleted: boolean): string {
  if (isCompleted) return "Completed";
  if (!dueDate) return "No due date";
  const days = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

// Calendar helpers
export { startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, format, parseISO };
