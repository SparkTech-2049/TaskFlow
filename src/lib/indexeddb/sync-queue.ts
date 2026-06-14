import { localDB } from './index';

export async function enqueueSync(
  type: 'create' | 'update' | 'delete',
  payload: Record<string, unknown>,
  tempId?: string
) {
  await localDB.syncQueue.add({
    type,
    payload: JSON.stringify(payload),
    timestamp: new Date().toISOString(),
    tempId: tempId || crypto.randomUUID(),
  });
}

export async function processSyncQueue(): Promise<{
  success: number;
  failed: number;
}> {
  const queue = await localDB.syncQueue.toArray();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const payload = JSON.parse(item.payload);
      const endpoint =
        item.type === 'create'
          ? '/api/tasks'
          : item.type === 'update'
            ? `/api/tasks/${payload.id}`
            : `/api/tasks/${payload.id}`;

      const method = item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(payload) : undefined,
      });

      if (res.ok) {
        await localDB.syncQueue.delete(item.id!);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

export async function getQueueSize(): Promise<number> {
  return localDB.syncQueue.count();
}
