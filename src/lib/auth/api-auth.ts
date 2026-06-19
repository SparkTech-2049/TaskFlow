import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function getAuthUserId(): Promise<number | NextResponse> {
  try {
    const session = await auth();
    console.log('[getAuthUserId] session:', JSON.stringify({ id: session?.user?.id, name: session?.user?.name }));
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    return Number(session.user.id);
  } catch (error) {
    console.error('[getAuthUserId] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
