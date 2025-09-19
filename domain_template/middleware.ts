import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  
  // Extract tenant from subdomain
  // Example: <tenant>.events.example.com → "tenant"
  // Example: localhost:3000 → use DEFAULT_TENANT
  const hostParts = host.split('.');
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  let tenant: string | null = null;
  
  if (isLocalhost) {
    // For localhost, use query param or default
    tenant = url.searchParams.get('tenant') || process.env.DEFAULT_TENANT || null;
  } else {
    // For production, extract from subdomain
    const [subdomain] = hostParts;
    tenant = subdomain && subdomain !== 'www' && subdomain !== 'app' ? subdomain : process.env.DEFAULT_TENANT || null;
  }

  // Propagate tenant via header for server components
  const res = NextResponse.next();
  if (tenant) {
    res.headers.set('x-tenant', tenant);
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public).*)'],
};


