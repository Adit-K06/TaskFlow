// Shared TypeScript types mirroring backend Pydantic schemas exactly
// All dates come as ISO 8601 strings from the API and are parsed with date-fns

export type TaskStatus = "not_started" | "ongoing" | "completed";

export interface Client {
  id: string;
  name: string;
  category: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  sr_no: number;
  name: string;
  remarks: string | null;
  start_date: string | null; // "YYYY-MM-DD"
  due_date: string | null;   // "YYYY-MM-DD"
  assignees: string[];
  status: TaskStatus;
  is_completed: boolean;
  subtask_count: number;
  completed_subtask_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  created_at: string;
}

// ── Request shapes ─────────────────────────────────────────────────────────────

export interface ClientCreate {
  name: string;
  category?: string | null;
  color?: string;
}

export interface ClientUpdate {
  name?: string;
  category?: string | null;
  color?: string;
}

export interface TaskCreate {
  name: string;
  remarks?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  assignees?: string[];
  status?: TaskStatus;
  is_completed?: boolean;
}

export interface TaskUpdate {
  name?: string;
  remarks?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  assignees?: string[];
  status?: TaskStatus;
  is_completed?: boolean;
  sr_no?: number;
}

export interface SubtaskCreate {
  name: string;
  is_completed?: boolean;
}

export interface SubtaskUpdate {
  name?: string;
  is_completed?: boolean;
}

// ── API error ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}
