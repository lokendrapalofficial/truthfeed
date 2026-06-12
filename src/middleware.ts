import { createMiddlewareClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  // Use getUser() instead of getSession() to securely revalidate the session
  const { data: { user } } = await supabase.auth.getUser();

  // Protect specific routes (e.g. /dashboard or /onboarding)
  const url = req.nextUrl.clone();
  
  if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/onboarding")) {
    if (!user) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
