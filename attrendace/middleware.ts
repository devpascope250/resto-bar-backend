// // middleware.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { authmiddleware } from './middleware/authMiddleware';
// // const ALLOWED_ORIGINS = [
// //   'http://192.168.0.43:3000/',
// // ].filter(Boolean);
// export async function middleware(request: NextRequest) {
//   // const response = NextResponse.next();
//     // Add CORS headers to all responses
// //   const origin = request.headers.get('origin');
// //  if (origin && ALLOWED_ORIGINS.includes(origin)) {
// //   response.headers.set('Access-Control-Allow-Origin', origin);
// // }
// //   response.headers.set('Access-Control-Allow-Credentials', 'true');
// //   response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
// //   response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
//   return await authmiddleware(request);
// }

// export const config = {
//   matcher: [
//     '/admin/:path*',
//     '/worker/:path*',
//     '/api/auth/basic_info/:path*',
//     '/api/admin/:path*',
//   ],
// };














// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { authmiddleware } from './middleware/authMiddleware';

const ALLOWED_ORIGINS = [
  'http://192.168.0.43:3000',
  'http://192.168.169.43:3000', // Add your mobile app's origin
].filter(Boolean);

export async function middleware(request: NextRequest) {
  // Handle OPTIONS requests (CORS preflight)
  if (request.method === 'OPTIONS') {
    const response = NextResponse.next();
    
    const origin = request.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-platform');
    
    return response;
  }

  // Add CORS headers to all responses
  const response = await authmiddleware(request);
  
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-platform');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/worker/:path*',
    '/api/auth/basic_info/:path*',
    '/api/admin/:path*',
    '/api/worker/:path*',
  ],
};