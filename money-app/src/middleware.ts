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
    const res =
      pathname === "/bluescope/public"
        ? NextResponse.next()
        : NextResponse.rewrite(new URL("/bluescope/public", request.url));
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  // Mọi domain khác: full app, không rewrite
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/favicon.ico"],
};
