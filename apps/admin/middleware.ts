// Basic middleware for Next.js App Router.
// The existing repo had apps/admin/middleware.ts exporting next-auth middleware,
// but the admin UI project needs a valid Next middleware file to compile.

// Avoid importing Next runtime types to keep strict TS compiling even
// if Next's types aren't resolved in certain editor states.

export function middleware(_req: unknown) {
  // Let Next handle routing.
  return null;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


