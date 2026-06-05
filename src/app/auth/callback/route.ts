import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session?.user) {
      const userEmail = session.user.email || "";
      const userId = session.user.id;
      const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split("@")[0];

      // Check if user exists in db
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        // Create user
        await prisma.user.create({
          data: {
            id: userId,
            email: userEmail,
            name: userName,
            isPro: false,
          },
        });
        // Redirect to onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      } else if (!existingUser.preferences || (Array.isArray(existingUser.preferences) && (existingUser.preferences as any[]).length === 0)) {
        // If preferences are not configured yet, redirect to onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}
