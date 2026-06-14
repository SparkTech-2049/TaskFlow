import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const { id } = await params;
  const taskId = Number(id);

  const result = await db.update(tasks)
    .set({ archived: true, archivedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const { id } = await params;
  const taskId = Number(id);

  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  return NextResponse.json({ ok: true });
}
