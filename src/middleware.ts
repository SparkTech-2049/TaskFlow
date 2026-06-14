import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const ua = request.headers.get('user-agent') || '';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return NextResponse.redirect(new URL(isMobile ? '/m' : '/d', request.url));
  }

  // Auth check disabled for local development
  // TODO: Re-enable for production
  // const isAuthPage = pathname.endsWith('/login');
  // const sessionToken = request.cookies.get('authjs.session-token')?.value || request.cookies.get('__Secure-authjs.session-token')?.value;
  // if (!isAuthPage && !sessionToken) { ... }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/d/:path*', '/m/:path*'],
};
