import { NextResponse } from "next/server";
import { fetchNews } from "@/app/actions/fetchNews";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Check authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET environment variable is not set.");
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized cron invocation attempt blocked.");
    return NextResponse.json(
      { error: "Unauthorized access." },
      { status: 401 }
    );
  }

  console.log("Authorized cron trigger: fetching RSS feed news...");
  const result = await fetchNews();

  if (result.success) {
    console.log(`Cron job sync successful. Synced ${result.count} articles.`);
    return NextResponse.json({
      success: true,
      message: `News synchronized successfully. Synced ${result.count} articles.`,
      count: result.count,
    });
  } else {
    console.error("Cron job sync failed:", result.error);
    return NextResponse.json(
      { success: false, error: result.error || "Unknown sync error" },
      { status: 500 }
    );
  }
}
