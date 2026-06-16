import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const ua = request.headers.get('user-agent') || '';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return NextResponse.redirect(new URL(isMobile ? '/m' : '/d', request.url));
  }

  const isAuthPage = pathname.endsWith('/login') || pathname.startsWith('/api/auth');
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  if (!isAuthPage && !sessionToken) {
    const isMobile = pathname.startsWith('/m');
    const loginUrl = new URL(isMobile ? '/m/login' : '/d/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/d/:path*', '/m/:path*'],
};
