// Hook for fetching tasks — all tasks or filtered by clientId
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Task } from "@/lib/types";

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTasks(clientId?: string): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = clientId
        ? await api.clients.tasks(clientId)
        : await api.tasks.list();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { tasks, loading, error, refetch: fetch };
}
