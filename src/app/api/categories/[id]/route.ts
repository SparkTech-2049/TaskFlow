import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const { id } = await params;

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  return NextResponse.json({ ok: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const { id } = await params;
  const body = await request.json();

  const result = await db.update(categories)
    .set({
      name: body.name,
      color: body.color,
      icon: body.icon,
      parentId: body.parent_id,
      sortOrder: body.sort_order,
    })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();

  return NextResponse.json(result[0]);
}
