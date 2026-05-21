import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const publicPaths = ['/', '/buy', '/buy/', '/login', '/seller/dashboard', '/orders'];
  const path = request.nextUrl.pathname;
  
  if (publicPaths.some(p => path === p || path.startsWith('/buy/'))) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
