import { createMiddlewareClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Protect specific routes (e.g. /dashboard or /onboarding)
  const url = req.nextUrl.clone();
  
  if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/onboarding")) {
    if (!session) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
