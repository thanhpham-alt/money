import { NextRequest, NextResponse } from "next/server";

/**
 * Bản đang dùng = dashboard-v2.html (UI mới nhất).
 * Next.js giữ API: /api/daily-expenses, /api/daily-expenses/ocr, /api/state.
 *
 *  - money.thanhpham.fun      → dashboard-v2.html (pass lock trong HTML)
 *  - bluescope.thanhpham.fun  → cùng file, HTML tự vào tab Bluescope (sửa được, ẩn CTV)
 */
function withNoStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/dashboard-v2.html" ||
    pathname === "/bluescope-public.html" ||
    /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|map|json|html)$/.test(pathname)
  ) {
    return withNoStore(NextResponse.next());
  }

  const url = request.nextUrl.clone();
  url.pathname = "/dashboard-v2.html";
  return withNoStore(NextResponse.rewrite(url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
