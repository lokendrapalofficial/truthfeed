import { NextResponse } from "next/server";
import { fetchNews } from "@/app/actions/fetchNews";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Vercel's own cron system sends a special header — always allow it
  const isVercelCron = request.headers.get("x-vercel-signature") !== null;

  // Also allow explicit Bearer token if CRON_SECRET is configured
  const hasBearerAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasBearerAuth) {
    if (!cronSecret) {
      // No secret configured — allow through with a warning (dev mode)
      console.warn("CRON_SECRET not set — allowing unauthenticated cron call.");
    } else {
      console.warn("Unauthorized cron invocation blocked.");
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }
  }

  console.log("Cron trigger authorized — fetching RSS feeds...");
  const result = await fetchNews();

  if (result.success) {
    console.log(`Cron sync OK. Synced ${result.count} articles.`);
    return NextResponse.json({
      success: true,
      message: `Synced ${result.count} articles successfully.`,
      count: result.count,
    });
  } else {
    console.error("Cron sync failed:", result.error);
    return NextResponse.json(
      { success: false, error: result.error || "Unknown sync error" },
      { status: 500 }
    );
  }
}
