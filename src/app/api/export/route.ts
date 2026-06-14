import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

export async function GET() {
  const session = await auth();
  const userId = Number(session?.user?.id) || 1;

  const result = await db.select().from(tasks).where(eq(tasks.userId, userId));

  const data = JSON.stringify({ tasks: result, exportedAt: new Date().toISOString() }, null, 2);

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="taskflow-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
