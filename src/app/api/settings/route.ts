import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

  if (result.length === 0) {
    await db.insert(userSettings).values({ userId });
    const created = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return NextResponse.json(created[0]);
  }

  return NextResponse.json(result[0]);
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const body = await request.json();

  const allowedFields = ['fontSize', 'showDone', 'hideEmptyCat', 'defaultSort', 'barkWebhook'] as const;
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const result = await db.update(userSettings)
    .set(updates)
    .where(eq(userSettings.userId, userId))
    .returning();

  return NextResponse.json(result[0]);
}
