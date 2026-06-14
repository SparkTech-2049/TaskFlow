import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function getAuthUserId(): Promise<number | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return Number(session.user.id);
}
