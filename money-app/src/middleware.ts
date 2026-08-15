import { NextRequest, NextResponse } from "next/server";

/**
 * Hostname routing:
 *  - bluescope.thanhpham.fun  → chỉ tab Bluescope public (edit được, không auth)
 *  - money.thanhpham.fun      → full app (yêu cầu password gate ở client)
 *  - localhost / khác          → full app
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const { pathname } = request.nextUrl;

  // Skip static assets & API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|map|json)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Bluescope domain: rewrite tất cả về /bluescope/public
  if (host.startsWith("bluescope.")) {
    if (pathname === "/bluescope/public") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/bluescope/public";
    return NextResponse.rewrite(url);
  }

  // Mọi domain khác: full app, không rewrite
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/favicon.ico"],
};
