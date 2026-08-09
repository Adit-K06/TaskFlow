// Slim progress bar + x/y label — shows subtask progress or task completion progress
"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
  isCompleted?: boolean;
}

export default function ProgressBar({ completed, total, isCompleted }: ProgressBarProps) {
  // If task has subtasks
  let displayCompleted = completed;
  let displayTotal = total;

  if (total === 0) {
    displayTotal = 1;
    displayCompleted = isCompleted ? 1 : 0;
  }

  const pct = Math.round((displayCompleted / displayTotal) * 100);
  const isDone = displayCompleted === displayTotal;

  return (
    <div className="flex items-center gap-1.5 min-w-0 w-full max-w-[100px]">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: isDone ? "var(--success)" : "var(--accent)",
          }}
        />
      </div>
      <span
        className="text-[11px] tabular-nums shrink-0 font-medium"
        style={{ color: isDone ? "var(--success)" : "var(--muted)" }}
      >
        {pct}%
      </span>
    </div>
  );
}
