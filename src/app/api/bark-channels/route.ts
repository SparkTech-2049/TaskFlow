import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barkChannels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth/api-auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const channels = await db.select().from(barkChannels).where(eq(barkChannels.userId, userId));
  return NextResponse.json(channels);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const { name, url } = body;

  if (!name || !url) {
    return NextResponse.json({ error: 'name and url are required' }, { status: 400 });
  }

  const result = await db.insert(barkChannels).values({
    userId,
    name,
    url,
  }).returning();

  return NextResponse.json(result[0]);
}

export async function PUT(request: Request) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const { id, name, url, enabled } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (url !== undefined) updates.url = url;
  if (enabled !== undefined) updates.enabled = enabled;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const result = await db.update(barkChannels)
    .set(updates)
    .where(eq(barkChannels.id, id))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(request: Request) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const result = await db.delete(barkChannels)
    .where(eq(barkChannels.id, Number(id)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
