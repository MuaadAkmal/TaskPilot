import { ProjectCode } from "./project-config";

export interface MockTask {
  id: string;
  project: ProjectCode;
  tsp: string;
  lsa: string;
  status: "RESOLVED" | "IN_PROGRESS" | "PENDING_VERIFICATION" | "CLOSED";
  problemDescription: string;
  solution: string;
  remarks: string | null;
  createdAt: string;
  resolvedAt: string | null;
  downtimeMinutes: number | null;
  raisedByName: string;
  createdByName?: string | null;
  createdByEmail?: string | null;
  docLinks: string[];
  updatedAt: string;
}

// Initial empty dataset ready for real production ingestion
const INITIAL_TASKS: MockTask[] = [];

// Global in-memory / persistent mock store with automatic fallback
declare global {
  var __taskStore: MockTask[] | undefined;
}

if (!globalThis.__taskStore) {
  globalThis.__taskStore = [];
}

export const taskStore = {
  getAll: (project?: ProjectCode): MockTask[] => {
    const list = globalThis.__taskStore || [];
    if (project) {
      return list.filter((t) => t.project === project);
    }
    return list;
  },

  getById: (id: string): MockTask | undefined => {
    return (globalThis.__taskStore || []).find((t) => t.id === id);
  },

  create: (task: Omit<MockTask, "id" | "updatedAt">): MockTask => {
    const id = `TS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newTask: MockTask = {
      ...task,
      id,
      updatedAt: now,
    };
    if (!globalThis.__taskStore) {
      globalThis.__taskStore = [];
    }
    globalThis.__taskStore.unshift(newTask);
    return newTask;
  },

  update: (id: string, updates: Partial<MockTask>): MockTask | null => {
    const list = globalThis.__taskStore || [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updated: MockTask = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return updated;
  },

  delete: (id: string): boolean => {
    const list = globalThis.__taskStore || [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  },
};
