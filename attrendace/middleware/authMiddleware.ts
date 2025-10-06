// middleware/authMiddleware.ts
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server';

export async function authmiddleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value || req.headers.get('authorization')?.split(' ')[1]; 
  if (!token) {
    // For API routes, return JSON error
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }
    // For pages, redirect to login
    return NextResponse.redirect(new URL('/', req.url));
  }
  const decoded = await verifyToken(token);
  if (!decoded) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  // if url with /admin/ and user is not admin
  if (req.nextUrl.pathname.startsWith('/admin/') && decoded.role !== 'Admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // if url with /worker and user is not worker
  if (req.nextUrl.pathname.startsWith('/worker') && decoded.role !== 'Worker') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Add user info to request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', decoded.id.toString());
  requestHeaders.set('x-user-role', decoded.role || '');

  // Continue with the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  
  return response;
}