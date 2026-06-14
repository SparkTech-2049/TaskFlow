import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth/api-auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const result = await db.select().from(categories).where(eq(categories.userId, userId));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();

  const result = await db.insert(categories).values({
    id: body.id,
    userId,
    name: body.name,
    color: body.color,
    icon: body.icon || null,
    parentId: body.parent_id || null,
    sortOrder: body.sort_order || 0,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
