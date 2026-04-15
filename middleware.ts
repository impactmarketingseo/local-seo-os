import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PASSWORD = process.env.ACCESS_PASSWORD || 'change-me-in-env';

export function middleware(request: NextRequest) {
  // Skip password check for auth API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }
  
  // Check for password in cookie or header
  const password = request.cookies.get('access_password')?.value || request.headers.get('x-access-password');
  
  if (password !== PROTECTED_PASSWORD) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/login') {
      return NextResponse.next();
    }
    
    // Redirect to login for all other pages
    if (!request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return new NextResponse('Password Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Private Area"',
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
