import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PASSWORD = process.env.ACCESS_PASSWORD || 'change-me-in-env';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Always allow login page and auth API
  if (pathname === '/login' || pathname.startsWith('/api/auth') || pathname.startsWith('/api/generate')) {
    return NextResponse.next();
  }

  // Skip auth check for static/Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Check password cookie
  const password = request.cookies.get('access_password')?.value;

  if (password !== PROTECTED_PASSWORD) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};