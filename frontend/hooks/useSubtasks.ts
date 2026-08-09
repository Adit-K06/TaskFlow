// Hook for fetching subtasks of a single task
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Subtask } from "@/lib/types";

interface UseSubtasksReturn {
  subtasks: Subtask[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubtasks(taskId: string): UseSubtasksReturn {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.tasks.subtasks(taskId);
      setSubtasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subtasks");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { subtasks, loading, error, refetch: fetch };
}
