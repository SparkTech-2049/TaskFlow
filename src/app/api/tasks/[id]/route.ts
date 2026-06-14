import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth/api-auth';

const ALLOWED_FIELDS = [
  'cat', 'subCat', 'title', 'meta', 'priorityLevel',
  'deadline', 'startDate', 'endDate', 'time',
  'done', 'archived', 'longterm', 'reminder', 'monthlyRepeat', 'archivedAt', 'completedAt',
] as const;

function mapBodyToColumns(body: Record<string, unknown>): Record<string, unknown> {
  const mapping: Record<string, string> = {
    sub_cat: 'subCat',
    priority_level: 'priorityLevel',
    start_date: 'startDate',
    end_date: 'endDate',
    monthly_repeat: 'monthlyRepeat',
    archived_at: 'archivedAt',
    completed_at: 'completedAt',
  };
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const mappedKey = mapping[key] || key;
    if ((ALLOWED_FIELDS as readonly string[]).includes(mappedKey)) {
      result[mappedKey] = value;
    }
  }
  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const result = await db.select().from(tasks).where(
    and(eq(tasks.id, Number(id)), eq(tasks.userId, userId))
  );
  if (!result.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(result[0]);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const body = await request.json();
  const updates = mapBodyToColumns(body);

  if (updates.archivedAt && typeof updates.archivedAt === 'string') {
    updates.archivedAt = new Date(updates.archivedAt as string);
  }
  if (updates.completedAt && typeof updates.completedAt === 'string') {
    updates.completedAt = new Date(updates.completedAt as string);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  const result = await db.update(tasks)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(tasks.id, Number(id)), eq(tasks.userId, userId)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  await db.delete(tasks).where(and(eq(tasks.id, Number(id)), eq(tasks.userId, userId)));
  return NextResponse.json({ ok: true });
}
