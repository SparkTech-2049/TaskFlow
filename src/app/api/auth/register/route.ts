import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/utils/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message || '参数校验失败';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { username, password } = result.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      username,
      passwordHash,
    });

    return NextResponse.json({ message: '注册成功' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
