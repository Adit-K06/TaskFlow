// Small colored dot + client name chip — used on Home view task rows
"use client";

interface ClientColorChipProps {
  color: string;
  name: string;
  compact?: boolean;
}

export default function ClientColorChip({ color, name, compact = false }: ClientColorChipProps) {
  if (compact) {
    return (
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={name}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        className="text-xs font-medium truncate max-w-[7rem]"
        style={{ color: "var(--muted)" }}
      >
        {name}
      </span>
    </span>
  );
}
