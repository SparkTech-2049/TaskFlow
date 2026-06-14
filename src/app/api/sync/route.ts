import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth/api-auth';

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const clientTasks = body.tasks as Record<string, unknown>[];

  const serverTasks = await db.select().from(tasks).where(
    and(eq(tasks.userId, userId), eq(tasks.archived, false))
  );

  const serverMap = new Map(serverTasks.map((t) => [t.id, t]));
  const toCreate: typeof tasks.$inferInsert[] = [];
  const toUpdate: { id: number; data: Partial<typeof tasks.$inferSelect> }[] = [];

  for (const ct of clientTasks) {
    const id = Number(ct.id);
    const server = serverMap.get(id);
    if (!server) {
      toCreate.push({
        id,
        userId,
        cat: String(ct.cat),
        subCat: ct.sub_cat ? String(ct.sub_cat) : null,
        parentId: ct.parent_id ? Number(ct.parent_id) : null,
        title: String(ct.title),
        meta: ct.meta ? String(ct.meta) : null,
        priorityLevel: String(ct.priority_level),
        deadline: ct.deadline ? String(ct.deadline) : null,
        startDate: ct.start_date ? String(ct.start_date) : null,
        endDate: ct.end_date ? String(ct.end_date) : null,
        time: ct.time ? String(ct.time) : null,
        done: Boolean(ct.done),
        archived: Boolean(ct.archived),
        longterm: Boolean(ct.longterm),
        reminder: Boolean(ct.reminder),
        monthlyRepeat: Boolean(ct.monthly_repeat),
      });
    } else {
      const clientUpdated = new Date(String(ct.updated_at || 0)).getTime();
      const serverUpdated = new Date(server.updatedAt).getTime();
      if (clientUpdated > serverUpdated) {
        toUpdate.push({ id, data: {
          cat: String(ct.cat),
          subCat: ct.sub_cat ? String(ct.sub_cat) : null,
          title: String(ct.title),
          meta: ct.meta ? String(ct.meta) : null,
          priorityLevel: String(ct.priority_level),
          deadline: ct.deadline ? String(ct.deadline) : null,
          done: Boolean(ct.done),
          archived: Boolean(ct.archived),
          longterm: Boolean(ct.longterm),
          reminder: Boolean(ct.reminder),
          monthlyRepeat: Boolean(ct.monthly_repeat),
        }});
      }
    }
  }

  let created = 0;
  let updated = 0;

  for (const item of toCreate) {
    await db.insert(tasks).values(item);
    created++;
  }

  for (const { id, data } of toUpdate) {
    await db.update(tasks).set(data).where(
      and(eq(tasks.id, id), eq(tasks.userId, userId))
    );
    updated++;
  }

  return NextResponse.json({
    serverTasks: serverTasks.length,
    created,
    updated,
  });
}
