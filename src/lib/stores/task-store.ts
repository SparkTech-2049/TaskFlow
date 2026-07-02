import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task } from '@/lib/types';
import { localDB } from '@/lib/indexeddb';
import { enqueueSync } from '@/lib/indexeddb/sync-queue';

const VALID_PRIORITIES = new Set(['urgent_important', 'important', 'urgent', 'normal']);
const VALID_CATS = new Set(['project', 'other', 'credit', 'study']);
const SUB_CAT_IDS = new Set(['project-setup', 'study-improve', 'long-term', 'register-download', 'quick-task']);

function normalizeTask(task: Task): Task {
  let cat = task.cat;
  if (!VALID_CATS.has(cat)) {
    if (SUB_CAT_IDS.has(cat)) cat = 'other';
    else cat = 'project';
  }
  return {
    ...task,
    priorityLevel: VALID_PRIORITIES.has(task.priorityLevel) ? task.priorityLevel : 'normal',
    cat,
  };
}

interface TaskStore {
  tasks: Task[];
  selectedMonth: string;
  selectedDate: string | null;
  isLoading: boolean;
  _hydrated: boolean;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedDate: (date: string | null) => void;
  syncToServer: () => Promise<{ success: number; failed: number }>;
  fetchFromServer: () => Promise<void>;
  generateMonthlyRepeats: (month: string) => void;
  cleanupDuplicateRepeats: () => void;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPersist: Task[] | null = null;

async function persistToIndexedDB(tasks: Task[]) {
  try {
    await localDB.tasks.clear();
    await localDB.tasks.bulkPut(
      tasks.map((t) => ({ ...t, userId: 1 }))
    );
  } catch {}
}

function debouncedPersist(tasks: Task[]) {
  pendingPersist = tasks;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (pendingPersist) {
      persistToIndexedDB(pendingPersist);
      pendingPersist = null;
    }
    persistTimer = null;
  }, 300);
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: Number(row.id),
    cat: String(row.cat ?? ''),
    subCat: (row.subCat ?? null) as string | null,
    parentId: (row.parentId ?? null) as number | null,
    title: String(row.title ?? ''),
    meta: (row.meta ?? null) as string | null,
    priorityLevel: String(row.priorityLevel ?? 'normal'),
    deadline: (row.deadline ?? null) as string | null,
    startDate: (row.startDate ?? row.start_date ?? null) as string | null,
    endDate: (row.endDate ?? row.end_date ?? null) as string | null,
    time: (row.time ?? null) as string | null,
    done: Boolean(row.done),
    archived: Boolean(row.archived),
    longterm: Boolean(row.longterm),
    reminder: Boolean(row.reminder),
    monthlyRepeat: Boolean(row.monthlyRepeat),
    repeatSourceId: (row.repeatSourceId ?? row.repeat_source_id ?? null) as number | null,
    archivedAt: (row.archivedAt ?? row.archived_at ?? null) as string | null,
    completedAt: (row.completedAt ?? row.completed_at ?? null) as string | null,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? new Date().toISOString()),
  };
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      selectedMonth: new Date().toISOString().slice(0, 7),
      selectedDate: null,
      isLoading: false,
      _hydrated: false,
      setTasks: (tasks) => {
        set({ tasks });
        debouncedPersist(tasks);
      },
      addTask: (task) => {
        const normalized = normalizeTask(task);
        set((state) => {
          const newTasks = [...state.tasks, normalized];
          debouncedPersist(newTasks);
          return { tasks: newTasks };
        });
        fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cat: normalized.cat,
            sub_cat: normalized.subCat,
            title: normalized.title,
            meta: normalized.meta,
            priority_level: normalized.priorityLevel,
            deadline: normalized.deadline,
            start_date: normalized.startDate,
            end_date: normalized.endDate,
            time: normalized.time,
            longterm: normalized.longterm,
            reminder: normalized.reminder,
            monthly_repeat: normalized.monthlyRepeat,
            repeat_source_id: normalized.repeatSourceId,
          }),
        }).then(async (res) => {
          if (res.ok) {
            const serverTask = await res.json();
            const serverId = Number(serverTask.id);
            if (serverId && serverId !== normalized.id) {
              set((state) => {
                const updated = state.tasks.map((t) =>
                  t.id === normalized.id ? { ...t, id: serverId } : t
                );
                debouncedPersist(updated);
                return { tasks: updated };
              });
            }
          }
        }).catch(() => {
          enqueueSync('create', normalized as unknown as Record<string, unknown>).catch(() => {});
        });
      },
      updateTask: (id, updates) => {
        const normalized = { ...updates };
        if (normalized.priorityLevel !== undefined && !VALID_PRIORITIES.has(normalized.priorityLevel)) {
          normalized.priorityLevel = 'normal';
        }
        if (normalized.cat !== undefined && !VALID_CATS.has(normalized.cat) && !normalized.cat) {
          normalized.cat = 'project';
        }
        if (normalized.done === true) {
          normalized.completedAt = new Date().toISOString();
        } else if (normalized.done === false) {
          normalized.completedAt = null;
        }
        set((state) => {
          const newTasks = state.tasks.map((t) =>
            t.id === id ? { ...t, ...normalized } : t
          );
          debouncedPersist(newTasks);
          return { tasks: newTasks };
        });
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          const payload: Record<string, unknown> = {};
          if (normalized.cat !== undefined) payload.cat = normalized.cat;
          if (normalized.subCat !== undefined) payload.sub_cat = normalized.subCat;
          if (normalized.title !== undefined) payload.title = normalized.title;
          if (normalized.meta !== undefined) payload.meta = normalized.meta;
          if (normalized.priorityLevel !== undefined) payload.priority_level = normalized.priorityLevel;
          if (normalized.deadline !== undefined) payload.deadline = normalized.deadline;
          if (normalized.startDate !== undefined) payload.start_date = normalized.startDate;
          if (normalized.endDate !== undefined) payload.end_date = normalized.endDate;
          if (normalized.time !== undefined) payload.time = normalized.time;
          if (normalized.done !== undefined) payload.done = normalized.done;
          if (normalized.archived !== undefined) payload.archived = normalized.archived;
          if (normalized.longterm !== undefined) payload.longterm = normalized.longterm;
          if (normalized.reminder !== undefined) payload.reminder = normalized.reminder;
          if (normalized.monthlyRepeat !== undefined) payload.monthly_repeat = normalized.monthlyRepeat;
          if (normalized.repeatSourceId !== undefined) payload.repeat_source_id = normalized.repeatSourceId;
          if (normalized.archivedAt !== undefined) payload.archived_at = normalized.archivedAt;
          if (normalized.completedAt !== undefined) payload.completed_at = normalized.completedAt;

          fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((res) => {
            if (!res.ok) {
              console.error('[updateTask] PUT failed:', id, res.status, payload);
            }
          }).catch((e) => {
            console.error('[updateTask] PUT error:', id, e);
            enqueueSync('update', { ...task, ...normalized } as unknown as Record<string, unknown>).catch(() => {});
          });
        }
      },
      deleteTask: (id) => {
        set((state) => {
          const newTasks = state.tasks.filter((t) => t.id !== id);
          debouncedPersist(newTasks);
          return { tasks: newTasks };
        });
        fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => {
          enqueueSync('delete', { id } as unknown as Record<string, unknown>).catch(() => {});
        });
      },
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      generateMonthlyRepeats: (month: string) => {
        const { tasks, addTask } = get();
        const [year, m] = month.split('-').map(Number);
        const monthStart = `${year}-${String(m).padStart(2, '0')}-01`;
        const monthEnd = m === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(m + 1).padStart(2, '0')}-01`;

        const templates = tasks.filter(
          (t) => t.monthlyRepeat && !t.repeatSourceId && !t.archived
        );

        for (const template of templates) {
          const existingInstance = tasks.find(
            (t) =>
              t.repeatSourceId === template.id &&
              t.deadline &&
              t.deadline >= monthStart &&
              t.deadline < monthEnd
          );
          if (existingInstance) continue;

          let newDeadline: string | null = null;
          if (template.deadline) {
            const origDay = parseInt(template.deadline.slice(8, 10), 10);
            const lastDay = new Date(year, m, 0).getDate();
            const day = Math.min(origDay, lastDay);
            newDeadline = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }

          const now = new Date().toISOString();
          addTask({
            id: Date.now() + Math.random(),
            parentId: null,
            cat: template.cat,
            subCat: template.subCat,
            title: template.title,
            meta: template.meta,
            priorityLevel: template.priorityLevel,
            deadline: newDeadline,
            startDate: null,
            endDate: null,
            time: template.time,
            done: false,
            archived: false,
            longterm: false,
            reminder: template.reminder,
            monthlyRepeat: false,
            repeatSourceId: template.id,
            archivedAt: null,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
          });
        }
      },
      cleanupDuplicateRepeats: () => {
        const { tasks, deleteTask } = get();
        const groups: Record<string, Task[]> = {};
        tasks
          .filter((t) => t.monthlyRepeat && !t.archived)
          .forEach((t) => {
            const key = `${t.title}::${t.cat}::${t.subCat ?? ''}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
          });

        for (const [, group] of Object.entries(groups)) {
          if (group.length <= 1) continue;
          group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          for (let i = 1; i < group.length; i++) {
            deleteTask(group[i].id);
          }
        }

        const instanceGroups: Record<string, Task[]> = {};
        tasks
          .filter((t) => t.repeatSourceId && !t.archived)
          .forEach((t) => {
            const month = t.deadline ? t.deadline.slice(0, 7) : 'none';
            const key = `${t.repeatSourceId}::${month}`;
            if (!instanceGroups[key]) instanceGroups[key] = [];
            instanceGroups[key].push(t);
          });

        for (const [, group] of Object.entries(instanceGroups)) {
          if (group.length <= 1) continue;
          group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          for (let i = 1; i < group.length; i++) {
            deleteTask(group[i].id);
          }
        }
      },
      syncToServer: async () => {
        const { processSyncQueue } = await import('@/lib/indexeddb/sync-queue');
        return processSyncQueue();
      },
      fetchFromServer: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/tasks');
          console.log('[fetchFromServer] status:', res.status);
          if (res.ok) {
            const data = await res.json();
            console.log('[fetchFromServer] data count:', data?.length);
            const tasks = data.map(mapTask).map(normalizeTask);
            console.log('[fetchFromServer] mapped count:', tasks.length, 'sample:', tasks[0]);
            set({ tasks });
            persistToIndexedDB(tasks);
          } else {
            console.error('[fetchFromServer] not ok:', res.status, await res.text());
          }
        } catch (e) {
          console.error('[fetchFromServer] error:', e);
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'taskflow-tasks',
      partialize: (state) => ({
        tasks: state.tasks,
        selectedMonth: state.selectedMonth,
        selectedDate: state.selectedDate,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('[rehydrate] error:', error);
          }
          setTimeout(() => {
            const tasks = useTaskStore.getState().tasks;
            const needsFix = tasks.some(
              (t) => !VALID_PRIORITIES.has(t.priorityLevel) || !VALID_CATS.has(t.cat)
            );
            if (needsFix) {
              const fixed = tasks.map(normalizeTask);
              useTaskStore.setState({ tasks: fixed, _hydrated: true } as Partial<TaskStore>);
              persistToIndexedDB(fixed);
              console.log('[rehydrate] normalized', fixed.length, 'tasks');
            } else {
              useTaskStore.setState({ _hydrated: true } as Partial<TaskStore>);
            }
            console.log('[rehydrate] done, _hydrated set to true');
          }, 0);
        };
      },
    }
  )
);
