import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, API routes, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // All other requests → legacy dashboard
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard-v2.html";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/favicon.ico", "/dashboard-v2.html"],
};
