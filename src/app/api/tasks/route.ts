import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function GET(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  let result;

  if (month) {
    const [year, m] = month.split('-').map(Number);
    const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
    const endDate = m === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(m + 1).padStart(2, '0')}-01`;

    result = await db.select().from(tasks).where(
      and(
        eq(tasks.archived, false),
        gte(tasks.deadline, startDate),
        lt(tasks.deadline, endDate),
      )
    );
  } else {
    result = await db.select().from(tasks);
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const body = await request.json();
  const result = await db.insert(tasks).values({
    userId,
    cat: body.cat,
    subCat: body.sub_cat || null,
    title: body.title,
    meta: body.meta || null,
    priorityLevel: body.priority_level,
    deadline: body.deadline || null,
    startDate: body.start_date || null,
    endDate: body.end_date || null,
    time: body.time || null,
    done: false,
    archived: false,
    longterm: body.longterm || false,
    reminder: body.reminder || false,
    monthlyRepeat: body.monthly_repeat || false,
  }).returning();

  return NextResponse.json(result[0], { status: 201 });
}
