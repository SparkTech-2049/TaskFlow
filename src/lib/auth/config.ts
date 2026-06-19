import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: { id?: string } & DefaultSession['user'];
  }
}

function createAuthConfig() {
  return {
    trustHost: true,
    providers: [
      Credentials({
        name: 'credentials',
        credentials: {
          username: { label: '用户名', type: 'text' },
          password: { label: '密码', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) return null;

          const { getDb } = await import('@/lib/db');
          const { users, bannedIps } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');
          const db = getDb();

          const ip = 'unknown';

          try {
            const banned = await db.select().from(bannedIps).where(eq(bannedIps.ip, ip)).limit(1);
            if (banned.length > 0) return null;
          } catch {}

          const result = await db
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
    ],
    session: { strategy: 'jwt' } as const,
    callbacks: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jwt: ({ token, user }: any) => {
        if (user?.id) token.id = user.id;
        return token;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: ({ session, token }: any) => {
        if (token.id) session.user.id = String(token.id);
        return session;
      },
    },
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
