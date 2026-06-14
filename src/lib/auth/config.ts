import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';

function createAuthConfig() {
  const { getDb } = require('@/lib/db');
  return {
    adapter: DrizzleAdapter(getDb()),
    providers: [
      Credentials({
        name: 'credentials',
        credentials: {
          username: { label: '用户名', type: 'text' },
          password: { label: '密码', type: 'password' },
        },
        async authorize(credentials: Partial<Record<string, unknown>>) {
          if (!credentials?.username || !credentials?.password) return null;
          const { getDb } = await import('@/lib/db');
          const { users } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');
          const result = await getDb()
            .select()
            .from(users)
            .where(eq(users.username, credentials.username as string))
            .limit(1);
          const user = result[0];
          if (!user || !user.passwordHash) return null;
          const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!isValid) return null;
          return { id: String(user.id), name: user.username, email: user.email };
        },
      }),
      GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    ],
    session: { strategy: 'jwt' } as const,
    pages: { signIn: '/m/login' },
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
