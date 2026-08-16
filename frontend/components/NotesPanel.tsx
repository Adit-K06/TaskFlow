// NotesPanel — global scratchpad in the sidebar; auto-saves on blur
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function NotesPanel() {
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(content);

  useEffect(() => {
    latestContent.current = content;
  }, [content]);

  // Load notes on mount
  useEffect(() => {
    api.notes.get().then((n) => setContent(n.content)).catch(() => {});
  }, []);

  const save = useCallback(async (text: string) => {
    setSaveState("saving");
    try {
      await api.notes.update({ content: text });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    setSaveState("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(val), 900);
  }

  function handleBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(latestContent.current);
  }

  return (
    <div
      className="mx-2 mb-2 rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      {/* Header */}
      <button
        id="notes-panel-toggle"
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5"
      >
        <StickyNote size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span
          className="flex-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Notes
        </span>

        {/* Save indicator */}
        {saveState === "saving" && (
          <Loader2 size={10} className="animate-spin" style={{ color: "var(--muted)" }} />
        )}
        {saveState === "saved" && (
          <Check size={10} style={{ color: "var(--due-done, #6aab6a)" }} />
        )}
        {saveState === "error" && (
          <span className="text-[9px]" style={{ color: "var(--danger, #e05c5c)" }}>
            !
          </span>
        )}

        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            color: "var(--muted)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Textarea — shown when expanded */}
      {expanded && (
        <textarea
          id="notes-textarea"
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Jot down quick tasks, reminders…"
          rows={6}
          className="w-full resize-none text-xs px-3 pb-3 pt-1 outline-none bg-transparent leading-relaxed"
          style={{
            color: "var(--text)",
            caretColor: "var(--accent)",
          }}
        />
      )}
    </div>
  );
}
