// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// const PROTECTED = ['/dashboard', '/permissions'];
// const VERIFY_URL = process.env.VERIFY_URL; // e.g. https://frontend.example.com/api/verify-owner

// export async function middleware(req: NextRequest) {
//   const { nextUrl, cookies } = req;
//   const pathname = nextUrl.pathname;
//   const isProtected = PROTECTED.some(p => pathname.startsWith(p));
//   if (!isProtected) return NextResponse.next();

//   const urlToken = nextUrl.searchParams.get('token');
//   const role = cookies.get('dt_role')?.value;
//   const cookieToken = cookies.get('dt_access')?.value;

//   // already authorized
//   if (role === 'owner' || role === 'admin' || (cookieToken && cookieToken.length > 0)) {
//     return NextResponse.next();
//   }

//   // verify URL token with external app
//   if (urlToken) {
//     if (!VERIFY_URL) {
//       return NextResponse.redirect(new URL('/gallery', nextUrl.origin));
//     }

//     try {
//       const res = await fetch(`${VERIFY_URL}?token=${encodeURIComponent(urlToken)}`, {
//         method: 'GET',
//         headers: { 'accept': 'application/json' },
//         cache: 'no-store',
//       });
//       if (!res.ok) throw new Error('verify endpoint error');
//       const data = await res.json();
//       if (data?.valid && (data.role === 'owner' || data.role === 'admin')) {
//         const redirect = NextResponse.redirect(new URL(pathname, nextUrl.origin));
//         redirect.cookies.set('dt_role', data.role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 30 });
//         redirect.cookies.set('dt_access', urlToken, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 30 });
//         if (data.eventId) redirect.cookies.set('dt_event', String(data.eventId), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 30 });
//         if (data.userId) redirect.cookies.set('dt_user', String(data.userId), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 30 });
//         return redirect;
//       }
//     } catch {
//       // fall-through
//     }
//   }

//   return NextResponse.redirect(new URL('/gallery', nextUrl.origin));
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/permissions/:path*'],
// };


