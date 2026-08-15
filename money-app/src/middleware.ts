import { NextRequest, NextResponse } from "next/server";

const BLUESCOPE_PUBLIC_PATH = "/bluescope/public";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const { pathname } = request.nextUrl;

  if (!host.startsWith("bluescope.")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === BLUESCOPE_PUBLIC_PATH
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = BLUESCOPE_PUBLIC_PATH;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/favicon.ico"],
};
