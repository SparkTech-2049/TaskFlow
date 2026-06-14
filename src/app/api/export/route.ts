import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth/api-auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const result = await db.select().from(tasks).where(eq(tasks.userId, userId));

  const data = JSON.stringify({ tasks: result, exportedAt: new Date().toISOString() }, null, 2);

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="taskflow-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
