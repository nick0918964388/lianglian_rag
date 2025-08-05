import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/datasets',
  '/chat'
];

// Define public routes that should redirect authenticated users
const PUBLIC_ROUTES = ['/login', '/register'];

// Define admin routes that require admin role
const ADMIN_ROUTES = ['/admin'];

/**
 * Validate JWT token structure and basic integrity
 * Note: Full JWT verification requires the secret which isn't available in middleware
 * This provides basic validation to prevent obvious tampering
 */
function isValidTokenStructure(token: string): boolean {
  try {
    const tokenData = JSON.parse(token);
    
    // Check if token has required structure
    if (!tokenData.token || !tokenData.user?.userId || !tokenData.user?.email) {
      return false;
    }
    
    // Basic JWT structure check (should have 3 parts separated by dots)
    const jwtParts = tokenData.token.split('.');
    if (jwtParts.length !== 3) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the auth token from cookies
  const authTokenCookie = request.cookies.get('auth-token')?.value;
  const isAuthenticated = authTokenCookie && isValidTokenStructure(authTokenCookie);

  // Check if current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Check if current path is public (should redirect if authenticated)
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Check if current path requires admin access
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Handle invalid token - clear it and redirect to login
  if (authTokenCookie && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    // Add query parameter to indicate authentication was required
    loginUrl.searchParams.set('reason', 'auth-required');
    
    return NextResponse.redirect(loginUrl);
  }

  // Handle admin routes (placeholder for future role-based access)
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('reason', 'admin-required');
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from public routes to dashboard
  if (isPublicRoute && isAuthenticated) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const redirectUrl = redirectParam && redirectParam.startsWith('/') 
      ? redirectParam 
      : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Add security headers for protected routes
  if (isProtectedRoute && isAuthenticated) {
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};