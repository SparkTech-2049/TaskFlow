import Dexie, { type EntityTable } from 'dexie';

interface LocalTask {
  id: number;
  userId: number;
  cat: string;
  subCat: string | null;
  parentId: number | null;
  title: string;
  meta: string | null;
  priorityLevel: string;
  deadline: string | null;
  startDate: string | null;
  endDate: string | null;
  time: string | null;
  done: boolean;
  archived: boolean;
  longterm: boolean;
  reminder: boolean;
  monthlyRepeat: boolean;
  archivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncQueueItem {
  id?: number;
  type: 'create' | 'update' | 'delete';
  payload: string;
  timestamp: string;
  tempId: string;
}

class TaskFlowDB extends Dexie {
  tasks!: EntityTable<LocalTask, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('taskflow');
    this.version(1).stores({
      tasks: 'id, userId, cat, deadline, done, archived, longterm',
      syncQueue: '++id, type, timestamp',
    });
  }
}

export const localDB = new TaskFlowDB();
