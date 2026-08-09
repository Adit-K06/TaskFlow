// Typed fetch wrapper for all backend API calls
// All components call hooks → hooks call this file — never fetch() directly in components
import {
  ApiError,
  Client, ClientCreate, ClientUpdate,
  Task, TaskCreate, TaskUpdate,
  Subtask, SubtaskCreate, SubtaskUpdate,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Clients ────────────────────────────────────────────────────────────────────

export const api = {
  clients: {
    list: () => request<Client[]>("/clients"),
    get: (id: string) => request<Client>(`/clients/${id}`),
    create: (body: ClientCreate) =>
      request<Client>("/clients", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: ClientUpdate) =>
      request<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/clients/${id}`, { method: "DELETE" }),
    tasks: (id: string) => request<Task[]>(`/clients/${id}/tasks`),
    createTask: (id: string, body: TaskCreate) =>
      request<Task>(`/clients/${id}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  tasks: {
    list: (clientId?: string) =>
      request<Task[]>(`/tasks${clientId ? `?client_id=${clientId}` : ""}`),
    get: (id: string) => request<Task>(`/tasks/${id}`),
    update: (id: string, body: TaskUpdate) =>
      request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
    reorder: (id: string, taskIds: string[]) =>
      request<Task[]>(`/tasks/${id}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ task_ids: taskIds }),
      }),
    subtasks: (id: string) => request<Subtask[]>(`/tasks/${id}/subtasks`),
    createSubtask: (id: string, body: SubtaskCreate) =>
      request<Subtask>(`/tasks/${id}/subtasks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  // ── Subtasks ───────────────────────────────────────────────────────────────
  subtasks: {
    update: (id: string, body: SubtaskUpdate) =>
      request<Subtask>(`/subtasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<void>(`/subtasks/${id}`, { method: "DELETE" }),
  },
};
