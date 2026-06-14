import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';

function createAuthConfig() {
  const hasDb = !!process.env.POSTGRES_URL;

  return {
    ...(hasDb ? (() => {
      const { getDb } = require('@/lib/db');
      return { adapter: DrizzleAdapter(getDb()) };
    })() : {}),
    providers: [
      Credentials({
        name: 'credentials',
        credentials: {
          username: { label: '用户名', type: 'text' },
          password: { label: '密码', type: 'password' },
        },
        async authorize(credentials: Partial<Record<string, unknown>>, request) {
          if (!credentials?.username || !credentials?.password) return null;

          const ip = request?.headers?.get?.('x-forwarded-for')
            || request?.headers?.get?.('x-real-ip')
            || 'unknown';

          const { getDb } = await import('@/lib/db');
          const { users, bannedIps } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');
          const db = getDb();

          const banned = await db.select().from(bannedIps).where(eq(bannedIps.ip, ip)).limit(1);
          if (banned.length > 0) return null;

          const result = await db
            .select()
            .from(users)
            .where(eq(users.username, credentials.username as string))
            .limit(1);

          const user = result[0];
          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!isValid) {
            await db.insert(bannedIps).values({ ip, reason: '密码错误' }).onConflictDoNothing();
            return null;
          }

          return { id: String(user.id), name: user.username, email: user.email };
        },
      }),
    ],
    session: { strategy: 'jwt' } as const,
  };
}

let _auth: ReturnType<typeof NextAuth> | null = null;

function getAuth() {
  if (!_auth) _auth = NextAuth(createAuthConfig());
  return _auth;
}

export const handlers = new Proxy({} as ReturnType<typeof NextAuth>['handlers'], {
  get(_t, prop) { return Reflect.get(getAuth().handlers, prop); },
});
export const auth = new Proxy({} as ReturnType<typeof NextAuth>['auth'], {
  apply(_t, _this, args) { return Reflect.apply(getAuth().auth, getAuth(), args); },
});
export const signIn = new Proxy({} as ReturnType<typeof NextAuth>['signIn'], {
  apply(_t, _this, args) { return Reflect.apply(getAuth().signIn, getAuth(), args); },
});
export const signOut = new Proxy({} as ReturnType<typeof NextAuth>['signOut'], {
  apply(_t, _this, args) { return Reflect.apply(getAuth().signOut, getAuth(), args); },
});
