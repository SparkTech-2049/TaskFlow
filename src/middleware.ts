import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 根路径：根据 UA 重定向到移动端/桌面端（边缘运行，比 page.tsx 重定向更快）
  if (pathname === '/') {
    const ua = request.headers.get('user-agent') || '';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return NextResponse.redirect(new URL(isMobile ? '/m' : '/d', request.url));
  }

  // 登录页和 NextAuth API 放行
  const isAuthPage = pathname.endsWith('/login') || pathname.startsWith('/api/auth');
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  // 非登录页且无 session -> 重定向到对应登录页
  if (!isAuthPage && !sessionToken) {
    const isMobile = pathname.startsWith('/m');
    const loginUrl = new URL(isMobile ? '/m/login' : '/d/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 仅匹配需要的路由，避免拦截：
// - 静态资源 (_next/static, _next/image, favicon, manifest 等)
// - 所有 API 路由 (/api/*)
// - 登录页已在逻辑里放行
export const config = {
  matcher: [
    '/',           // 首页重定向
    '/d/:path*',   // 桌面端所有页面
    '/m/:path*',   // 移动端所有页面
  ],
};